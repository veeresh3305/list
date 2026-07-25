import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import BucketList from './pages/BucketList';
import GamesPage from './pages/GamesPage';     // <-- Imports Games module
import QuizPage from './pages/QuizPage';       // <-- Imports Quiz module
import DrawChallenge from './pages/draw';      // <-- Drawing component
import PixelSnow from './components/PixelSnow';

const GLOBAL_EMOJI_POOL = ['✨', '🎈', '🎉', '🚀', '🦄', '🦗', '🧸', '😼','🐅','☃️','🦎','🐜','🪲','🐞','🐝','🐛','🪰','🦟'];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('app_username');
  });
  
  // Extract and persist username across sessions
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('app_username') || 'Player';
  });

  const [currentPage, setCurrentPage] = useState('home'); 
  const [emojis, setEmojis] = useState([]);

  // Login handler capturing username from Login.jsx
  const handleLoginSuccess = (user) => {
    const activeUser = user || 'Player';
    setUsername(activeUser);
    localStorage.setItem('app_username', activeUser);
    setIsAuthenticated(true);
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('app_username');
    setIsAuthenticated(false);
    setUsername('Player');
  };

  useEffect(() => {
    if (!isAuthenticated || currentPage !== 'home') return;
    
    const interval = setInterval(() => {
      const batchSize = 4; 
      const newBatch = [];

      for (let i = 0; i < batchSize; i++) {
        const targetIndex = Math.floor(Math.random() * GLOBAL_EMOJI_POOL.length);
        const selectedEmoji = GLOBAL_EMOJI_POOL[targetIndex];
        
        newBatch.push({
          id: `${Date.now()}-${Math.random()}-${i}-${targetIndex}`, 
          char: selectedEmoji,
          left: Math.random() * 100, 
          duration: 4 + Math.random() * 2, 
          size: 40 + Math.random() * 25 
        });
      }

      setEmojis((prev) => [...prev, ...newBatch].slice(-60));
    }, 1000); 

    return () => clearInterval(interval);
  }, [isAuthenticated, currentPage]);

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const handleGoHome = () => {
    setCurrentPage('home');
  };

  return (
    <div style={{ ...styles.appContainer, position: 'relative', overflowX: 'hidden' }}>
      <style>{`
        @keyframes fallDown {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.9; }
          90% { opacity: 0.9; }
          100% { transform: translateY(105vh) rotate(360deg); opacity: 0; }
        }
      `}</style>

      {/* BACKGROUND EFFECTS */}
      {currentPage === 'home' && (
        <div style={styles.fullscreenBackground}>
          <PixelSnow color="#ffffff" flakeSize={0.01} minFlakeSize={1.25} pixelResolution={200} speed={1.0} density={0.25} direction={90} brightness={1} depthFade={8} farPlane={20} gamma={0.4545} variant="square" />
        </div>
      )}

      {currentPage === 'home' && (
        <div style={styles.fullscreenOverlay}>
          {emojis.map((emoji) => (
            <span key={emoji.id} style={{ position: 'absolute', top: '-70px', left: `${emoji.left}%`, fontSize: `${emoji.size}px`, animation: `fallDown ${emoji.duration}s linear forwards`, opacity: 0.9, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))', pointerEvents: 'none' }}>
              {emoji.char}
            </span>
          ))}
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <header style={{ ...styles.navbar, backgroundColor: currentPage === 'home' ? 'rgba(255, 255, 255, 0.1)' : '#1e293b', backdropFilter: currentPage === 'home' ? 'blur(10px)' : 'none', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{...styles.navBrand, color: '#fff'}} onClick={handleGoHome}>
            🤗 Our Activities Hub
          </div>
          <div style={styles.navLinks}>
            {currentPage !== 'home' && (
              <button onClick={handleGoHome} style={styles.backBtn}>🏠 Back to Dashboard</button>
            )}
            <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
          </div>
        </header>

        {/* CLEAN PAGE SWITCH WITH USERNAME PROPS */}
        <main style={styles.mainContent}>
          {currentPage === 'home' && <HomeDashboard username={username} onNavigate={(page) => setCurrentPage(page)} />}
          {currentPage === 'drawing' && <DrawChallenge username={username} />}
          {currentPage === 'quiz' && <QuizPage username={username} />}
          {currentPage === 'games' && <GamesPage username={username} />}
          {currentPage === 'bucketlist' && <BucketList username={username} />}
        </main>
      </div>
    </div>
  );
}

function HomeDashboard({ username, onNavigate }) {
  return (
    <div style={styles.hubContainer}>
      <h2 style={{ ...styles.welcomeTitle, color: '#ffffff', textAlign: 'center' }}>Welcome, {username}! 👋</h2>
      <p style={{ ...styles.welcomeSub, color: '#94a3b8', textAlign: 'center' }}>Pick an activity block to get started with your friends.</p>

      <div style={styles.grid}>
        <div style={{ ...styles.card, borderLeft: '6px solid #ec4899' }} onClick={() => onNavigate('drawing')}>
          <div style={styles.cardIcon}>🎨</div>
          <h3 style={styles.cardTitle}>Drawing</h3>
          <p style={styles.cardText}>Express yourself visually on an interactive canvas layout!</p>
          <span style={styles.playLink}>Open Board →</span>
        </div>

        <div style={{ ...styles.card, borderLeft: '6px solid #3b82f6' }} onClick={() => onNavigate('quiz')}>
          <div style={styles.cardIcon}>🧠</div>
          <h3 style={styles.cardTitle}>Quiz</h3>
          <p style={styles.cardText}>Test your minds over trivia, music, pop culture, and custom profiles.</p>
          <span style={styles.playLink}>Start Quiz →</span>
        </div>

        <div style={{ ...styles.card, borderLeft: '6px solid #10b981' }} onClick={() => onNavigate('games')}>
          <div style={styles.cardIcon}>🎮</div>
          <h3 style={styles.cardTitle}>Games</h3>
          <p style={styles.cardText}>Word puzzles, party night icebreakers, and quick challenges.</p>
          <span style={styles.playLink}>Play Games →</span>
        </div>

        <div style={{ ...styles.card, borderLeft: '6px solid #8b5cf6' }} onClick={() => onNavigate('bucketlist')}>
          <div style={styles.cardIcon}>🎯</div>
          <h3 style={styles.cardTitle}>Bucket List</h3>
          <p style={styles.cardText}>Track adventures, target places, and let fate choose via slot machine roulette!</p>
          <span style={styles.playLink}>Open List →</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  appContainer: { backgroundColor: '#0f172a', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' },
  fullscreenBackground: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0, pointerEvents: 'none', background: '#0f172a' },
  fullscreenOverlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1, pointerEvents: 'none' },
  navbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 30px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', transition: 'background-color 0.3s' },
  navBrand: { fontSize: '20px', fontWeight: 'bold', cursor: 'pointer', letterSpacing: '-0.5px' },
  navLinks: { display: 'flex', gap: '15px' },
  backBtn: { padding: '8px 16px', background: '#334155', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', color: '#f8fafc' },
  logoutBtn: { padding: '8px 16px', background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' },
  mainContent: { padding: '20px', position: 'relative', zIndex: 5 },
  hubContainer: { maxWidth: '1000px', margin: '2rem auto', padding: '0 20px' },
  welcomeTitle: { fontSize: '32px', margin: '0 0 6px 0', fontWeight: '800' },
  welcomeSub: { fontSize: '16px', marginBottom: '3rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '25px' },
  card: { background: 'rgba(30, 41, 59, 0.75)', backdropFilter: 'blur(12px)', padding: '25px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' },
  cardIcon: { fontSize: '32px', marginBottom: '12px' },
  cardTitle: { color: '#fff', fontSize: '20px', margin: '0 0 8px 0', fontWeight: '700' },
  cardText: { color: '#94a3b8', fontSize: '14px', margin: '0 0 16px 0', lineHeight: '1.5' },
  playLink: { marginTop: 'auto', fontWeight: 'bold', color: '#38bdf8', fontSize: '14px' }
};