import React, { useState, useEffect, useRef, useCallback } from 'react';

export default function WordSearch({ username = "Player" }) {
  const [gameState, setGameState] = useState('RULES'); // 'RULES' | 'PLAYING' | 'FINISHED' | 'EXHAUSTED' | 'DAILY_LOCKED'
  const [puzzle, setPuzzle] = useState(null);
  const [foundWords, setFoundWords] = useState([]);
  const [foundCellKeys, setFoundCellKeys] = useState(new Set());

  // Drag-selection state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null); // {row, col}
  const [dragCells, setDragCells] = useState([]);   // [{row,col,key}]
  const gridRef = useRef(null);

  const [timer, setTimer] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [bestTime, setBestTime] = useState(null);
  const [timeTaken, setTimeTaken] = useState(null);
  const [isNewBest, setIsNewBest] = useState(false);

  // Fetch puzzle from backend
  useEffect(() => {
    const API_URL = window.location.hostname === 'localhost'
      ? `http://localhost:5000/api/wordsearch/puzzle?username=${encodeURIComponent(username)}`
      : `/api/wordsearch/puzzle?username=${encodeURIComponent(username)}`;

    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        if (data.completedToday) {
          setGameState('DAILY_LOCKED');
          setErrorMessage(data.message);
        } else if (data.exhausted) {
          setGameState('EXHAUSTED');
          setErrorMessage(data.message);
        } else {
          setPuzzle(data);
          setBestTime(data.userBestTime);
        }
      })
      .catch(() => {
        // Local fallback mock (rare - only if backend is unreachable)
        setPuzzle({
          puzzleId: 99,
          category: 'Sample',
          grid: [
            ['C','A','T','S','X','Q','W','E'],
            ['D','O','G','S','R','T','Y','U'],
            ['B','I','R','D','F','G','H','J'],
            ['F','I','S','H','K','L','Z','X'],
            ['M','N','B','V','C','X','Z','A'],
            ['Q','W','E','R','T','Y','U','I'],
            ['A','S','D','F','G','H','J','K'],
            ['Z','X','C','V','B','N','M','L']
          ],
          words: ['CATS', 'DOGS', 'BIRD', 'FISH']
        });
      });
  }, [username]);

  // Timer
  useEffect(() => {
    let interval = null;
    if (gameState === 'PLAYING') {
      interval = setInterval(() => setTimer(prev => parseFloat((prev + 0.1).toFixed(1))), 100);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [gameState]);

  const handleStartGame = () => {
    setTimer(0);
    setFoundWords([]);
    setFoundCellKeys(new Set());
    setGameState('PLAYING');
  };

  // ---- Drag selection helpers ----

  // Given a start and current cell, snap to the nearest straight line
  // (horizontal / vertical / diagonal) and return the list of cells along it.
  const computeLine = (start, current) => {
    const rawDR = current.row - start.row;
    const rawDC = current.col - start.col;

    let stepR = Math.sign(rawDR);
    let stepC = Math.sign(rawDC);
    let length;

    if (rawDR === 0) { length = Math.abs(rawDC); }
    else if (rawDC === 0) { length = Math.abs(rawDR); }
    else { length = Math.min(Math.abs(rawDR), Math.abs(rawDC)); }

    const cells = [];
    for (let i = 0; i <= length; i++) {
      const r = start.row + stepR * i;
      const c = start.col + stepC * i;
      cells.push({ row: r, col: c, key: `${r}-${c}` });
    }
    return cells;
  };

  const cellFromPoint = (clientX, clientY) => {
    const el = document.elementFromPoint(clientX, clientY);
    if (!el || !el.dataset || el.dataset.row === undefined) return null;
    return { row: Number(el.dataset.row), col: Number(el.dataset.col) };
  };

  const startDrag = (row, col) => {
    if (gameState !== 'PLAYING') return;
    setIsDragging(true);
    setDragStart({ row, col });
    setDragCells([{ row, col, key: `${row}-${col}` }]);
  };

  const updateDrag = (row, col) => {
    if (!isDragging || !dragStart) return;
    setDragCells(computeLine(dragStart, { row, col }));
  };

  const endDrag = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    if (dragCells.length > 1 && puzzle) {
      const formed = dragCells.map(c => puzzle.grid[c.row][c.col]).join('');
      const reversed = formed.split('').reverse().join('');
      const matched = puzzle.words.find(w => (w === formed || w === reversed) && !foundWords.includes(w));

      if (matched) {
        const updatedFound = [...foundWords, matched];
        setFoundWords(updatedFound);
        setFoundCellKeys(prev => {
          const next = new Set(prev);
          dragCells.forEach(c => next.add(c.key));
          return next;
        });

        if (updatedFound.length === puzzle.words.length) {
          completeGame(timer);
        }
      }
    }

    setDragStart(null);
    setDragCells([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging, dragCells, puzzle, foundWords, timer]);

  // Mouse handlers (attached at document level so drags ending outside the grid still register)
  useEffect(() => {
    const onMouseMove = (e) => {
      if (!isDragging) return;
      const cell = cellFromPoint(e.clientX, e.clientY);
      if (cell) updateDrag(cell.row, cell.col);
    };
    const onMouseUp = () => endDrag();
    const onTouchMove = (e) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      const cell = cellFromPoint(touch.clientX, touch.clientY);
      if (cell) updateDrag(cell.row, cell.col);
    };
    const onTouchEnd = () => endDrag();

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging, dragStart, dragCells, puzzle, foundWords, timer]);

  // Game Completion Routine
  const completeGame = (finalTime) => {
    setGameState('FINISHED');
    setTimeTaken(finalTime);

    const API_URL = window.location.hostname === 'localhost'
      ? 'http://localhost:5000/api/wordsearch/submit'
      : '/api/wordsearch/submit';

    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, puzzleId: puzzle.puzzleId, timeTaken: finalTime })
    })
      .then(res => res.json())
      .then(data => {
        setBestTime(data.bestTime);
        setIsNewBest(data.isNewBest);
      })
      .catch(() => {
        if (!bestTime || finalTime < bestTime) {
          setBestTime(finalTime);
          setIsNewBest(true);
        }
      });
  };

  const dragCellKeys = new Set(dragCells.map(c => c.key));

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>🔍 DAILY WORD SEARCH</h1>

      {gameState === 'EXHAUSTED' && (
        <div style={styles.errorAlert}>
          🚨 <strong>All puzzles played!</strong>
          <p>{errorMessage}</p>
        </div>
      )}

      {gameState === 'DAILY_LOCKED' && (
        <div style={styles.card}>
          <h2 style={{ color: '#f59e0b', margin: '0 0 10px 0' }}>🔒 Completed For Today!</h2>
          <p style={{ color: '#cbd5e1' }}>{errorMessage}</p>
        </div>
      )}

      {gameState === 'RULES' && puzzle && (
        <div style={styles.card}>
          <h3 style={{ color: '#38bdf8', marginTop: 0 }}>📜 Game Rules</h3>
          {puzzle.category && <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '-10px' }}>Today's theme: <strong>{puzzle.category}</strong></p>}
          <ul style={styles.rulesList}>
            <li>Find all hidden target words inside the grid.</li>
            <li><strong>Click and drag</strong> across letters to select a word (any direction — across, down, or diagonal).</li>
            <li>Timer starts as soon as you hit <strong>START PUZZLE</strong>.</li>
            <li>Only <strong>1 completion per user per day</strong> is permitted!</li>
          </ul>

          {bestTime !== null && (
            <div style={styles.bestTimeBadge}>🏆 Your Best Time: <strong>{bestTime.toFixed(1)}s</strong></div>
          )}

          <button style={styles.startBtn} onClick={handleStartGame}>▶ START PUZZLE</button>
        </div>
      )}

      {gameState === 'PLAYING' && puzzle && (
        <div style={styles.gameArea}>
          <div style={styles.timerCard}>⏱️ Time: <span style={styles.timerText}>{timer.toFixed(1)}s</span></div>

          {/* Continuous grid: no gaps/borders between cells - one solid puzzle box */}
          <div
            ref={gridRef}
            style={{
              ...styles.grid,
              gridTemplateColumns: `repeat(${puzzle.grid[0].length}, 34px)`,
              gridTemplateRows: `repeat(${puzzle.grid.length}, 34px)`
            }}
            onMouseLeave={() => {}}
          >
            {puzzle.grid.map((row, rIdx) =>
              row.map((char, cIdx) => {
                const cellKey = `${rIdx}-${cIdx}`;
                const isFound = foundCellKeys.has(cellKey);
                const isDraggedOver = dragCellKeys.has(cellKey);

                return (
                  <div
                    key={cellKey}
                    data-row={rIdx}
                    data-col={cIdx}
                    style={{
                      ...styles.gridCell,
                      backgroundColor: isFound ? 'rgba(34,197,94,0.35)' : isDraggedOver ? 'rgba(56,189,248,0.4)' : 'transparent',
                      color: isFound ? '#bbf7d0' : isDraggedOver ? '#e0f2fe' : '#e2e8f0'
                    }}
                    onMouseDown={() => startDrag(rIdx, cIdx)}
                    onTouchStart={() => startDrag(rIdx, cIdx)}
                  >
                    {char}
                  </div>
                );
              })
            )}
          </div>

          <div style={styles.wordBank}>
            <h4 style={{ margin: '0 0 10px 0', color: '#94a3b8' }}>Target Words:</h4>
            <div style={styles.wordPills}>
              {puzzle.words.map(w => {
                const isFound = foundWords.includes(w);
                return (
                  <span key={w} style={{ ...styles.wordPill, textDecoration: isFound ? 'line-through' : 'none', backgroundColor: isFound ? '#22c55e' : '#334155', opacity: isFound ? 0.6 : 1 }}>
                    {w}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {gameState === 'FINISHED' && (
        <div style={styles.card}>
          <h2 style={{ color: '#22c55e', margin: '0 0 10px 0' }}>🎉 Puzzle Solved!</h2>
          <p style={{ fontSize: '18px', color: '#f8fafc' }}>Time Taken: <strong>{timeTaken?.toFixed(1)}s</strong></p>
          {isNewBest ? (
            <div style={styles.newBestBadge}>🔥 NEW PERSONAL BEST RECORD!</div>
          ) : (
            <p style={{ color: '#94a3b8' }}>Best Time: {bestTime?.toFixed(1)}s</p>
          )}
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '15px' }}>Come back tomorrow for your next puzzle!</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: '600px', margin: '0 auto', padding: '25px', background: 'rgba(30, 41, 59, 0.85)', backdropFilter: 'blur(16px)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontFamily: 'system-ui, sans-serif' },
  heading: { textAlign: 'center', fontSize: '28px', fontWeight: '900', color: '#f8fafc', margin: '0 0 20px 0', letterSpacing: '1px' },
  card: { background: '#0f172a', padding: '25px', borderRadius: '16px', border: '1px solid #334155', textAlign: 'center' },
  errorAlert: { background: '#7f1d1d', border: '2px solid #ef4444', color: '#fca5a5', padding: '20px', borderRadius: '12px', textAlign: 'center', fontSize: '16px' },
  rulesList: { textAlign: 'left', color: '#cbd5e1', fontSize: '14px', lineHeight: '1.8', margin: '15px 0 25px 0' },
  bestTimeBadge: { background: '#1e293b', border: '1px solid #3b82f6', color: '#38bdf8', padding: '10px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold' },
  startBtn: { width: '100%', padding: '14px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' },

  gameArea: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' },
  timerCard: { background: '#0f172a', padding: '10px 20px', borderRadius: '8px', border: '1px solid #334155', fontSize: '18px', color: '#94a3b8' },
  timerText: { color: '#38bdf8', fontWeight: 'bold', fontSize: '22px', marginLeft: '5px' },

  // One continuous bordered box - individual cells have no border/radius/gap of their own
  grid: { display: 'grid', gap: 0, padding: '10px', background: '#0f172a', borderRadius: '12px', border: '2px solid #334155', userSelect: 'none' },
  gridCell: { display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', userSelect: 'none', transition: 'background-color 0.1s ease' },

  wordBank: { width: '100%', background: '#0f172a', padding: '15px', borderRadius: '12px', border: '1px solid #334155', textAlign: 'center' },
  wordPills: { display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' },
  wordPill: { padding: '6px 14px', borderRadius: '20px', color: '#fff', fontSize: '14px', fontWeight: 'bold' },
  newBestBadge: { background: '#15803d', border: '1px solid #22c55e', color: '#f0fdf4', padding: '10px', borderRadius: '8px', fontWeight: 'bold', margin: '15px 0' }
};