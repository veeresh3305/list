import React, { useState } from 'react';
import { useGameSocket } from '../hooks/useGameSocket';
import RoomLobby from '../components/RoomLobby';
import GameOverModal from '../components/GameOverModal';

const COLOR_HEX = { red: '#ef4444', yellow: '#eab308', green: '#22c55e', blue: '#3b82f6', wild: '#1e293b' };

function CardFace({ card, small }) {
  const bg = COLOR_HEX[card.color] || '#1e293b';
  const label = { SKIP: '⦸', REVERSE: '⇄', DRAW2: '+2', WILD: '★', WILD4: '+4' }[card.value] || card.value;
  return (
    <div style={{
      width: small ? '46px' : '64px', height: small ? '64px' : '90px',
      background: bg, borderRadius: '8px', border: '2px solid rgba(255,255,255,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: '800', fontSize: small ? '16px' : '22px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.3)', flexShrink: 0
    }}>
      {label}
    </div>
  );
}

export default function UnoGame({ username = 'Player' }) {
  const [roomId, setRoomId] = useState('');
  const [inRoom, setInRoom] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [state, setState] = useState(null); // public game state
  const [hand, setHand] = useState([]);
  const [colorPickerFor, setColorPickerFor] = useState(null); // card index awaiting color choice
  const [winner, setWinner] = useState(null);

  const socket = useGameSocket({
    uno_you_are_host: ({ isHost }) => setIsHost(isHost),
    uno_state: (publicState) => setState(publicState),
    uno_your_hand: ({ hand }) => setHand(hand),
    uno_game_over: ({ winnerUsername, reason }) => setWinner(winnerUsername ? `${winnerUsername} wins!` : (reason || 'Game ended.'))
  });

  const players = state ? state.order.map((name, idx) => ({
    username: name,
    detail: state.cardCounts[idx] ? `${state.cardCounts[idx].count} cards` : ''
  })) : [];

  const joinRoom = (code) => {
    const finalCode = (code || roomId).trim();
    if (!finalCode) return;
    socket.emit('join_uno_room', { roomId: finalCode, username });
    setRoomId(finalCode);
    setInRoom(true);
  };

  const startGame = () => socket.emit('start_uno_game', { roomId });

  const isMyTurn = state && state.currentTurnUsername === username;

  const playCard = (index, card) => {
    if (!isMyTurn) return;
    if (card.color === 'wild') {
      setColorPickerFor(index);
      return;
    }
    socket.emit('uno_play_card', { roomId, cardIndex: index });
  };

  const pickColor = (color) => {
    socket.emit('uno_play_card', { roomId, cardIndex: colorPickerFor, chosenColor: color });
    setColorPickerFor(null);
  };

  const drawCard = () => {
    if (!isMyTurn) return;
    socket.emit('uno_draw_card', { roomId });
  };

  const playAgain = () => {
    setWinner(null);
    socket.emit('request_uno_play_again', { roomId });
  };

  if (!state || !state.started) {
    return (
      <RoomLobby
        icon="🃏"
        title="Uno"
        accentColor="#a855f7"
        roomId={roomId}
        setRoomId={setRoomId}
        onJoin={joinRoom}
        inRoom={inRoom}
        players={state ? players : []}
        isHost={isHost}
        onStart={startGame}
        startLabel="Deal Cards & Start"
        minPlayers={2}
        extraContent={winner ? (
          <div style={{ marginBottom: '10px' }}>
            <p style={{ color: '#22c55e', fontWeight: 'bold' }}>{winner}</p>
            {isHost && <button onClick={startGame} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#a855f7', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>Play Again</button>}
          </div>
        ) : null}
      />
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={{ margin: '0 0 5px 0' }}>🃏 Uno (Room: {roomId})</h2>

      <div style={styles.turnBanner}>
        {isMyTurn ? "🟢 Your turn!" : `⏳ Waiting on ${state.currentTurnUsername}...`}
      </div>

      {/* Opponent card counts */}
      <div style={styles.opponentRow}>
        {players.filter(p => p.username !== username).map((p, idx) => (
          <div key={idx} style={{ ...styles.opponentChip, borderColor: state.currentTurnUsername === p.username ? '#a855f7' : '#334155' }}>
            👤 {p.username} — {p.detail}
          </div>
        ))}
      </div>

      {/* Discard pile + draw pile */}
      <div style={styles.tableRow}>
        <div style={{ textAlign: 'center' }}>
          <button style={styles.drawPile} onClick={drawCard} disabled={!isMyTurn}>Draw Pile</button>
        </div>
        <div style={{ textAlign: 'center' }}>
          {state.topCard && <CardFace card={state.topCard} />}
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
            Current color: <span style={{ color: COLOR_HEX[state.currentColor], fontWeight: 'bold' }}>{state.currentColor}</span>
          </p>
        </div>
      </div>

      {/* Your hand */}
      <p style={{ color: '#94a3b8', margin: '20px 0 8px 0', fontSize: '13px' }}>Your hand ({hand.length} cards):</p>
      <div style={styles.hand}>
        {hand.map((card, idx) => (
          <div key={idx} onClick={() => playCard(idx, card)} style={{ cursor: isMyTurn ? 'pointer' : 'default', opacity: isMyTurn ? 1 : 0.7 }}>
            <CardFace card={card} />
          </div>
        ))}
      </div>

      {/* Color picker for wild cards */}
      {colorPickerFor !== null && (
        <div style={styles.colorPickerOverlay}>
          <div style={styles.colorPickerModal}>
            <p style={{ marginTop: 0 }}>Choose a color:</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              {['red', 'yellow', 'green', 'blue'].map((c) => (
                <button key={c} onClick={() => pickColor(c)} style={{ width: '50px', height: '50px', borderRadius: '10px', border: 'none', background: COLOR_HEX[c], cursor: 'pointer' }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {winner && (
        <GameOverModal
          title="🃏 Uno — Game Over!"
          accentColor="#a855f7"
          winnerText={winner}
          onPlayAgain={isHost ? playAgain : undefined}
        />
      )}
    </div>
  );
}

const styles = {
  container: { fontFamily: 'system-ui, sans-serif', color: '#fff', maxWidth: '700px', margin: '0 auto', textAlign: 'center' },
  turnBanner: { background: '#1e293b', padding: '8px 14px', borderRadius: '10px', display: 'inline-block', marginBottom: '15px', fontWeight: 'bold' },
  opponentRow: { display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '15px' },
  opponentChip: { background: '#0f172a', border: '2px solid', padding: '6px 12px', borderRadius: '20px', fontSize: '13px' },
  tableRow: { display: 'flex', gap: '30px', justifyContent: 'center', alignItems: 'center', margin: '10px 0' },
  drawPile: { width: '64px', height: '90px', borderRadius: '8px', border: '2px dashed #475569', background: '#1e293b', color: '#94a3b8', cursor: 'pointer', fontSize: '11px' },
  hand: { display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', paddingBottom: '20px' },
  colorPickerOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  colorPickerModal: { background: '#1e293b', padding: '25px', borderRadius: '16px', border: '1px solid #334155' }
};