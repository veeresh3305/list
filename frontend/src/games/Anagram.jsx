import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000');

export default function AnagramGame({ onExit }) {
  const [gameState, setGameState] = useState('rules'); // 'rules' | 'playing' | 'finished'
  const [promptData, setPromptData] = useState(null);
  const [inputWord, setInputWord] = useState('');
  const [submissions, setSubmissions] = useState([]); // [{ word: 'LISTEN', isValid: true }]
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes timer

  const inputRef = useRef(null);

  // Load Daily Anagram Prompt on Mount
  useEffect(() => {
    socket.emit('get_daily_anagram');

    socket.on('anagram_daily_data', (data) => {
      setPromptData(data);
    });

    socket.on('anagram_word_result', ({ word, isValid }) => {
      setSubmissions(prev => [
        { word, isValid, id: Date.now() + Math.random() },
        ...prev
      ]);
    });

    return () => {
      socket.off('anagram_daily_data');
      socket.off('anagram_word_result');
    };
  }, []);

  // Timer logic for 2 Minutes
  useEffect(() => {
    if (gameState !== 'playing') return;

    if (timeLeft <= 0) {
      setGameState('finished');
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  // Focus input automatically when game starts
  useEffect(() => {
    if (gameState === 'playing' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [gameState]);

  const handleStartGame = () => {
    setGameState('playing');
    setTimeLeft(120);
    setSubmissions([]);
  };

  const handleSubmitWord = (e) => {
    e.preventDefault();
    const cleanWord = inputWord.trim().toUpperCase();

    if (!cleanWord || !promptData) return;

    // Check if user already submitted this word
    const alreadySubmitted = submissions.some(s => s.word === cleanWord);
    if (alreadySubmitted) {
      setInputWord('');
      return;
    }

    socket.emit('submit_anagram_word', {
      promptId: promptData.id,
      word: cleanWord
    });

    setInputWord('');
  };

  // Format Timer MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const correctCount = submissions.filter(s => s.isValid).length;

  return (
    <div style={styles.container}>
      {/* 1. RULES / INTRO OVERLAY */}
      {gameState === 'rules' && (
        <div style={styles.cardModal}>
          <h2 style={styles.title}>🔤 Daily Anagram Challenge</h2>
          <p style={styles.description}>
            Unscramble letters and create as many valid words as possible from the given scrambled daily word!
          </p>
          <div style={styles.rulesBox}>
            <p>⏱️ <strong>Time Limit:</strong> Exactly 2 Minutes</p>
            <p>🔤 <strong>Rules:</strong> Enter any valid English words built using the provided letters.</p>
            <p>📅 <strong>Daily Reset:</strong> A new word is generated every midnight!</p>
          </div>
          <button style={styles.primaryBtn} onClick={handleStartGame}>
            🚀 Start Challenge
          </button>
        </div>
      )}

      {/* 2. ACTIVE GAMEPLAY VIEW */}
      {gameState === 'playing' && (
        <div style={styles.gameWrapper}>
          {/* TOP CENTER TIMER */}
          <div style={styles.topTimerContainer}>
            <div style={styles.timerBadge}>
              ⏱️ {formatTime(timeLeft)}
            </div>
          </div>

          {/* SPLIT VIEW LAYOUT */}
          <div style={styles.splitGrid}>
            {/* LEFT COLUMN: SCRAMBLED WORD DISPLAY */}
            <div style={styles.leftColumn}>
              <span style={styles.labelHeader}>GIVEN LETTERS</span>
              <div style={styles.scrambledBox}>
                {promptData?.scrambled.split('').map((char, index) => (
                  <span key={index} style={styles.letterTile}>{char}</span>
                ))}
              </div>
              <p style={styles.subtext}>Form as many words as you can!</p>
            </div>

            {/* RIGHT COLUMN: ENTERING BAR & SUBMITTED LIST */}
            <div style={styles.rightColumn}>
              <form onSubmit={handleSubmitWord} style={styles.form}>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputWord}
                  onChange={(e) => setInputWord(e.target.value)}
                  placeholder="Type a word & press Enter..."
                  style={styles.textInput}
                />
              </form>

              {/* LIVE LIST OF SUBMITTED WORDS */}
              <div style={styles.submissionsContainer}>
                <h4 style={styles.listHeader}>Your Words ({correctCount})</h4>
                <div style={styles.listScroll}>
                  {submissions.length === 0 ? (
                    <p style={styles.emptyText}>Submitted words will appear here...</p>
                  ) : (
                    submissions.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          ...styles.wordBadge,
                          borderColor: item.isValid ? '#22c55e' : '#ef4444',
                          backgroundColor: item.isValid ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'
                        }}
                      >
                        <span style={styles.wordText}>{item.word}</span>
                        <span style={styles.iconTag}>
                          {item.isValid ? '✅' : '❌'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. GAME OVER MODAL */}
      {gameState === 'finished' && (
        <div style={styles.cardModal}>
          <h2 style={styles.title}>🎉 Time's Up!</h2>
          <p style={styles.description}>Great effort on today's Daily Anagram Challenge!</p>
          
          <div style={styles.scoreBox}>
            <span style={styles.scoreNumber}>{correctCount}</span>
            <span style={styles.scoreLabel}>Correct Words Found</span>
          </div>

          <button style={styles.primaryBtn} onClick={onExit || (() => setGameState('rules'))}>
            🚪 Exit to Arcade
          </button>
        </div>
      )}
    </div>
  );
}

// --- STYLES DEFINITION ---
const styles = {
  container: {
    maxWidth: '850px',
    margin: '0 auto',
    color: '#ffffff',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  cardModal: {
    background: '#1e293b',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '35px',
    textAlign: 'center',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)'
  },
  title: { fontSize: '28px', fontWeight: '800', marginBottom: '10px' },
  description: { color: '#94a3b8', fontSize: '15px', marginBottom: '20px' },
  rulesBox: {
    background: '#0f172a',
    padding: '18px',
    borderRadius: '12px',
    textAlign: 'left',
    marginBottom: '25px',
    fontSize: '14px',
    lineHeight: '1.8'
  },
  primaryBtn: {
    background: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    padding: '12px 28px',
    fontSize: '16px',
    fontWeight: '700',
    borderRadius: '8px',
    cursor: 'pointer',
    width: '100%'
  },
  gameWrapper: { display: 'flex', flexDirection: 'column', gap: '20px' },
  topTimerContainer: { display: 'flex', justifyContent: 'center', width: '100%' },
  timerBadge: {
    background: '#ef4444',
    color: '#fff',
    fontWeight: '800',
    fontSize: '20px',
    padding: '8px 24px',
    borderRadius: '30px',
    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)'
  },
  splitGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    background: '#1e293b',
    padding: '25px',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRight: '1px solid #334155',
    paddingRight: '20px'
  },
  labelHeader: { color: '#94a3b8', fontSize: '12px', fontWeight: '800', letterSpacing: '1px', marginBottom: '15px' },
  scrambledBox: { display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' },
  letterTile: {
    background: '#3b82f6',
    color: '#fff',
    fontSize: '24px',
    fontWeight: '800',
    width: '42px',
    height: '42px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
  },
  subtext: { color: '#64748b', fontSize: '13px', marginTop: '20px' },
  rightColumn: { display: 'flex', flexDirection: 'column', gap: '15px' },
  form: { width: '100%' },
  textInput: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #334155',
    background: '#0f172a',
    color: '#fff',
    fontSize: '16px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  submissionsContainer: {
    background: '#0f172a',
    borderRadius: '8px',
    padding: '12px',
    height: '220px',
    display: 'flex',
    flexDirection: 'column'
  },
  listHeader: { margin: '0 0 10px 0', fontSize: '14px', color: '#94a3b8' },
  listScroll: { overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 },
  emptyText: { color: '#475569', fontSize: '13px', textAlign: 'center', marginTop: '40px' },
  wordBadge: {
    display: 'flex',
    justify: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid',
    fontSize: '15px',
    fontWeight: '700'
  },
  wordText: { letterSpacing: '0.5px' },
  iconTag: { fontSize: '14px' },
  scoreBox: {
    background: '#0f172a',
    padding: '20px',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    margin: '20px 0'
  },
  scoreNumber: { fontSize: '48px', fontWeight: '900', color: '#38bdf8' },
  scoreLabel: { color: '#94a3b8', fontSize: '14px' }
};