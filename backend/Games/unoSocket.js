// Simplified real-time Uno (2-6 players).
// Simplifications vs. the physical game: no "Uno!" call penalty, and drawing
// a card always ends your turn (you don't get to immediately play what you drew).

const COLORS = ['red', 'yellow', 'green', 'blue'];
const rooms = {}; // roomId -> room state

function buildDeck() {
  const deck = [];
  COLORS.forEach(color => {
    deck.push({ color, value: '0' });
    for (let n = 1; n <= 9; n++) {
      deck.push({ color, value: String(n) });
      deck.push({ color, value: String(n) });
    }
    ['SKIP', 'REVERSE', 'DRAW2'].forEach(action => {
      deck.push({ color, value: action });
      deck.push({ color, value: action });
    });
  });
  for (let i = 0; i < 4; i++) {
    deck.push({ color: 'wild', value: 'WILD' });
    deck.push({ color: 'wild', value: 'WILD4' });
  }
  return deck;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function drawCards(room, count) {
  const drawn = [];
  for (let i = 0; i < count; i++) {
    if (room.deck.length === 0) {
      // Reshuffle discard pile (except top card) back into the deck
      const top = room.discard.pop();
      room.deck = shuffle(room.discard);
      room.discard = [top];
      if (room.deck.length === 0) break; // truly out of cards
    }
    drawn.push(room.deck.pop());
  }
  return drawn;
}

function publicState(room) {
  const order = room.order;
  return {
    started: room.started,
    order: order.map(id => room.players[id].username),
    turnIndex: room.turnIndex,
    currentTurnUsername: order.length ? room.players[order[room.turnIndex]].username : null,
    direction: room.direction,
    currentColor: room.currentColor,
    topCard: room.discard[room.discard.length - 1] || null,
    cardCounts: order.map(id => ({ username: room.players[id].username, count: room.players[id].hand.length })),
    hostUsername: room.hostId ? room.players[room.hostId]?.username : null
  };
}

function broadcastState(io, roomId) {
  const room = rooms[roomId];
  if (!room) return;
  io.to(roomId).emit('uno_state', publicState(room));
  room.order.forEach(id => {
    io.to(id).emit('uno_your_hand', { hand: room.players[id].hand });
  });
}

function nextTurnIndex(room, steps = 1) {
  const n = room.order.length;
  let idx = room.turnIndex;
  idx = (idx + room.direction * steps + n * steps) % n;
  return idx;
}

function isPlayable(card, topCard, currentColor) {
  if (card.color === 'wild') return true;
  if (card.color === currentColor) return true;
  if (card.value === topCard.value) return true;
  return false;
}

module.exports = function handleUnoSockets(io) {
  io.on('connection', (socket) => {

    socket.on('join_uno_room', ({ roomId, username }) => {
      if (!roomId) return;
      socket.join(roomId);

      if (!rooms[roomId]) {
        rooms[roomId] = {
          hostId: socket.id,
          players: {},
          order: [],
          deck: [],
          discard: [],
          turnIndex: 0,
          direction: 1,
          currentColor: null,
          started: false
        };
      }

      const room = rooms[roomId];
      if (!room.players[socket.id]) {
        room.players[socket.id] = { id: socket.id, username: username || `Player_${socket.id.substring(0, 4)}`, hand: [] };
        room.order.push(socket.id);
      }

      socket.emit('uno_you_are_host', { isHost: room.hostId === socket.id });
      broadcastState(io, roomId);
    });

    socket.on('start_uno_game', ({ roomId }) => {
      const room = rooms[roomId];
      if (!room || room.started) return;
      if (room.hostId !== socket.id) return;
      if (room.order.length < 2) return;

      room.deck = shuffle(buildDeck());
      room.discard = [];
      room.order.forEach(id => { room.players[id].hand = drawCards(room, 7); });

      // Flip a starting card that isn't a wild
      let starter;
      do {
        starter = room.deck.pop();
        if (starter.color === 'wild') room.deck.unshift(starter);
      } while (starter.color === 'wild');
      room.discard.push(starter);
      room.currentColor = starter.color;
      room.turnIndex = 0;
      room.direction = 1;
      room.started = true;

      broadcastState(io, roomId);
    });

    socket.on('uno_play_card', ({ roomId, cardIndex, chosenColor }) => {
      const room = rooms[roomId];
      if (!room || !room.started) return;
      const currentPlayerId = room.order[room.turnIndex];
      if (currentPlayerId !== socket.id) return;

      const player = room.players[socket.id];
      const card = player.hand[cardIndex];
      if (!card) return;

      const topCard = room.discard[room.discard.length - 1];
      if (!isPlayable(card, topCard, room.currentColor)) return;

      player.hand.splice(cardIndex, 1);
      room.discard.push(card);
      room.currentColor = card.color === 'wild' ? (chosenColor || 'red') : card.color;

      // Win check
      if (player.hand.length === 0) {
        room.started = false;
        io.to(roomId).emit('uno_game_over', { winnerUsername: player.username });
        broadcastState(io, roomId);
        return;
      }

      // Resolve card effects
      let steps = 1;
      if (card.value === 'REVERSE') {
        room.direction *= -1;
        if (room.order.length === 2) steps = 1; // acts like skip in 2-player
      } else if (card.value === 'SKIP') {
        steps = 2;
      } else if (card.value === 'DRAW2') {
        const nextIdx = nextTurnIndex(room, 1);
        const victimId = room.order[nextIdx];
        room.players[victimId].hand.push(...drawCards(room, 2));
        steps = 2;
      } else if (card.value === 'WILD4') {
        const nextIdx = nextTurnIndex(room, 1);
        const victimId = room.order[nextIdx];
        room.players[victimId].hand.push(...drawCards(room, 4));
        steps = 2;
      }

      room.turnIndex = nextTurnIndex(room, steps);
      broadcastState(io, roomId);
    });

    socket.on('uno_draw_card', ({ roomId }) => {
      const room = rooms[roomId];
      if (!room || !room.started) return;
      const currentPlayerId = room.order[room.turnIndex];
      if (currentPlayerId !== socket.id) return;

      const player = room.players[socket.id];
      player.hand.push(...drawCards(room, 1));
      room.turnIndex = nextTurnIndex(room, 1);
      broadcastState(io, roomId);
    });

    socket.on('request_uno_play_again', ({ roomId }) => {
      const room = rooms[roomId];
      if (!room) return;
      room.started = false;
      room.discard = [];
      room.deck = [];
      room.order.forEach(id => { room.players[id].hand = []; });
      broadcastState(io, roomId);
    });

    socket.on('disconnect', () => {
      for (const roomId in rooms) {
        const room = rooms[roomId];
        if (!room.players[socket.id]) continue;

        delete room.players[socket.id];
        room.order = room.order.filter(id => id !== socket.id);

        if (room.order.length === 0) {
          delete rooms[roomId];
          continue;
        }

        if (room.turnIndex >= room.order.length) room.turnIndex = 0;
        if (room.hostId === socket.id) room.hostId = room.order[0];

        if (room.started && room.order.length < 2) {
          room.started = false;
          io.to(roomId).emit('uno_game_over', { winnerUsername: null, reason: 'Not enough players left.' });
        }

        broadcastState(io, roomId);
      }
    });
  });
};