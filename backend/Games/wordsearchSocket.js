const express = require('express');
const router = express.Router();

const GRID_SIZE = 10;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// 10 themed word banks, cycled to build 50 puzzles total.
const THEMES = [
  { category: 'Animals', words: ['TIGER', 'ZEBRA', 'EAGLE', 'SHARK', 'RABBIT', 'PANDA'] },
  { category: 'Coding', words: ['PYTHON', 'REACT', 'ARRAY', 'DEBUG', 'SERVER', 'LOGIC'] },
  { category: 'Weather', words: ['SUNNY', 'RAINY', 'CLOUD', 'WINDY', 'STORM', 'FROST'] },
  { category: 'Fruits', words: ['APPLE', 'GRAPE', 'MANGO', 'PEACH', 'LEMON', 'BERRY'] },
  { category: 'Sports', words: ['SOCCER', 'TENNIS', 'RUGBY', 'BOXING', 'HOCKEY', 'GOLF'] },
  { category: 'Countries', words: ['FRANCE', 'BRAZIL', 'JAPAN', 'EGYPT', 'KENYA', 'SPAIN'] },
  { category: 'Colors', words: ['PURPLE', 'ORANGE', 'YELLOW', 'SILVER', 'VIOLET', 'AMBER'] },
  { category: 'Space', words: ['PLANET', 'COMET', 'GALAXY', 'ORBIT', 'ROCKET', 'LUNAR'] },
  { category: 'Ocean', words: ['CORAL', 'WHALE', 'OCEAN', 'WAVES', 'BEACH', 'TIDAL'] },
  { category: 'School', words: ['PENCIL', 'RECESS', 'SCHOOL', 'LESSON', 'LIBRARY', 'GRADE'] }
];

const DIRECTIONS = [
  { dr: 0, dc: 1 },   // right
  { dr: 0, dc: -1 },  // left
  { dr: 1, dc: 0 },   // down
  { dr: -1, dc: 0 },  // up
  { dr: 1, dc: 1 },   // down-right
  { dr: 1, dc: -1 },  // down-left
  { dr: -1, dc: 1 },  // up-right
  { dr: -1, dc: -1 }  // up-left
];

function randInt(max) { return Math.floor(Math.random() * max); }

function buildGrid(words) {
  const grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));

  words.forEach((word) => {
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 200) {
      attempts++;
      const dir = DIRECTIONS[randInt(DIRECTIONS.length)];
      const len = word.length;

      // Pick a start cell such that the whole word fits inside the grid along this direction
      const minRow = dir.dr === -1 ? len - 1 : 0;
      const maxRow = dir.dr === 1 ? GRID_SIZE - len : GRID_SIZE - 1;
      const minCol = dir.dc === -1 ? len - 1 : 0;
      const maxCol = dir.dc === 1 ? GRID_SIZE - len : GRID_SIZE - 1;
      if (minRow > maxRow || minCol > maxCol) continue;

      const startRow = minRow + randInt(maxRow - minRow + 1);
      const startCol = minCol + randInt(maxCol - minCol + 1);

      // Check for conflicts (a cell must be empty or already match the same letter)
      let fits = true;
      for (let i = 0; i < len; i++) {
        const r = startRow + dir.dr * i;
        const c = startCol + dir.dc * i;
        const existing = grid[r][c];
        if (existing !== null && existing !== word[i]) { fits = false; break; }
      }
      if (!fits) continue;

      for (let i = 0; i < len; i++) {
        const r = startRow + dir.dr * i;
        const c = startCol + dir.dc * i;
        grid[r][c] = word[i];
      }
      placed = true;
    }
  });

  // Fill remaining empty cells with random scrambled letters
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === null) {
        grid[r][c] = ALPHABET[randInt(ALPHABET.length)];
      }
    }
  }

  return grid;
}

// Build the 50-puzzle database once at server startup
const WORD_SEARCH_DB = [];
for (let i = 1; i <= 50; i++) {
  const theme = THEMES[(i - 1) % THEMES.length];
  WORD_SEARCH_DB.push({
    id: i,
    category: theme.category,
    words: theme.words,
    grid: buildGrid(theme.words)
  });
}

// In-Memory Storage for User Progress and Used Puzzles
const userBestTimes = {};   // { username: bestTimeInSeconds }
const userUsedPuzzles = {}; // { username: [puzzleId1, puzzleId2] }
const userLastPlayed = {};  // { username: "YYYY-MM-DD" }

// Helper: Get Today's Date String (YYYY-MM-DD)
const getTodayDateStr = () => new Date().toISOString().split('T')[0];

// Endpoint: Get Daily Word Search Puzzle
router.get('/api/wordsearch/puzzle', (req, res) => {
  const username = req.query.username || 'Player';
  const today = getTodayDateStr();

  // Check Daily Limit
  if (userLastPlayed[username] === today) {
    return res.status(403).json({
      completedToday: true,
      message: "You have already completed today's Word Search! Come back tomorrow."
    });
  }

  if (!userUsedPuzzles[username]) {
    userUsedPuzzles[username] = [];
  }

  // Find unused puzzle
  const availablePuzzles = WORD_SEARCH_DB.filter(
    p => !userUsedPuzzles[username].includes(p.id)
  );

  // Error condition when all 50 puzzles are exhausted
  if (availablePuzzles.length === 0) {
    return res.status(410).json({
      exhausted: true,
      message: "Report immediately! All 50 Word Search puzzles have been completed."
    });
  }

  // Pick next unused puzzle
  const selectedPuzzle = availablePuzzles[randInt(availablePuzzles.length)];

  res.json({
    completedToday: false,
    puzzleId: selectedPuzzle.id,
    category: selectedPuzzle.category,
    grid: selectedPuzzle.grid,
    words: selectedPuzzle.words,
    userBestTime: userBestTimes[username] || null
  });
});

// Endpoint: Submit Completion Time
router.post('/api/wordsearch/submit', (req, res) => {
  const { username, puzzleId, timeTaken } = req.body;
  const today = getTodayDateStr();

  if (!username || !puzzleId || timeTaken === undefined) {
    return res.status(400).json({ error: "Missing submission parameters" });
  }

  // Record daily play & mark puzzle as used
  userLastPlayed[username] = today;
  if (!userUsedPuzzles[username]) userUsedPuzzles[username] = [];
  if (!userUsedPuzzles[username].includes(puzzleId)) {
    userUsedPuzzles[username].push(puzzleId);
  }

  // Update Personal Best Time
  let isNewBest = false;
  const currentBest = userBestTimes[username];
  if (currentBest === undefined || timeTaken < currentBest) {
    userBestTimes[username] = timeTaken;
    isNewBest = true;
  }

  res.json({
    success: true,
    timeTaken,
    bestTime: userBestTimes[username],
    isNewBest
  });
});

module.exports = router;