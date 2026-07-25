const QUIZ_BANK = require('./quizquestions');

const QUESTIONS_PER_GAME = 10;
const ROUND_DURATION_SECONDS = 120; // 2 minutes

const rooms = {}; // roomId -> room state

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickQuestions(category) {
  const pool = QUIZ_BANK[category] || QUIZ_BANK["General Knowledge"];
  return shuffle(pool).slice(0, QUESTIONS_PER_GAME);
}

// Strip the "correct" field before sending to clients
function sanitizeQuestions(questions) {
  return questions.map(({ q, options }) => ({ q, options }));
}

function playerListPayload(room) {
  return Object.values(room.players).map(p => ({
    username: p.username,
    score: p.score,
    finished: p.finished
  }));
}

function finalizeRoom(io, roomId) {
  const room = rooms[roomId];
  if (!room || !room.started) return;

  clearTimeout(room.timeoutHandle);
  room.started = false;

  // Anyone who never submitted gets scored as 0 correct / max time
  Object.values(room.players).forEach(p => {
    if (!p.finished) {
      p.score = p.score || 0;
      p.timeTakenMs = ROUND_DURATION_SECONDS * 1000;
      p.finished = true;
    }
  });

  const leaderboard = Object.values(room.players)
    .map(p => ({ username: p.username, score: p.score, timeTakenMs: p.timeTakenMs }))
    .sort((a, b) => (b.score - a.score) || (a.timeTakenMs - b.timeTakenMs));

  io.to(roomId).emit('quiz_results', { leaderboard });
}

module.exports = function handleQuizSockets(io) {
  io.on('connection', (socket) => {

    socket.on('join_quiz_room', ({ roomId, username, category }) => {
      if (!roomId) return;
      socket.join(roomId);

      if (!rooms[roomId]) {
        rooms[roomId] = {
          category: category || 'General Knowledge',
          hostId: socket.id,
          started: false,
          players: {},
          questions: [],
          timeoutHandle: null
        };
      }

      const room = rooms[roomId];
      room.players[socket.id] = {
        id: socket.id,
        username: username || `Player_${socket.id.substring(0, 4)}`,
        score: 0,
        timeTakenMs: 0,
        finished: false
      };

      socket.emit('quiz_you_are_host', { isHost: room.hostId === socket.id });
      io.to(roomId).emit('quiz_player_joined', {
        players: playerListPayload(room),
        category: room.category
      });
    });

    socket.on('start_quiz', ({ roomId }) => {
      const room = rooms[roomId];
      if (!room || room.started) return;
      if (room.hostId !== socket.id) return; // only host can start

      room.questions = pickQuestions(room.category);
      room.started = true;
      room.startTime = Date.now();
      Object.values(room.players).forEach(p => {
        p.score = 0;
        p.timeTakenMs = 0;
        p.finished = false;
      });

      io.to(roomId).emit('quiz_start', {
        questions: sanitizeQuestions(room.questions),
        duration: ROUND_DURATION_SECONDS
      });

      room.timeoutHandle = setTimeout(() => finalizeRoom(io, roomId), ROUND_DURATION_SECONDS * 1000 + 1500);
    });

    socket.on('submit_quiz_answers', ({ roomId, answers }) => {
      const room = rooms[roomId];
      if (!room || !room.started) return;
      const player = room.players[socket.id];
      if (!player || player.finished) return;

      let score = 0;
      room.questions.forEach((question, idx) => {
        if (answers && answers[idx] === question.correct) score += 1;
      });

      player.score = score;
      player.timeTakenMs = Date.now() - room.startTime;
      player.finished = true;

      io.to(roomId).emit('quiz_player_joined', { players: playerListPayload(room), category: room.category });

      const allFinished = Object.values(room.players).every(p => p.finished);
      if (allFinished) finalizeRoom(io, roomId);
    });

    socket.on('request_quiz_play_again', ({ roomId }) => {
      const room = rooms[roomId];
      if (!room) return;
      room.started = false;
      Object.values(room.players).forEach(p => {
        p.score = 0;
        p.timeTakenMs = 0;
        p.finished = false;
      });
      io.to(roomId).emit('quiz_player_joined', { players: playerListPayload(room), category: room.category });
      io.to(roomId).emit('quiz_reset');
    });

    socket.on('disconnect', () => {
      for (const roomId in rooms) {
        const room = rooms[roomId];
        if (!room.players[socket.id]) continue;

        delete room.players[socket.id];
        const remainingIds = Object.keys(room.players);

        if (remainingIds.length === 0) {
          clearTimeout(room.timeoutHandle);
          delete rooms[roomId];
          continue;
        }

        if (room.hostId === socket.id) {
          room.hostId = remainingIds[0];
          io.to(room.hostId).emit('quiz_you_are_host', { isHost: true });
        }

        io.to(roomId).emit('quiz_player_joined', { players: playerListPayload(room), category: room.category });

        if (room.started && Object.values(room.players).every(p => p.finished)) {
          finalizeRoom(io, roomId);
        }
      }
    });
  });
};