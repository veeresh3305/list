import React, { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '/';
const socket = io(SOCKET_URL, { autoConnect: false });

const WORD_LENGTH = 5;
const MAX_ATTEMPTS = 6;

export default function Wordle({ username = "Player", roomId: initialRoomId = "" }) {
  // Room & State Management
  const [roomId, setRoomId] = useState(initialRoomId);
  const [inRoom, setInRoom] = useState(false);
  const [gameState, setGameState] = useState('LOBBY'); // LOBBY, WAITING_FOR_PLAYERS, WORD_SELECTION, PLAYING, GAME_OVER
  
  // Game Setup Info
  const [secretWordToGive, setSecretWordToGive] = useState('');
  const [wordSubmitted, setWordSubmitted] = useState(false);
  const [targetWord, setTargetWord] = useState(''); 

  // Game Play State
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameTime, setGameTime] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [winnerName, setWinnerName] = useState(null);

  const resetLocalGameState = () => {
    setGuesses([]);
    setCurrentGuess('');
    setGameTime(0);
    setIsFinished(false);
    setWordSubmitted(false);
    setSecretWordToGive('');
    setTargetWord('');
    setWinnerName(null);
  };

  // Connection & Room Setup
  useEffect(() => {
    if (!socket.connected) socket.connect();

    // Auto-join if roomId passed from GamesPage
    if (initialRoomId) {
      setRoomId(initialRoomId);
      socket.emit('join_room', { roomId: initialRoomId, username });
      setInRoom(true);
    }

    socket.on('player_joined', ({ playerCount }) => {
      if (playerCount >= 2) {
        setGameState('WORD_SELECTION');
      } else {
        setGameState('WAITING_FOR_PLAYERS');
      }
    });

    socket.on('start_game', ({ assignedWord }) => {
      setTargetWord(assignedWord.toUpperCase());
      setGameState('PLAYING');
    });

    socket.on('game_over', ({ winnerName }) => {
      setWinnerName(winnerName);
      setGameState('GAME_OVER');
    });

    socket.on('reset_to_selection', () => {
      resetLocalGameState();
      setGameState('WORD_SELECTION');
    });

    return () => {
      socket.off('player_joined');
      socket.off('start_game');
      socket.off('game_over');
      socket.off('reset_to_selection');
    };
  }, [initialRoomId, username]);

  // Timer while playing
  useEffect(() => {
    let interval = null;
    if (gameState === 'PLAYING' && !isFinished) {
      interval = setInterval(() => {
        setGameTime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [gameState, isFinished]);

  // Keyboard Event Handlers - Wrapped in useCallback to preserve function reference safely
  const handleVirtualKey = useCallback((key) => {
    if (gameState !== 'PLAYING' || isFinished) return;

    if (key === 'ENTER') {
      if (currentGuess.length !== WORD_LENGTH) return;

      const newGuesses = [...guesses, currentGuess.toUpperCase()];
      setGuesses(newGuesses);
      setCurrentGuess('');

      const isCorrect = currentGuess.toUpperCase() === targetWord;
      const isOutOfAttempts = newGuesses.length === MAX_ATTEMPTS;

      if (isCorrect || isOutOfAttempts) {
        setIsFinished(true);
        socket.emit('player_finished', {
          roomId,
          timeTaken: gameTime,
          won: isCorrect,
          attempts: newGuesses.length,
        });
      }
    } else if (key === 'BACK' || key === 'BACKSPACE') {
      setCurrentGuess((prev) => prev.slice(0, -1));
    } else if (/^[A-Z]$/.test(key) && currentGuess.length < WORD_LENGTH) {
      setCurrentGuess((prev) => prev + key);
    }
  }, [gameState, isFinished, currentGuess, guesses, targetWord, roomId, gameTime]);

  useEffect(() => {
    const onKeyDown = (e) => {
      const key = e.key.toUpperCase();
      if (key === 'ENTER') handleVirtualKey('ENTER');
      else if (key === 'BACKSPACE') handleVirtualKey('BACK');
      else if (/^[A-Z]$/.test(key)) handleVirtualKey(key);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleVirtualKey]);

  const joinRoom = () => {
    if (roomId.trim()) {
      socket.emit('join_room', { roomId: roomId.trim(), username });
      setInRoom(true);
    }
  };

  const submitSecretWord = () => {
    if (secretWordToGive.length === WORD_LENGTH) {
      socket.emit('submit_word', { roomId, word: secretWordToGive });
      setWordSubmitted(true);
    } else {
      alert(`Word must be exactly ${WORD_LENGTH} letters!`);
    }
  };

  // Wordle Tile Color Logic
  const getTileBg = (letter, colIndex, isSubmitted) => {
    if (!isSubmitted || !letter) return '#121213';
    
    if (targetWord[colIndex] === letter) {
      return '#538d4e'; // Green
    }
    if (targetWord.includes(letter)) {
      return '#b59f3b'; // Yellow
    }
    return '#3a3a3c'; // Gray
  };

  // RENDER: Room Enter Input
  if (!inRoom) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={{ margin: '0 0 15px 0' }}>🟩 Multiplayer Wordle</h2>
          <input
            style={styles.input}
            type="text"
            placeholder="Enter Room Code"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <button style={styles.button} onClick={joinRoom}>Join Game Room</button>
        </div>
      </div>
    );
  }

  // RENDER: Waiting Room
  if (gameState === 'WAITING_FOR_PLAYERS') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2>Room Code: <span style={{ color: '#38bdf8' }}>{roomId}</span></h2>
          <p style={{ color: '#94a3b8' }}>Waiting for an opponent to join...</p>
        </div>
      </div>
    );
  }

  // RENDER: Word Selection Screen
  if (gameState === 'WORD_SELECTION') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2>Set Target Word</h2>
          <p style={{ color: '#cbd5e1' }}>Enter a 5-letter word for your opponent to guess:</p>
          {!wordSubmitted ? (
            <div>
              <input
                style={{ ...styles.input, textAlign: 'center', letterSpacing: '4px', fontWeight: 'bold' }}
                type="text"
                maxLength={WORD_LENGTH}
                value={secretWordToGive}
                onChange={(e) => setSecretWordToGive(e.target.value.toUpperCase())}
              />
              <button style={{ ...styles.button, marginTop: '10px', width: '100%' }} onClick={submitSecretWord}>
                Lock In Word 🔒
              </button>
            </div>
          ) : (
            <p style={{ color: '#22c55e', fontWeight: 'bold' }}>
              ✓ Word Locked! Waiting for opponent...
            </p>
          )}
        </div>
      </div>
    );
  }

  // RENDER: Main Wordle Board
  return (
    <div style={styles.container}>
      <h2 style={{ margin: '0 0 5px 0' }}>🟩 Wordle Duel (Room: {roomId})</h2>
      <div style={styles.timer}>⏱️ Time: {gameTime}s</div>

      {/* Wordle Grid */}
      <div style={styles.board}>
        {Array.from({ length: MAX_ATTEMPTS }).map((_, rowIndex) => {
          const guess = guesses[rowIndex] || (rowIndex === guesses.length ? currentGuess : '');
          const isSubmitted = rowIndex < guesses.length;

          return (
            <div key={rowIndex} style={styles.row}>
              {Array.from({ length: WORD_LENGTH }).map((_, colIndex) => {
                const letter = guess[colIndex] || '';
                const bg = getTileBg(letter, colIndex, isSubmitted);

                return (
                  <div key={colIndex} style={{ ...styles.tile, backgroundColor: bg, borderColor: letter ? '#565758' : '#3a3a3c' }}>
                    {letter}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Finished Banner */}
      {gameState === 'PLAYING' && isFinished && (
        <p style={{ color: '#eab308', fontWeight: 'bold', marginTop: '15px' }}>
          You finished! Waiting for opponent to finish...
        </p>
      )}

      {/* Keyboard */}
      <div style={styles.keyboard}>
        {['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'].map((row, rIdx) => (
          <div key={rIdx} style={styles.keyRow}>
            {rIdx === 2 && <button style={styles.keyBtnWide} onClick={() => handleVirtualKey('ENTER')}>ENTER</button>}
            {row.split('').map((char) => (
              <button key={char} style={styles.keyBtn} onClick={() => handleVirtualKey(char)}>{char}</button>
            ))}
            {rIdx === 2 && <button style={styles.keyBtnWide} onClick={() => handleVirtualKey('BACK')}>⌫</button>}
          </div>
        ))}
      </div>

      {/* Game Over Popup */}
      {gameState === 'GAME_OVER' && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={{ margin: '0 0 10px 0' }}>🏆 Game Over!</h2>
            <p style={{ fontSize: '18px' }}>
              <strong>Winner:</strong> {winnerName ? <span style={{ color: '#22c55e' }}>{winnerName}</span> : 'Tie Game!'}
            </p>
            <p style={{ color: '#94a3b8' }}>Your secret word was: <strong>{targetWord}</strong></p>
            
            <div style={styles.buttonGroup}>
              <button style={styles.button} onClick={() => socket.emit('request_play_again', roomId)}>Play Again</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Styling definitions
const styles = {
  container: { display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'system-ui, sans-serif', color: '#fff', backgroundColor: '#0f172a', minHeight: '100vh', paddingTop: '20px' },
  card: { background: '#1e293b', padding: '30px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', maxWidth: '400px', width: '90%' },
  input: { padding: '12px', fontSize: '16px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#fff', width: '80%', marginBottom: '10px' },
  button: { padding: '12px 24px', fontSize: '16px', borderRadius: '8px', border: 'none', backgroundColor: '#22c55e', color: '#fff', fontWeight: 'bold', cursor: 'pointer' },
  timer: { fontSize: '18px', margin: '10px 0 20px 0', color: '#94a3b8' },
  board: { display: 'flex', flexDirection: 'column', gap: '6px' },
  row: { display: 'flex', gap: '6px' },
  tile: { width: '52px', height: '52px', border: '2px solid #3a3a3c', borderRadius: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px', fontWeight: '800', textTransform: 'uppercase' },
  keyboard: { marginTop: '25px', display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', maxWidth: '500px', padding: '0 10px' },
  keyRow: { display: 'flex', justifyContent: 'center', gap: '4px' },
  keyBtn: { flex: 1, height: '45px', background: '#334155', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' },
  keyBtnWide: { padding: '0 12px', height: '45px', background: '#475569', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modal: { backgroundColor: '#1e293b', padding: '30px', borderRadius: '16px', border: '1px solid #334155', textAlign: 'center', width: '85%', maxWidth: '400px' },
  buttonGroup: { display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }
};