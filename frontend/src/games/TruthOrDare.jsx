import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

// Establish singleton Socket connection
const SOCKET_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '/';
const socket = io(SOCKET_URL, { autoConnect: false });

export default function TruthOrDareGame({ username = "Player", roomId: initialRoomId = "" }) {
  // Room Management
  const [roomId, setRoomId] = useState(initialRoomId);
  const [inRoom, setInRoom] = useState(false);
  const [roomPlayers, setRoomPlayers] = useState([]);
  const [currentTurn, setCurrentTurn] = useState('');

  // Game setup states
  const [gameMode, setGameMode] = useState(null); // 'truth' | 'dare' | null
  const [prompts, setPrompts] = useState({ truth: [], dare: [] });
  const [loading, setLoading] = useState(true);

  // Wheel & Result states
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [wheelItems, setWheelItems] = useState([]);
  
  const canvasRef = useRef(null);
  const rotationRef = useRef(0);

  // Canvas Drawing Logic
  const drawWheel = useCallback((currentAngle) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = width / 2 - 10;

    const displayItems = wheelItems.slice(0, 10);
    const numSlices = displayItems.length;
    if (numSlices === 0) return;

    const sliceAngle = (2 * Math.PI) / numSlices;
    ctx.clearRect(0, 0, width, height);

    displayItems.forEach((item, index) => {
      const angle = currentAngle + index * sliceAngle;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, angle, angle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = index % 2 === 0 ? '#3b82f6' : '#8b5cf6';
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      const shortText = item.length > 18 ? item.substring(0, 15) + '...' : item;
      ctx.fillText(shortText, radius - 15, 4);
      ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#f8fafc';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.stroke();
  }, [wheelItems]);

  // Synchronized Canvas Wheel Animation
  const runSpinAnimation = useCallback((totalRotation) => {
    setIsSpinning(true);
    setSelectedResult(null);

    const duration = 4000;
    const start = performance.now();
    const initialAngle = rotationRef.current;

    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentAngle = initialAngle + totalRotation * easeOut;
      rotationRef.current = currentAngle;

      drawWheel(currentAngle);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);

        // Only player whose turn it was calculates & emits result
        if (currentTurn === username || !currentTurn) {
          const normalizedAngle = (2 * Math.PI - (currentAngle % (2 * Math.PI))) % (2 * Math.PI);
          const displayItems = wheelItems.slice(0, 10);
          const sliceAngle = (2 * Math.PI) / displayItems.length;
          const selectedIndex = Math.floor(normalizedAngle / sliceAngle) % displayItems.length;
          const chosen = displayItems[selectedIndex];

          const otherPlayers = roomPlayers.filter(p => p !== username);
          const nextPlayer = otherPlayers.length > 0 ? otherPlayers[0] : username;

          socket.emit('complete_spin_turn', {
            roomId,
            prompt: chosen,
            nextTurnPlayer: nextPlayer
          });
        }
      }
    };

    requestAnimationFrame(animate);
  }, [drawWheel, currentTurn, username, wheelItems, roomPlayers, roomId]);

  // 1. Fetch Prompts & Socket Setup
  useEffect(() => {
    const API_URL = window.location.hostname === 'localhost' 
      ? 'http://localhost:5000/api/truth-or-dare' 
      : '/api/truth-or-dare';

    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        setPrompts({ truth: data.truths, dare: data.dares });
        setLoading(false);
      })
      .catch(() => {
        setPrompts({
          truth: ["What is your biggest fear?", "What is a secret you haven't shared?"],
          dare: ["Do 10 jumping jacks.", "Speak in an accent for 2 turns."]
        });
        setLoading(false);
      });

    if (!socket.connected) socket.connect();

    if (initialRoomId) {
      setRoomId(initialRoomId);
      socket.emit('join_room', { roomId: initialRoomId, username });
      setInRoom(true);
    }

    socket.on('room_state_update', ({ players, currentTurn }) => {
      setRoomPlayers(players);
      setCurrentTurn(currentTurn);
    });

    socket.on('mode_changed', ({ mode }) => {
      setGameMode(mode);
      setSelectedResult(null);
    });

    socket.on('wheel_spin_start', ({ extraRotation }) => {
      runSpinAnimation(extraRotation);
    });

    socket.on('spin_result_received', ({ prompt, nextTurnPlayer }) => {
      setSelectedResult(prompt);
      setCurrentTurn(nextTurnPlayer);
      setWheelItems(prev => prev.filter(item => item !== prompt));
    });

    socket.on('mode_reset', () => {
      setGameMode(null);
      setSelectedResult(null);
    });

    return () => {
      socket.off('room_state_update');
      socket.off('mode_changed');
      socket.off('wheel_spin_start');
      socket.off('spin_result_received');
      socket.off('mode_reset');
    };
  }, [initialRoomId, username, runSpinAnimation]);

  // Update wheel slices when game mode or prompt deck changes
  useEffect(() => {
    if (!gameMode) return;
    setWheelItems(prompts[gameMode] || []);
  }, [gameMode, prompts]);

  // Redraw Canvas when items change
  useEffect(() => {
    if (!gameMode || wheelItems.length === 0) return;
    drawWheel(rotationRef.current);
  }, [gameMode, wheelItems, drawWheel]);

  const joinRoom = () => {
    if (roomId.trim()) {
      socket.emit('join_room', { roomId: roomId.trim(), username });
      setInRoom(true);
    }
  };

  const handleSelectMode = (mode) => {
    socket.emit('select_mode', { roomId, mode });
  };

  const handleResetMode = () => {
    socket.emit('reset_mode', { roomId });
  };

  const initiateSpin = () => {
    if (isSpinning || wheelItems.length === 0) return;
    if (currentTurn && currentTurn !== username) {
      alert(`It's ${currentTurn}'s turn to spin!`);
      return;
    }

    const extraRounds = 5 + Math.floor(Math.random() * 5);
    const randomOffset = Math.random() * 2 * Math.PI;
    const totalRotation = extraRounds * 2 * Math.PI + randomOffset;

    socket.emit('trigger_spin', { roomId, extraRotation: totalRotation });
  };

  if (loading) {
    return <div style={styles.loading}>Loading Truth or Dare Deck... 🎭</div>;
  }

  // 1. LOBBY SCREEN (Wordle-style Room Input)
  if (!inRoom) {
    return (
      <div style={styles.container}>
        <div style={styles.rulesCard}>
          <h2 style={{ margin: '0 0 15px 0' }}>🎭 Truth or Dare Duel</h2>
          <input
            style={styles.input}
            type="text"
            placeholder="Enter Room Code"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <button style={styles.truthBtn} onClick={joinRoom}>
            Join Game Room
          </button>
        </div>
      </div>
    );
  }

  // 2. WAITING ROOM SCREEN
  if (roomPlayers.length < 2) {
    return (
      <div style={styles.container}>
        <div style={styles.rulesCard}>
          <h2>Room Code: <span style={{ color: '#38bdf8' }}>{roomId}</span></h2>
          <p style={{ color: '#94a3b8' }}>Waiting for an opponent to join...</p>
        </div>
      </div>
    );
  }

  // 3. MAIN MULTIPLAYER GAME
  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>🎭 TRUTH OR DARE</h1>

      {/* MODE SELECTION SCREEN */}
      {!gameMode && (
        <div style={styles.rulesCard}>
          <h3 style={{ color: '#38bdf8', marginTop: 0 }}>📖 How To Play</h3>
          <p style={styles.rulesText}>
            1. Players take turns choosing between <strong>Truth</strong> or <strong>Dare</strong>.<br/>
            2. Click the big wheel to spin for your challenge.<br/>
            3. Each prompt appears once per session and won't repeat!
          </p>

          <div style={styles.btnRow}>
            <button style={styles.truthBtn} onClick={() => handleSelectMode('truth')}>
              🤔 Choose TRUTH
            </button>
            <button style={styles.dareBtn} onClick={() => handleSelectMode('dare')}>
              🔥 Choose DARE
            </button>
          </div>
        </div>
      )}

      {/* ACTIVE GAME PLAY AREA */}
      {gameMode && (
        <div>
          <div style={styles.modeBadge}>
            MODE: <span style={{ color: gameMode === 'truth' ? '#38bdf8' : '#ec4899', textTransform: 'uppercase' }}>{gameMode}</span>
            <span style={{ marginLeft: '15px', color: '#94a3b8' }}>| ROOM: {roomId}</span>
          </div>

          <div style={styles.turnIndicator}>
            Current Turn: <strong style={{ color: '#38bdf8', fontSize: '18px' }}>{currentTurn || username}</strong>
          </div>

          <div style={styles.gameLayout}>
            {/* WHEEL DISPLAY */}
            <div style={styles.wheelSection}>
              <div style={styles.pointer}>▼</div>
              <canvas 
                ref={canvasRef} 
                width={320} 
                height={320} 
                style={styles.canvas}
                onClick={initiateSpin}
              />
              <button 
                style={{
                  ...styles.spinButton,
                  opacity: (isSpinning || (currentTurn && currentTurn !== username)) ? 0.6 : 1,
                  cursor: (isSpinning || (currentTurn && currentTurn !== username)) ? 'not-allowed' : 'pointer'
                }} 
                onClick={initiateSpin}
                disabled={isSpinning || (currentTurn && currentTurn !== username)}
              >
                {isSpinning ? "Spinning..." : (currentTurn && currentTurn !== username) ? `Waiting for ${currentTurn}...` : "SPIN THE WHEEL 🎡"}
              </button>
            </div>

            {/* PROMPT RESULT */}
            <div style={styles.resultSection}>
              {selectedResult ? (
                <div style={styles.resultCard}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#94a3b8', fontSize: '14px' }}>
                    Challenge Prompt:
                  </h4>
                  <p style={styles.promptText}>"{selectedResult}"</p>
                </div>
              ) : (
                <div style={styles.placeholderCard}>
                  <p style={{ color: '#94a3b8', fontSize: '16px', margin: 0 }}>
                    Click <strong>SPIN THE WHEEL</strong> to get a prompt!
                  </p>
                </div>
              )}

              <button 
                style={styles.switchBtn} 
                onClick={handleResetMode}
                disabled={isSpinning}
              >
                🔄 Switch Mode / Rules
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// STYLES
const styles = {
  container: { maxWidth: '850px', margin: '0 auto', padding: '25px', background: 'rgba(30, 41, 59, 0.75)', backdropFilter: 'blur(16px)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontFamily: 'system-ui, sans-serif' },
  heading: { textAlign: 'center', fontSize: '32px', fontWeight: '900', color: '#f8fafc', margin: '0 0 20px 0', letterSpacing: '1px' },
  loading: { textAlign: 'center', padding: '50px', color: '#94a3b8', fontSize: '18px' },
  
  input: { padding: '12px', fontSize: '16px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#fff', width: '80%', marginBottom: '15px' },
  rulesCard: { background: '#0f172a', padding: '25px', borderRadius: '16px', border: '1px solid #334155', textAlign: 'center', maxWidth: '500px', margin: '0 auto' },
  rulesText: { color: '#cbd5e1', fontSize: '15px', lineHeight: '1.6', textAlign: 'left', marginBottom: '25px' },
  btnRow: { display: 'flex', gap: '15px', justifyContent: 'center' },
  truthBtn: { flex: 1, padding: '14px', background: 'linear-gradient(135deg, #0284c7, #38bdf8)', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' },
  dareBtn: { flex: 1, padding: '14px', background: 'linear-gradient(135deg, #be185d, #ec4899)', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' },

  modeBadge: { textAlign: 'center', fontWeight: 'bold', fontSize: '14px', letterSpacing: '1px', marginBottom: '10px' },
  turnIndicator: { textAlign: 'center', background: '#0f172a', padding: '10px', borderRadius: '8px', border: '1px solid #334155', width: 'fit-content', margin: '0 auto 25px auto', color: '#e2e8f0' },
  
  gameLayout: { display: 'flex', flexWrap: 'wrap', gap: '30px', alignItems: 'center', justifyContent: 'center' },
  wheelSection: { display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' },
  pointer: { fontSize: '24px', color: '#ef4444', position: 'absolute', top: '-10px', zIndex: 10 },
  canvas: { cursor: 'pointer', filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.5))' },
  spinButton: { marginTop: '15px', padding: '12px 24px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', transition: 'opacity 0.2s' },

  resultSection: { flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '15px' },
  resultCard: { background: '#0f172a', padding: '25px', borderRadius: '16px', border: '2px solid #3b82f6', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', textAlign: 'center' },
  placeholderCard: { background: '#0f172a', padding: '30px', borderRadius: '16px', border: '1px dashed #334155', textAlign: 'center' },
  promptText: { fontSize: '22px', fontWeight: 'bold', color: '#f8fafc', margin: '15px 0', lineHeight: '1.4' },
  switchBtn: { padding: '10px', background: 'transparent', color: '#94a3b8', border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }
};