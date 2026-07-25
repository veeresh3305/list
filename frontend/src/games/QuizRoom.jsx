import React, { useState, useEffect, useCallback } from 'react';
import { useGameSocket } from '../hooks/useGameSocket';
import RoomLobby from '../components/RoomLobby';
import GameOverModal from '../components/GameOverModal';

export default function QuizRoom({ username = 'Player', category, onExitCategory }) {
  const [roomId, setRoomId] = useState('');
  const [inRoom, setInRoom] = useState(false);
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);

  const [stage, setStage] = useState('LOBBY'); // LOBBY | PLAYING | RESULTS
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120);
  const [submitted, setSubmitted] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);

  const socket = useGameSocket({
    quiz_you_are_host: ({ isHost }) => setIsHost(isHost),
    quiz_player_joined: ({ players }) => setPlayers(players),
    quiz_start: ({ questions, duration }) => {
      setQuestions(questions);
      setAnswers(new Array(questions.length).fill(null));
      setQIndex(0);
      setTimeLeft(duration);
      setSubmitted(false);
      setStage('PLAYING');
    },
    quiz_results: ({ leaderboard }) => {
      setLeaderboard(leaderboard);
      setStage('RESULTS');
    },
    quiz_reset: () => {
      setStage('LOBBY');
      setSubmitted(false);
    }
  });

  const submitAnswers = useCallback((finalAnswers) => {
    setSubmitted(true);
    socket.emit('submit_quiz_answers', { roomId, answers: finalAnswers });
  }, [socket, roomId]);

  // Countdown timer while playing
  useEffect(() => {
    if (stage !== 'PLAYING' || submitted) return;
    if (timeLeft <= 0) {
      submitAnswers(answers);
      return;
    }
    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [stage, timeLeft, submitted, answers, submitAnswers]);

  const joinRoom = (code) => {
    const finalCode = (code || roomId).trim();
    if (!finalCode) return;
    socket.emit('join_quiz_room', { roomId: finalCode, username, category });
    setRoomId(finalCode);
    setInRoom(true);
  };

  const startGame = () => socket.emit('start_quiz', { roomId });

  const selectOption = (optIdx) => {
    const updated = [...answers];
    updated[qIndex] = optIdx;
    setAnswers(updated);
  };

  const goNext = () => {
    if (qIndex < questions.length - 1) setQIndex(qIndex + 1);
    else submitAnswers(answers);
  };

  const playAgain = () => socket.emit('request_quiz_play_again', { roomId });

  const answeredCount = answers.filter((a) => a !== null).length;

  if (stage === 'LOBBY') {
    return (
      <div>
        <button onClick={onExitCategory} style={styles.miniBackBtn}>← Choose a different category</button>
        <RoomLobby
          icon="🧠"
          title={`${category} Quiz`}
          accentColor="#3b82f6"
          roomId={roomId}
          setRoomId={setRoomId}
          onJoin={joinRoom}
          inRoom={inRoom}
          players={players}
          isHost={isHost}
          onStart={startGame}
          startLabel="Start Quiz (10 Qs, 2 min)"
          minPlayers={1}
        />
      </div>
    );
  }

  if (stage === 'PLAYING') {
    const question = questions[qIndex];
    const minutes = String(Math.floor(Math.max(timeLeft, 0) / 60)).padStart(2, '0');
    const seconds = String(Math.max(timeLeft, 0) % 60).padStart(2, '0');

    if (submitted) {
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <h2>✅ Answers Submitted!</h2>
            <p style={{ color: '#94a3b8' }}>Waiting for other players to finish...</p>
          </div>
        </div>
      );
    }

    return (
      <div style={styles.container}>
        <div style={{ ...styles.card, maxWidth: '600px' }}>
          <div style={styles.topBar}>
            <span>Question {qIndex + 1} / {questions.length}</span>
            <span style={{ color: timeLeft <= 20 ? '#f87171' : '#38bdf8', fontWeight: 'bold' }}>⏱ {minutes}:{seconds}</span>
          </div>
          <h3 style={{ margin: '10px 0 20px 0' }}>{question.q}</h3>

          <div style={styles.optionsGrid}>
            {question.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => selectOption(idx)}
                style={{
                  ...styles.optionBtn,
                  borderColor: answers[qIndex] === idx ? '#3b82f6' : '#334155',
                  backgroundColor: answers[qIndex] === idx ? 'rgba(59,130,246,0.2)' : '#0f172a'
                }}
              >
                {opt}
              </button>
            ))}
          </div>

          <div style={styles.navRow}>
            <button
              disabled={qIndex === 0}
              onClick={() => setQIndex(qIndex - 1)}
              style={{ ...styles.navBtn, opacity: qIndex === 0 ? 0.4 : 1 }}
            >
              ← Previous
            </button>
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>{answeredCount}/{questions.length} answered</span>
            <button onClick={goNext} style={{ ...styles.navBtn, backgroundColor: '#3b82f6' }}>
              {qIndex === questions.length - 1 ? 'Finish' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'RESULTS') {
    return (
      <GameOverModal
        title="🧠 Quiz Results"
        accentColor="#3b82f6"
        standings={leaderboard.map((p) => ({ username: p.username, detail: `${p.score}/10 correct` }))}
        onPlayAgain={playAgain}
      />
    );
  }

  return null;
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'system-ui, sans-serif', color: '#fff', minHeight: '60vh', justifyContent: 'center' },
  card: { background: '#1e293b', padding: '30px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', width: '90%' },
  topBar: { display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#94a3b8' },
  optionsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' },
  optionBtn: { padding: '14px', borderRadius: '10px', border: '2px solid', color: '#fff', textAlign: 'left', cursor: 'pointer', fontSize: '14px' },
  navRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' },
  navBtn: { padding: '10px 18px', borderRadius: '8px', border: 'none', background: '#334155', color: '#fff', fontWeight: 'bold', cursor: 'pointer' },
  miniBackBtn: { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', marginBottom: '10px', fontSize: '13px' }
};