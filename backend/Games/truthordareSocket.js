const express = require('express');
const router = express.Router();

// 50 TRUTHS & 50 DARES DATABASE
const truths = [
  "What's the most embarrassing thing you've ever done?",
  "Have you ever lied to get out of plans?",
  "What is your biggest guilty pleasure?",
  "What is a secret you've never told anyone here?",
  "What was your worst first date experience?",
  "Have you ever had a crush on a friend's partner?",
  "What's the weirdest habit you have when you're alone?",
  "What is the most ridiculous rumor you've heard about yourself?",
  "What is something you're afraid to tell your parents?",
  "Have you ever cheated on a test?",
  "What’s the last lie you told?",
  "What is your biggest fear in a relationship?",
  "Have you ever re-gifted a present?",
  "What's the most illegal thing you've ever done?",
  "Who was your first celebrity crush?",
  "What’s a bad habit you can’t seem to break?",
  "Have you ever sent a text to the wrong person that ruined your day?",
  "What's the weirdest dream you've ever had?",
  "What is one thing you would change about your personality?",
  "What’s your biggest pet peeve?",
  "Have you ever stalked an ex on social media?",
  "What is the most expensive thing you've accidentally broken?",
  "Have you ever pretended to like a gift you hated?",
  "What's a weird food combination you actually enjoy?",
  "What is your biggest regret?",
  "Have you ever blamed someone else for a mess you made?",
  "What's the longest you've gone without showering?",
  "What is something you're insecure about?",
  "Have you ever had an awkward encounter with a stranger?",
  "What’s the worst haircut you’ve ever gotten?",
  "Have you ever eavesdropped on a private conversation?",
  "What’s your most childish fear?",
  "What is the most awkward compliment you've ever received?",
  "Have you ever pretended to know a song/movie you didn't know?",
  "What’s the most useless talent you have?",
  "Have you ever cried during a movie? Which one?",
  "What's a rule you secretly love breaking?",
  "What is the worst text message you've ever received?",
  "Have you ever accidentally spoiled a surprise?",
  "What’s the most embarrassing pet name you've had?",
  "What is something you bought and immediately regretted?",
  "Have you ever gotten caught sneaking out or doing something bad?",
  "What’s your biggest fashion fail from the past?",
  "What’s a secret skill nobody knows you have?",
  "Have you ever pretended to be sick to skip school/work?",
  "What’s the worst advice you’ve ever taken?",
  "Have you ever ghosted someone?",
  "What's the strangest place you've fallen asleep?",
  "What’s the funniest nickname you’ve ever been given?",
  "If you had to trade lives with someone in this room, who would it be?"
];

const dares = [
  "Do 15 jumping jacks right now.",
  "Speak in a British accent for the next 3 turns.",
  "Let the other player send a funny emoji to anyone on your recent texts.",
  "Do your best impression of a famous celebrity.",
  "Try to touch your nose with your tongue.",
  "Dance with no music for 30 seconds.",
  "Show the last photo in your phone gallery.",
  "Let the other player redesign your hair for the round.",
  "Sing the chorus of your favorite song loudly.",
  "Hold a plank for 30 seconds.",
  "Talk like a pirate until your next turn.",
  "Do 10 push-ups.",
  "Let the other player write a word on your arm with a washable marker or finger.",
  "Imitate the person sitting across from you.",
  "Try to make the other player laugh in under 30 seconds without touching them.",
  "Whisper everything you say for the next two turns.",
  "Post a silly selfie on your story or send it to a group chat.",
  "Pretend to be a cat and meow 3 times.",
  "Eat a tablespoon of hot sauce or ketchup.",
  "Do a dramatic runway walk across the room.",
  "Let the other player pick a nickname for you for the rest of the game.",
  "Try to balance a spoon on your nose for 10 seconds.",
  "Act like a robot until your next turn.",
  "Say 3 nice things about the other player in a very serious tone.",
  "Do your best evil villain laugh.",
  "Try to spin around 5 times and walk in a straight line.",
  "Keep your eyes closed for the next turn.",
  "Tell a dad joke with a completely straight face.",
  "Do an impression of your favorite cartoon character.",
  "Try to juggle 3 small items for 10 seconds.",
  "Speak in rhymes for your next 2 responses.",
  "Pretend you are an opera singer and sing what you're doing next.",
  "Do 20 squats.",
  "Allow the other player to look through your recent search history for 10 seconds.",
  "High-five the wall 10 times quickly.",
  "Make a funny face and hold it for 15 seconds while the other player looks at you.",
  "Recite the alphabet backwards as fast as you can.",
  "Talk without moving your lips for 1 minute.",
  "Do your best slow-motion running impression.",
  "Let the other player choose an emoji you must reply with for the rest of the game.",
  "Act like a news anchor breaking absurd news.",
  "Spin in a circle while singing 'Happy Birthday'.",
  "Try to touch your toes without bending your knees for 15 seconds.",
  "Do your best laugh impression of a hyena.",
  "Pretend you are underwater for 20 seconds.",
  "Say the pledge of allegiance or sing a nursery rhyme in a heavy accent.",
  "Try to tickle yourself without laughing.",
  "Put an ice cube in your hand and hold it until it melts (or for 30 seconds).",
  "Do 5 star jumps while shouting your own name.",
  "Give a 30-second motivational speech to an imaginary audience."
];

// HTTP REST Route for fetching initial prompt list
router.get('/api/truth-or-dare', (req, res) => {
  res.json({ truths, dares });
});

// Store room state in-memory
const activeRooms = {};

// SOCKET REALTIME EVENT HANDLERS
function handleTruthOrDareSockets(io) {
io.on('connection', (socket) => {

  // 1. Join Room Event
  socket.on('join_room', ({ roomId, username }) => {
    socket.join(roomId);

    if (!activeRooms[roomId]) {
      activeRooms[roomId] = {
        players: [],
        currentTurn: username
      };
    }

    const room = activeRooms[roomId];
    if (!room.players.includes(username)) {
      room.players.push(username);
    }

    // Broadcast updated player list & current turn to room
    io.to(roomId).emit('room_state_update', {
      players: room.players,
      currentTurn: room.currentTurn
    });
  });

  // 2. Select Truth or Dare Mode Event
  socket.on('select_mode', ({ roomId, mode }) => {
    io.to(roomId).emit('mode_changed', { mode });
  });

  // 3. Sync Wheel Spin Animation Start
  socket.on('trigger_spin', ({ roomId, extraRotation }) => {
    io.to(roomId).emit('wheel_spin_start', { extraRotation });
  });

  // 4. Sync Spin Result & Turn Change
  socket.on('complete_spin_turn', ({ roomId, prompt, nextTurnPlayer }) => {
    if (activeRooms[roomId]) {
      activeRooms[roomId].currentTurn = nextTurnPlayer;
    }

    io.to(roomId).emit('spin_result_received', {
      prompt,
      nextTurnPlayer
    });
  });

  // 5. Reset/Switch Mode Event
  socket.on('reset_mode', ({ roomId }) => {
    io.to(roomId).emit('mode_reset');
  });

  socket.on('disconnecting', () => {
    for (const roomId of socket.rooms) {
      if (activeRooms[roomId]) {
        activeRooms[roomId].players = activeRooms[roomId].players.filter(id => id !== socket.id);
      }
    }
  });
});
}

module.exports = { router, handleTruthOrDareSockets };