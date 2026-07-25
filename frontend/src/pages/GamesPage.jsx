import React, { useState, useEffect } from 'react';

// Import games...
import WordleGame from '../games/wordle';
import WordsearchGame from '../games/Wordsearch';
import UnoGame from '../games/uno';
import TruthOrDareGame from '../games/TruthOrDare';
import WouldYouRatherGame from '../games/WouldYouRather';
import RateItGame from '../games/RateIt';
import AnagramGame from '../games/Anagram';

export default function GamesPage({ username = "Player" }) {
  const [activeGame, setActiveGame] = useState(null);
  const [completedDailyGames, setCompletedDailyGames] = useState([]);

  // Get Today's Date String (YYYY-MM-DD)
  const getTodayKey = () => new Date().toISOString().split('T')[0];

  // Load completed daily games for this specific username today
  useEffect(() => {
    const today = getTodayKey();
    const storageKey = `daily_completed_${username}_${today}`;
    const doneList = JSON.parse(localStorage.getItem(storageKey) || '[]');
    setCompletedDailyGames(doneList);
  }, [username, activeGame]);

  // Mark a daily challenge as done for today
  const markDailyAsCompleted = (gameName) => {
    const today = getTodayKey();
    const storageKey = `daily_completed_${username}_${today}`;
    const updated = [...completedDailyGames, gameName];
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setCompletedDailyGames(updated);
    setActiveGame(null);
  };

  const isDailyCompleted = (gameName) => completedDailyGames.includes(gameName);

  // --- DAILY GAMES DEFINITION ---
  const dailyGames = [
    { name: "Anagram", icon: "🔀", description: "Unscramble words in 2 mins!" },
    { name: "Wordsearch", icon: "🔍", description: "Find today's hidden words." }
  ];

  // --- MULTIPLAYER GAMES DEFINITION ---
  const partyGames = [
    { name: "Uno", icon: "🃏", rules: "Match cards by color or number." },
    { name: "Truth or Dare", icon: "🎭", rules: "Spin the wheel for truth or dare!" },
    { name: "Would You Rather", icon: "🤔", rules: "Vote on tricky choices together." },
    { name: "Rate It", icon: "⭐", rules: "Rate items 1-10 stars and compare." },
    { name: "Wordle", icon: "🔤", rules: "Guess the hidden word in 6 tries." }
  ];

  // --- 1. RENDER ACTIVE PLAYING GAME ---
  if (activeGame) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <button onClick={() => setActiveGame(null)} style={styles.backBtn}>
          ← Back to Arcade Zone
        </button>

        {/* Daily Solo Games - Pass completion callback and username */}
        {activeGame === 'Anagram' && (
          <AnagramGame 
            username={username} 
            onExit={() => markDailyAsCompleted('Anagram')} 
          />
        )}
        {activeGame === 'Wordsearch' && (
          <WordsearchGame 
            username={username} 
            onExit={() => markDailyAsCompleted('Wordsearch')} 
          />
        )}

        {/* Multiplayer Games */}
        {activeGame === 'Uno' && <UnoGame username={username} />}
        {activeGame === 'Truth or Dare' && <TruthOrDareGame username={username} />}
        {activeGame === 'Would You Rather' && <WouldYouRatherGame username={username} />}
        {activeGame === 'Rate It' && <RateItGame username={username} />}
        {activeGame === 'Wordle' && <WordleGame username={username} />}
      </div>
    );
  }

  // --- 2. RENDER MAIN DASHBOARD ---
  return (
    <div style={styles.subContainer}>
      
      {/* USER WELCOME HEADER */}
      <div style={styles.userBanner}>
        👤 Playing as: <strong style={{ color: '#38bdf8' }}>{username}</strong>
      </div>

      {/* SECTION 1: DAILY CHALLENGES */}
      <div style={{ marginBottom: '35px' }}>
        <div style={styles.sectionHeaderBox}>
          <h2 style={styles.subHeader}>📅 Daily Solo Challenges</h2>
          <span style={styles.badge}>1 Attempt Per Day</span>
        </div>

        <div style={styles.subGrid}>
          {dailyGames.map((game, idx) => {
            const completed = isDailyCompleted(game.name);

            return (
              <div 
                key={idx} 
                style={{ 
                  ...styles.subCard, 
                  borderTop: completed ? '3px solid #22c55e' : '3px solid #38bdf8',
                  opacity: completed ? 0.75 : 1,
                  cursor: completed ? 'not-allowed' : 'pointer'
                }} 
                onClick={() => {
                  if (completed) {
                    alert(`Hey ${username}, you already finished today's ${game.name}! Check back tomorrow.`);
                    return;
                  }
                  setActiveGame(game.name);
                }}
              >
                <div style={styles.subCardIcon}>{game.icon}</div>
                <h4 style={{ margin: '0 0 4px 0', color: '#fff', fontSize: '16px' }}>{game.name}</h4>
                <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#94a3b8' }}>{game.description}</p>
                
                {completed ? (
                  <span style={styles.completedTag}>✅ Done for Today</span>
                ) : (
                  <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 'bold' }}>Play Challenge →</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '30px 0' }} />

      {/* SECTION 2: MULTIPLAYER PARTY GAMES */}
      <div>
        <h2 style={styles.subHeader}>🎮 Party Multiplayer Games</h2>
        <div style={styles.subGrid}>
          {partyGames.map((game, idx) => (
            <div 
              key={idx} 
              style={{ ...styles.subCard, borderTop: '3px solid #a855f7' }} 
              onClick={() => setActiveGame(game.name)}
            >
              <div style={styles.subCardIcon}>{game.icon}</div>
              <h4 style={{ margin: '0 0 6px 0', color: '#fff', fontSize: '16px' }}>{game.name}</h4>
              <span style={{ fontSize: '12px', color: '#c084fc', fontWeight: 'bold' }}>Play Game →</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

// --- STYLES DEFINITION ---
const styles = {
  backBtn: { padding: '8px 16px', background: '#334155', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', color: '#f8fafc', marginBottom: '20px' },
  subContainer: { maxWidth: '850px', margin: '1.5rem auto', padding: '25px', background: 'rgba(30, 41, 59, 0.6)', backdropFilter: 'blur(16px)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)' },
  userBanner: { background: '#0f172a', padding: '10px 16px', borderRadius: '8px', color: '#94a3b8', fontSize: '14px', marginBottom: '20px', border: '1px solid #334155' },
  sectionHeaderBox: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  subHeader: { color: '#fff', fontSize: '22px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' },
  badge: { background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '700' },
  subGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px' },
  subCard: { background: '#0f172a', border: '1px solid #334155', padding: '16px', borderRadius: '12px', transition: 'transform 0.15s' },
  subCardIcon: { fontSize: '28px', marginBottom: '8px' },
  completedTag: { display: 'inline-block', background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', fontSize: '12px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '6px' }
};