const ROUND_SECONDS = 15;
const ITEMS_PER_GAME = 8;

const DEFAULT_ITEMS = [
  "Pineapple on pizza", "Waking up early", "Cold showers", "Karaoke in public",
  "Horror movies", "Long road trips", "Spicy food", "Group projects",
  "Rainy days", "Camping in the wild", "Public speaking", "Reality TV",
  "Instant noodles", "Small talk", "Morning gym sessions", "Blind dates"
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

  if (room.roundIndex >= room.items.length) {
    // Game finished — build final ranking by average rating
    const results = room.items.map((item, idx) => {
      const ratings = room.roundHistory[idx] || [];
      const avg = ratings.length ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length : 0;
      return { item, average: Math.round(avg * 10) / 10, ratings };
    }).sort((a, b) => b.average - a.average);

    room.started = false;
    io.to(roomId).emit('rateit_final', { results });
    return;
  }

  room.currentRatings = {};
  const item = room.items[room.roundIndex];

  io.to(roomId).emit('rateit_round', {
    item,
    roundIndex: room.roundIndex,
    total: room.items.length,
    duration: ROUND_SECONDS
  });

  clearTimeout(room.timeoutHandle);
  room.timeoutHandle = setTimeout(() => revealRound(io, roomId), ROUND_SECONDS * 1000 + 500);
}

function revealRound(io, roomId) {
  const room = rooms[roomId];
  if (!room) return;
  clearTimeout(room.timeoutHandle);

  const ratings = Object.entries(room.currentRatings).map(([id, rating]) => ({
    username: room.players[id]?.username || 'Unknown',
    rating
  }));
  const avg = ratings.length ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length : 0;

  room.roundHistory[room.roundIndex] = ratings;

  io.to(roomId).emit('rateit_reveal', {
    item: room.items[room.roundIndex],
    ratings,
    average: Math.round(avg * 10) / 10
  });

  room.roundIndex += 1;
}

module.exports = function handleRateItSockets(io) {
  io.on('connection', (socket) => {

    socket.on('join_rateit_room', ({ roomId, username }) => {
      if (!roomId) return;
      socket.join(roomId);

      if (!rooms[roomId]) {
        rooms[roomId] = {
          hostId: socket.id,
          players: {},
          items: [],
          roundIndex: 0,
          roundHistory: [],
          currentRatings: {},
          started: false,
          timeoutHandle: null
        };
      }

      const room = rooms[roomId];
      room.players[socket.id] = { id: socket.id, username: username || `Player_${socket.id.substring(0, 4)}` };

      socket.emit('rateit_you_are_host', { isHost: room.hostId === socket.id });
      io.to(roomId).emit('rateit_player_joined', { players: playerListPayload(room) });
    });

    socket.on('start_rateit_game', ({ roomId }) => {
      const room = rooms[roomId];
      if (!room || room.started || room.hostId !== socket.id) return;

      room.items = shuffle(DEFAULT_ITEMS).slice(0, ITEMS_PER_GAME);
      room.roundIndex = 0;
      room.roundHistory = [];
      room.started = true;

      io.to(roomId).emit('rateit_game_started');
      startRound(io, roomId);
    });

    socket.on('submit_rating', ({ roomId, rating }) => {
      const room = rooms[roomId];
      if (!room || !room.started) return;
      const clamped = Math.max(1, Math.min(10, Number(rating) || 1));
      room.currentRatings[socket.id] = clamped;

      const allPlayersRated = Object.keys(room.players).every(id => room.currentRatings[id] !== undefined);
      if (allPlayersRated) revealRound(io, roomId);
    });

    socket.on('rateit_next_round', ({ roomId }) => {
      const room = rooms[roomId];
      if (!room || room.hostId !== socket.id) return;
      startRound(io, roomId);
    });

    socket.on('request_rateit_play_again', ({ roomId }) => {
      const room = rooms[roomId];
      if (!room) return;
      room.started = false;
      room.roundIndex = 0;
      room.roundHistory = [];
      io.to(roomId).emit('rateit_player_joined', { players: playerListPayload(room) });
      io.to(roomId).emit('rateit_reset');
    });

    socket.on('disconnect', () => {
      for (const roomId in rooms) {
        const room = rooms[roomId];
        if (!room.players[socket.id]) continue;

        delete room.players[socket.id];
        delete room.currentRatings[socket.id];

        if (Object.keys(room.players).length === 0) {
          clearTimeout(room.timeoutHandle);
          delete rooms[roomId];
          continue;
        }

        if (room.hostId === socket.id) room.hostId = Object.keys(room.players)[0];
        io.to(roomId).emit('rateit_player_joined', { players: playerListPayload(room) });
      }
    });
  });
};