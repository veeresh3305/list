const ROUND_SECONDS = 15;
const ROUNDS_PER_GAME = 8;

const WYR_QUESTIONS = [
  { a: "Be able to fly", b: "Be invisible" },
  { a: "Always be 10 minutes late", b: "Always be 20 minutes early" },
  { a: "Give up your phone for a month", b: "Give up your favorite food for a month" },
  { a: "Live without music", b: "Live without movies/TV" },
  { a: "Have unlimited money", b: "Have unlimited time" },
  { a: "Be able to speak every language", b: "Be able to talk to animals" },
  { a: "Never use social media again", b: "Never watch another movie again" },
  { a: "Always know when someone is lying", b: "Always get away with lying" },
  { a: "Live in a big city", b: "Live in a small countryside town" },
  { a: "Relive your favorite memory forever", b: "Make a brand new memory every day" },
  { a: "Have a rewind button for your life", b: "Have a pause button for your life" },
  { a: "Explore space", b: "Explore the deep ocean" },
  { a: "Be famous", b: "Be extremely wealthy but unknown" },
  { a: "Only be able to whisper", b: "Only be able to shout" },
  { a: "Have super strength", b: "Have super speed" },
  { a: "Never have to sleep", b: "Never have to eat" }
];

const rooms = {}; // roomId -> room state

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function playerListPayload(room) {
  return Object.values(room.players).map(p => ({ username: p.username }));
}

function startRound(io, roomId) {
  const room = rooms[roomId];
  if (!room) return;

  if (room.roundIndex >= room.questions.length) {
    room.started = false;
    io.to(roomId).emit('wyr_final');
    return;
  }

  room.currentVotes = {};
  const question = room.questions[room.roundIndex];

  io.to(roomId).emit('wyr_round', {
    optionA: question.a,
    optionB: question.b,
    roundIndex: room.roundIndex,
    total: room.questions.length,
    duration: ROUND_SECONDS
  });

  clearTimeout(room.timeoutHandle);
  room.timeoutHandle = setTimeout(() => revealRound(io, roomId), ROUND_SECONDS * 1000 + 500);
}

function revealRound(io, roomId) {
  const room = rooms[roomId];
  if (!room) return;
  clearTimeout(room.timeoutHandle);

  const votes = Object.entries(room.currentVotes).map(([id, choice]) => ({
    username: room.players[id]?.username || 'Unknown',
    choice
  }));
  const countA = votes.filter(v => v.choice === 'A').length;
  const countB = votes.filter(v => v.choice === 'B').length;

  io.to(roomId).emit('wyr_reveal', { votes, countA, countB });
  room.roundIndex += 1;
}

module.exports = function handleWouldYouRatherSockets(io) {
  io.on('connection', (socket) => {

    socket.on('join_wyr_room', ({ roomId, username }) => {
      if (!roomId) return;
      socket.join(roomId);

      if (!rooms[roomId]) {
        rooms[roomId] = {
          hostId: socket.id,
          players: {},
          questions: [],
          roundIndex: 0,
          currentVotes: {},
          started: false,
          timeoutHandle: null
        };
      }

      const room = rooms[roomId];
      room.players[socket.id] = { id: socket.id, username: username || `Player_${socket.id.substring(0, 4)}` };

      socket.emit('wyr_you_are_host', { isHost: room.hostId === socket.id });
      io.to(roomId).emit('wyr_player_joined', { players: playerListPayload(room) });
    });

    socket.on('start_wyr_game', ({ roomId }) => {
      const room = rooms[roomId];
      if (!room || room.started || room.hostId !== socket.id) return;

      room.questions = shuffle(WYR_QUESTIONS).slice(0, ROUNDS_PER_GAME);
      room.roundIndex = 0;
      room.started = true;

      io.to(roomId).emit('wyr_game_started');
      startRound(io, roomId);
    });

    socket.on('submit_wyr_vote', ({ roomId, choice }) => {
      const room = rooms[roomId];
      if (!room || !room.started || (choice !== 'A' && choice !== 'B')) return;
      room.currentVotes[socket.id] = choice;

      const allVoted = Object.keys(room.players).every(id => room.currentVotes[id] !== undefined);
      if (allVoted) revealRound(io, roomId);
    });

    socket.on('wyr_next_round', ({ roomId }) => {
      const room = rooms[roomId];
      if (!room || room.hostId !== socket.id) return;
      startRound(io, roomId);
    });

    socket.on('request_wyr_play_again', ({ roomId }) => {
      const room = rooms[roomId];
      if (!room) return;
      room.started = false;
      room.roundIndex = 0;
      io.to(roomId).emit('wyr_player_joined', { players: playerListPayload(room) });
      io.to(roomId).emit('wyr_reset');
    });

    socket.on('disconnect', () => {
      for (const roomId in rooms) {
        const room = rooms[roomId];
        if (!room.players[socket.id]) continue;

        delete room.players[socket.id];
        delete room.currentVotes[socket.id];

        if (Object.keys(room.players).length === 0) {
          clearTimeout(room.timeoutHandle);
          delete rooms[roomId];
          continue;
        }

        if (room.hostId === socket.id) room.hostId = Object.keys(room.players)[0];
        io.to(roomId).emit('wyr_player_joined', { players: playerListPayload(room) });
      }
    });
  });
};