const fs = require('fs');
const path = require('path');
const evaluateDrawing = require('./judge'); // Ensure judge.js exports an async evaluation function

// Configurable Server Host Base URL for static media assets
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5000';

// --- Data & State Initialization ---
const promptsPath = process.env.PROMPTS_FILE_PATH || path.join(__dirname, 'drawing_prompts.json');

let promptsDataset = [];
try {
  const rawData = fs.readFileSync(promptsPath, 'utf-8');
  promptsDataset = JSON.parse(rawData);
  console.log('Successfully loaded drawing prompts!');
} catch (error) {
  console.error('Error loading drawing_prompts.json:', error.message);
}

// Global state trackers
let usedPromptIds = new Set();
let currentDailyPrompt = null;
let lastSelectedDate = null;

let usersStore = {}; 
let dailySubmissions = [];

// Helper: Formats relative image URLs into clean absolute URLs for the React frontend
function formatPromptData(prompt) {
  if (!prompt) return null;
  let referenceUrl = prompt.referenceUrl || prompt.image || prompt.imageUrl || '';
  
  if (referenceUrl && !referenceUrl.startsWith('http://') && !referenceUrl.startsWith('https://') && !referenceUrl.startsWith('data:')) {
    const cleanPath = referenceUrl.startsWith('/') ? referenceUrl : `/${referenceUrl}`;
    referenceUrl = `${SERVER_BASE_URL}${cleanPath}`;
  }

  return {
    ...prompt,
    referenceUrl
  };
}

// --- Prompt Selection Helper ---
function getOrUpdateDailyPrompt() {
  const todayStr = new Date().toISOString().slice(0, 10); // Format: "YYYY-MM-DD"

  // Check if it's a new day or if no prompt is currently set
  if (lastSelectedDate !== todayStr || !currentDailyPrompt) {
    let availablePrompts = promptsDataset.filter(p => !usedPromptIds.has(p.id));

    // Auto-reset when prompt list is exhausted to prevent application breakage
    if (availablePrompts.length === 0 && promptsDataset.length > 0) {
      usedPromptIds.clear();
      availablePrompts = [...promptsDataset];
    }

    if (availablePrompts.length === 0) {
      return { 
        error: "No drawing prompts available in dataset." 
      };
    }

    const nextPrompt = availablePrompts[0];
    
    usedPromptIds.add(nextPrompt.id);
    currentDailyPrompt = nextPrompt;
    lastSelectedDate = todayStr;
    
    // Reset daily submissions for the new day
    dailySubmissions = [];
  }

  return { prompt: formatPromptData(currentDailyPrompt) };
}

// --- Leaderboard Helper ---
function getLeaderboards() {
  const allUsers = Object.values(usersStore);
  const sorted = [...allUsers].sort((a, b) => b.score - a.score);

  return {
    today: sorted,
    thisWeek: sorted
  };
}

// --- Socket Handler ---
module.exports = function handleDrawSockets(io) {
  io.on('connection', (socket) => {

    // 1. Initialize drawing challenge for a user
    socket.on('init_draw_challenge', ({ username }) => {
      const activeUser = (username && username.trim()) ? username.trim() : "Player1";
      socket.username = activeUser;

      // Register or sync user profile
      if (!usersStore[activeUser]) {
        usersStore[activeUser] = {
          username: activeUser,
          score: 0,
          streak: 1,
          bestScore: 0
        };
      }

      const promptResult = getOrUpdateDailyPrompt();

      if (promptResult.error) {
        socket.emit('prompt_error', { message: promptResult.error });
      } else {
        socket.emit('prompt_data', promptResult.prompt);
      }

      // Send current leaderboard snapshot directly to this socket
      socket.emit('leaderboard_update', getLeaderboards());
    });

    // 2. Handle Drawing Submissions
    socket.on('submit_drawing', async ({ username, image, promptId }) => {
      const activeUser = (username && username.trim()) ? username.trim() : (socket.username || "Player1");
      const promptResult = getOrUpdateDailyPrompt();

      if (promptResult.error || !promptResult.prompt) {
        return socket.emit('prompt_error', { 
          message: promptResult.error || "No active prompt available to score." 
        });
      }

      const activePrompt = promptResult.prompt;

      try {
        // Invoke AI Agent judge function
        const judgeResult = await evaluateDrawing(activePrompt.referenceUrl, image);

        const totalScore = judgeResult.score ?? 0;
        const feedback = judgeResult.feedback || "Submission processed successfully.";
        const breakdown = judgeResult.breakdown || {};

        // Store daily submission
        const submission = {
          username: activeUser,
          image,
          score: totalScore,
          timestamp: new Date()
        };
        dailySubmissions.push(submission);

        // Update User Profile state
        if (!usersStore[activeUser]) {
          usersStore[activeUser] = { username: activeUser, score: 0, streak: 1, bestScore: 0 };
        }
        const user = usersStore[activeUser];
        user.score = Math.max(user.score, totalScore);
        if (totalScore > user.bestScore) user.bestScore = totalScore;

        const highestScore = Math.max(...dailySubmissions.map(s => s.score));
        const isLeader = totalScore >= highestScore;

        // Emit evaluation output back to submitter
        socket.emit('score_calculated', {
          totalScore,
          breakdown,
          feedback,
          isLeader
        });

        // Matchup Update: Pair with another user's submission from today
        const opponent = dailySubmissions.find(s => s.username !== activeUser);
        socket.emit('matchup_update', {
          userScore: totalScore,
          opponent: opponent ? { username: opponent.username, score: opponent.score, image: opponent.image } : null
        });

        // Broadcast updated leaderboard globally to all connected clients
        io.emit('leaderboard_update', getLeaderboards());

      } catch (err) {
        console.error("Error running AI judge scoring:", err);
        socket.emit('score_error', { message: "Failed to evaluate submission via judge agent." });
      }
    });
  });
};