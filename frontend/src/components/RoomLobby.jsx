import React, { useState } from 'react';

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars (0/O, 1/I)
  let code = '';
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

/**
 * Reusable "create or join a room" + "waiting room" screen.
 * Used by Quiz, Uno, Rate It and Would You Rather so each game file doesn't
 * have to re-implement the same join-screen markup and styles.
 *
 * onJoin is called as onJoin(roomCode) - the parent should use the passed
 * code directly (rather than reading it back from its own state) since
 * "Create Room" generates and joins with a code in the same action.
 */
export default function RoomLobby({
  icon = '🎮',
  title,
  accentColor = '#38bdf8',
  roomId,
  setRoomId,
  onJoin,
  inRoom,
  players = [],
  isHost = false,
  onStart,
  startLabel = 'Start Game',
  minPlayers = 2,
  extraContent = null
}) {
  const [mode, setMode] = useState('choose'); // 'choose' | 'join'
  const [joinCode, setJoinCode] = useState('');

  const handleCreate = () => {
    const code = generateRoomCode();
    setRoomId(code);
    onJoin(code);
  };

  const handleJoinSubmit = () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    setRoomId(code);
    onJoin(code);
  };

  if (!inRoom) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={{ margin: '0 0 20px 0' }}>{icon} {title}</h2>

          {mode === 'choose' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button style={{ ...styles.button, backgroundColor: accentColor }} onClick={handleCreate}>
                🎲 Create New Room
              </button>
              <button style={{ ...styles.button, backgroundColor: '#334155' }} onClick={() => setMode('join')}>
                🔑 Join Existing Room
              </button>
            </div>
          )}

          {mode === 'join' && (
            <>
              <input
                style={styles.input}
                type="text"
                placeholder="Enter Room Code"
                value={joinCode}
                autoFocus
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinSubmit()}
              />
              <button style={{ ...styles.button, backgroundColor: accentColor, marginTop: '10px' }} onClick={handleJoinSubmit}>
                Join Room
              </button>
              <button style={styles.linkBtn} onClick={() => setMode('choose')}>← Back</button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {isHost && (
          <p style={{ color: '#94a3b8', margin: '0 0 4px 0', fontSize: '12px', letterSpacing: '0.5px' }}>
            SHARE THIS CODE WITH YOUR FRIENDS
          </p>
        )}
        <h2 style={{ margin: '0 0 5px 0', fontSize: isHost ? '32px' : '22px', letterSpacing: '2px' }}>
          {isHost ? '' : 'Room Code: '}<span style={{ color: accentColor }}>{roomId}</span>
        </h2>
        <p style={{ color: '#94a3b8', margin: '0 0 15px 0' }}>
          {players.length} player{players.length === 1 ? '' : 's'} in room
        </p>

        <div style={styles.playerList}>
          {players.map((p, idx) => (
            <div key={idx} style={styles.playerChip}>👤 {p.username}</div>
          ))}
        </div>

        {extraContent}

        {players.length < minPlayers && (
          <p style={{ color: '#eab308', marginTop: '15px' }}>
            Waiting for at least {minPlayers} players to join...
          </p>
        )}

        {isHost ? (
          <button
            style={{ ...styles.button, backgroundColor: accentColor, marginTop: '15px', opacity: players.length < minPlayers ? 0.5 : 1 }}
            disabled={players.length < minPlayers}
            onClick={onStart}
          >
            {startLabel}
          </button>
        ) : (
          <p style={{ color: '#94a3b8', marginTop: '15px' }}>Waiting for the host to start the game...</p>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'system-ui, sans-serif', color: '#fff', minHeight: '60vh', justifyContent: 'center' },
  card: { background: '#1e293b', padding: '30px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', maxWidth: '420px', width: '90%' },
  input: { padding: '12px', fontSize: '20px', letterSpacing: '4px', textAlign: 'center', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#fff', width: '100%', boxSizing: 'border-box' },
  button: { padding: '12px 24px', fontSize: '16px', borderRadius: '8px', border: 'none', color: '#fff', fontWeight: 'bold', cursor: 'pointer', width: '100%' },
  linkBtn: { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', marginTop: '12px', fontSize: '13px' },
  playerList: { display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '10px' },
  playerChip: { background: '#0f172a', border: '1px solid #334155', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', color: '#e2e8f0' }
};