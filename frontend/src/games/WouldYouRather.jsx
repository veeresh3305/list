import React, { useState, useEffect } from 'react';
import { useGameSocket } from '../hooks/useGameSocket';
import RoomLobby from '../components/RoomLobby';

export default function WouldYouRatherGame({ username = 'Player' }) {
  const [roomId, setRoomId] = useState('');
  const [inRoom, setInRoom] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [players, setPlayers] = useState([]);

  const [stage, setStage] = useState('LOBBY'); // LOBBY | VOTING | REVEAL | FINAL
  const [round, setRound] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [myChoice, setMyChoice] = useState(null);
  const [reveal, setReveal] = useState(null);

  const socket = useGameSocket({
    wyr_you_are_host: ({ isHost }) => setIsHost(isHost),
    wyr_player_joined: ({ players }) => setPlayers(players),
    wyr_game_started: () => setStage('VOTING'),
    wyr_round: (data) => {
      setRound(data);
      setTimeLeft(data.duration);
      setMyChoice(null);
      setStage('VOTING');
    },
    wyr_reveal: (data) => {
      setReveal(data);
      setStage('REVEAL');
    },
    wyr_final: () => setStage('FINAL'),
    wyr_reset: () => setStage('LOBBY')
  });

  useEffect(() => {
    if (stage !== 'VOTING' || myChoice !== null || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft((v) => v - 1), 1000);
    return () => clearInterval(t);
  }, [stage, myChoice, timeLeft]);

  const joinRoom = (code) => {
    const finalCode = (code || roomId).trim();
    if (!finalCode) return;
    socket.emit('join_wyr_room', { roomId: finalCode, username });
    setRoomId(finalCode);
    setInRoom(true);
  };

  const startGame = () => socket.emit('start_wyr_game', { roomId });
  const vote = (choice) => {
    setMyChoice(choice);
    socket.emit('submit_wyr_vote', { roomId, choice });
  };
  const nextRound = () => socket.emit('wyr_next_round', { roomId });
  const playAgain = () => socket.emit('request_wyr_play_again', { roomId });

  if (stage === 'LOBBY') {
    return (
      <RoomLobby
        icon="🤔"
        title="Would You Rather"
        accentColor="#ec4899"
        roomId={roomId}
        setRoomId={setRoomId}
        onJoin={joinRoom}
        inRoom={inRoom}
        players={players}
        isHost={isHost}
        onStart={startGame}
        startLabel="Start (8 rounds)"
        minPlayers={2}
      />
    );
  }

  if (stage === 'VOTING') {
    return (
      <div style={styles.container}>
        <p style={{ color: '#94a3b8' }}>Round {round.roundIndex + 1} / {round.total}</p>
        <h2 style={{ margin: '0 0 20px 0' }}>Would you rather...</h2>
        <div style={styles.optionRow}>
          <button
            style={{ ...styles.optionCard, borderColor: myChoice === 'A' ? '#ec4899' : '#334155', opacity: myChoice && myChoice !== 'A' ? 0.5 : 1 }}
            onClick={() => vote('A')}
            disabled={myChoice !== null}
          >
            {round.optionA}
          </button>
          <div style={styles.orDivider}>OR</div>
          <button
            style={{ ...styles.optionCard, borderColor: myChoice === 'B' ? '#ec4899' : '#334155', opacity: myChoice && myChoice !== 'B' ? 0.5 : 1 }}
            onClick={() => vote('B')}
            disabled={myChoice !== null}
          >
            {round.optionB}
          </button>
        </div>
        <p style={{ color: '#64748b', fontSize: '12px', marginTop: '15px' }}>
          {myChoice ? '✅ Vote locked in — waiting for others...' : `⏱ ${timeLeft}s left to vote`}
        </p>
      </div>
    );
  }

  if (stage === 'REVEAL') {
    const total = reveal.countA + reveal.countB || 1;
    const pctA = Math.round((reveal.countA / total) * 100);
    const pctB = 100 - pctA;
    return (
      <div style={styles.container}>
        <h2 style={{ margin: '0 0 20px 0' }}>Results</h2>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div style={styles.barLabel}>{round.optionA} — {pctA}% ({reveal.countA})</div>
          <div style={styles.barTrack}><div style={{ ...styles.barFill, width: `${pctA}%`, background: '#ec4899' }} /></div>
          <div style={{ ...styles.barLabel, marginTop: '14px' }}>{round.optionB} — {pctB}% ({reveal.countB})</div>
          <div style={styles.barTrack}><div style={{ ...styles.barFill, width: `${pctB}%`, background: '#38bdf8' }} /></div>
        </div>
        {isHost && <button style={styles.button} onClick={nextRound}>Next Round →</button>}
        {!isHost && <p style={{ color: '#94a3b8', marginTop: '15px' }}>Waiting for host to continue...</p>}
      </div>
    );
  }

  if (stage === 'FINAL') {
    return (
      <div style={styles.container}>
        <h2>🎉 That's a wrap!</h2>
        <p style={{ color: '#94a3b8' }}>Thanks for playing Would You Rather.</p>
        {isHost && <button style={styles.button} onClick={playAgain}>Play Again</button>}
      </div>
    );
  }

  return null;
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'system-ui, sans-serif', color: '#fff', minHeight: '60vh', justifyContent: 'center', textAlign: 'center', padding: '0 15px' },
  optionRow: { display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '600px' },
  optionCard: { flex: '1 1 220px', minHeight: '110px', padding: '20px', borderRadius: '14px', border: '2px solid', background: '#1e293b', color: '#fff', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  orDivider: { color: '#64748b', fontWeight: 'bold' },
  barLabel: { fontSize: '13px', color: '#e2e8f0', marginBottom: '4px', textAlign: 'left' },
  barTrack: { background: '#0f172a', borderRadius: '8px', overflow: 'hidden', height: '18px', border: '1px solid #334155' },
  barFill: { height: '100%', transition: 'width 0.4s ease' },
  button: { padding: '12px 24px', fontSize: '16px', borderRadius: '8px', border: 'none', backgroundColor: '#ec4899', color: '#fff', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px' }
};