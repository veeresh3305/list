const rooms = {};

module.exports = function handleWordleSockets(io) {
  io.on('connection', (socket) => {

    // 1. Join Room
    socket.on('join_room', ({ roomId, username }) => {
      socket.join(roomId);

      if (!rooms[roomId]) {
        rooms[roomId] = { players: {}, finishedCount: 0 };
      }

      rooms[roomId].players[socket.id] = { 
        id: socket.id, 
        username: username || `Player_${socket.id.substring(0, 4)}` 
      };

      const playerCount = Object.keys(rooms[roomId].players).length;

      io.to(roomId).emit('player_joined', { 
        playerCount,
        players: Object.values(rooms[roomId].players).map(p => p.username)
      });
    });

    // 2. Secret Word Submission
    socket.on('submit_word', ({ roomId, word }) => {
      const room = rooms[roomId];
      if (!room) return;

      if (room.players[socket.id]) {
        room.players[socket.id].wordToGive = word.toUpperCase();
      }
      
      const playerIds = Object.keys(room.players);
      if (playerIds.length === 2 && playerIds.every(id => room.players[id].wordToGive)) {
        const [p1, p2] = playerIds;
        
        // Pass opponent's word to each player
        io.to(p1).emit('start_game', { assignedWord: room.players[p2].wordToGive });
        io.to(p2).emit('start_game', { assignedWord: room.players[p1].wordToGive });
      }
    });

    // 3. Player Finished Game
    socket.on('player_finished', ({ roomId, timeTaken, won, attempts }) => {
      const room = rooms[roomId];
      if (!room || !room.players[socket.id]) return;

      room.players[socket.id].stats = { timeTaken, won, attempts };
      room.finishedCount += 1;

      if (room.finishedCount >= 2) {
        const playerIds = Object.keys(room.players);
        const p1 = room.players[playerIds[0]];
        const p2 = room.players[playerIds[1]];

        let winnerName = null;

        if (p1.stats.won && !p2.stats.won) {
          winnerName = p1.username;
        } else if (!p1.stats.won && p2.stats.won) {
          winnerName = p2.username;
        } else if (p1.stats.won && p2.stats.won) {
          // Both won -> Compare attempts first, then time
          if (p1.stats.attempts < p2.stats.attempts) {
            winnerName = p1.username;
          } else if (p2.stats.attempts < p1.stats.attempts) {
            winnerName = p2.username;
          } else {
            if (p1.stats.timeTaken <= p2.stats.timeTaken) winnerName = p1.username;
            else winnerName = p2.username;
          }
        }

        io.to(roomId).emit('game_over', { winnerName });
      }
    });

    // 4. Play Again Handler
    socket.on('request_play_again', (roomId) => {
      if (rooms[roomId]) {
        rooms[roomId].finishedCount = 0;
        Object.keys(rooms[roomId].players).forEach(id => {
          delete rooms[roomId].players[id].wordToGive;
          delete rooms[roomId].players[id].stats;
        });
        io.to(roomId).emit('reset_to_selection');
      }
    });

    // Clean disconnects
    socket.on('disconnect', () => {
      for (const rId in rooms) {
        if (rooms[rId].players[socket.id]) {
          delete rooms[rId].players[socket.id];
          const remaining = Object.keys(rooms[rId].players).length;
          if (remaining === 0) {
            delete rooms[rId];
          } else {
            io.to(rId).emit('player_joined', { playerCount: remaining });
          }
        }
      }
    });
  });
};