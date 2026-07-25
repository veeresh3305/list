import React, { useState } from 'react';
import { useGameSocket } from '../hooks/useGameSocket';
import RoomLobby from '../components/RoomLobby';
import GameOverModal from '../components/GameOverModal';

export default function RateItGame({ username = 'Player' }) {
  const [roomId, setRoomId] = useState('');
  const [inRoom, setInRoom] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [players, setPlayers] = useState([]);

  const [stage, setStage] = useState('LOBBY'); // LOBBY | RATING | REVEAL | FINAL
  const [round, setRound] = useState(null); // { item, roundIndex, total, duration }
  const [timeLeft, setTimeLeft] = useState(0);
  const [myRating, setMyRating] = useState(5);
  const [submitted, setSubmitted] = useState(false);
  const [reveal, setReveal] = useState(null);
  const [finalResults, setFinalResults] = useState([]);

  const socket = useGameSocket({
    rateit_you_are_host: ({ isHost }) => setIsHost(isHost),
    rateit_player_joined: ({ players }) => setPlayers(players),
    rateit_game_started: () => setStage('RATING'),
    rateit_round: (data) => {
      setRound(data);
      setTimeLeft(data.duration);
      setMyRating(5);
      setSubmitted(false);
      setStage('RATING');
    },
    rateit_reveal: (data) => {
      setReveal(data);
      setStage('REVEAL');
    },
    rateit_final: ({ results }) => {
      setFinalResults(results);
      setStage('FINAL');
    },
    rateit_reset: () => setStage('LOBBY')
  });

  React.useEffect(() => {
    if (stage !== 'RATING' || submitted || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft((v) => v - 1), 1000);
    return () => clearInterval(t);
  }, [stage, submitted, timeLeft]);

  const joinRoom = (code) => {
    const finalCode = (code || roomId).trim();
    if (!finalCode) return;
    socket.emit('join_rateit_room', { roomId: finalCode, username });
    setRoomId(finalCode);
    setInRoom(true);
  };

  const startGame = () => socket.emit('start_rateit_game', { roomId });
  const submitRating = () => {
    setSubmitted(true);
    socket.emit('submit_rating', { roomId, rating: myRating });
  };
  const nextRound = () => socket.emit('rateit_next_round', { roomId });
  const playAgain = () => socket.emit('request_rateit_play_again', { roomId });

  if (stage === 'LOBBY') {
    return (
      <RoomLobby
        icon="⭐"
        title="Rate It"
        accentColor="#f59e0b"
        roomId={roomId}
        setRoomId={setRoomId}
        onJoin={joinRoom}
        inRoom={inRoom}
        players={players}
        isHost={isHost}
        onStart={startGame}
        startLabel="Start Rating (8 items)"
        minPlayers={2}
      />
    );
  }

  if (stage === 'RATING') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p style={{ color: '#94a3b8', margin: 0 }}>Item {round.roundIndex + 1} / {round.total}</p>
          <h2 style={{ margin: '8px 0 20px 0' }}>{round.item}</h2>

          {submitted ? (
            <p style={{ color: '#94a3b8' }}>✅ Rating submitted — waiting for others...</p>
          ) : (
            <>
              <div style={styles.ratingDisplay}>{myRating} / 10</div>
              <input
                type="range"
                min="1"
                max="10"
                value={myRating}
                onChange={(e) => setMyRating(Number(e.target.value))}
                style={{ width: '100%', marginBottom: '20px' }}
              />
              <button style={styles.button} onClick={submitRating}>Submit Rating</button>
            </>
          )}
          <p style={{ color: '#64748b', fontSize: '12px', marginTop: '15px' }}>⏱ {timeLeft}s left this round</p>
        </div>
      </div>
    );
  }

  if (stage === 'REVEAL') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={{ margin: '0 0 10px 0' }}>{reveal.item}</h2>
          <div style={styles.avgBadge}>Average: {reveal.average} / 10</div>
          <div style={{ margin: '15px 0' }}>
            {reveal.ratings.map((r, idx) => (
              <div key={idx} style={styles.ratingRow}>
                <span>{r.username}</span>
                <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{r.rating}/10</span>
              </div>
            ))}
          </div>
          {isHost && <button style={styles.button} onClick={nextRound}>Next Item →</button>}
          {!isHost && <p style={{ color: '#94a3b8' }}>Waiting for host to continue...</p>}
        </div>
      </div>
    );
  }

  if (stage === 'FINAL') {
    return (
      <GameOverModal
        title="⭐ Rate It — Final Rankings"
        accentColor="#f59e0b"
        standings={finalResults.map((r) => ({ username: r.item, detail: `avg ${r.average}/10` }))}
        onPlayAgain={playAgain}
      />
    );
  }

  return null;
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'system-ui, sans-serif', color: '#fff', minHeight: '60vh', justifyContent: 'center' },
  card: { background: '#1e293b', padding: '30px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', maxWidth: '420px', width: '90%' },
  button: { padding: '12px 24px', fontSize: '16px', borderRadius: '8px', border: 'none', backgroundColor: '#f59e0b', color: '#fff', fontWeight: 'bold', cursor: 'pointer', width: '100%' },
  ratingDisplay: { fontSize: '32px', fontWeight: '800', color: '#f59e0b', marginBottom: '10px' },
  avgBadge: { display: 'inline-block', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', padding: '6px 14px', borderRadius: '20px', fontWeight: 'bold', fontSize: '14px' },
  ratingRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#0f172a', borderRadius: '8px', marginTop: '6px', fontSize: '14px' }
};