import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import BucketList from './pages/BucketList';
import PixelSnow from './PixelSnow';

// GLOBAL POOL FOR THE FALLING BACKGROUND INTERACTION
const GLOBAL_EMOJI_POOL = ['✨', '🎈', '🎉', '🚀', '🦄', '🦗', '🧸', '😼','🐅','☃️','🦎','🐜','🪲','🐞','🐝','🐛','🪰','🦟'];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState('home'); 
  const [emojis, setEmojis] = useState([]);

  // Generate a bunch of emojis falling simultaneously
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

      setEmojis((prev) => {
        const fullList = [...prev, ...newBatch];
        return fullList.slice(-60); 
      });
    }, 1000); 

    return () => clearInterval(interval);
  }, [isAuthenticated, currentPage]);

  // If not logged in, force Login Screen
  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div style={{ ...styles.appContainer, position: 'relative', overflowX: 'hidden' }}>
      
      {/* INJECTED GLOBAL FALL ANIMATION KEYFRAMES */}
      <style>{`
        @keyframes fallDown {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.9; }
          90% { opacity: 0.9; }
          100% { transform: translateY(105vh) rotate(360deg); opacity: 0; }
        }
      `}</style>

      {/* 1. FULL PAGE BACKGROUND PIXEL SNOW */}
      {currentPage === 'home' && (
        <div style={styles.fullscreenBackground}>
          <PixelSnow 
            color="#ffffff"
            flakeSize={0.01}
            minFlakeSize={1.25}
            pixelResolution={200}
            speed={1.0}
            density={0.25}
            direction={90}
            brightness={1}
            depthFade={8}
            farPlane={20}
            gamma={0.4545}
            variant="square"
          />
        </div>
      )}

      {/* 2. FULL PAGE FALLING EMOJIS */}
      {currentPage === 'home' && (
        <div style={styles.fullscreenOverlay}>
          {emojis.map((emoji) => (
            <span
              key={emoji.id}
              style={{
                position: 'absolute',
                top: '-70px', 
                left: `${emoji.left}%`,
                fontSize: `${emoji.size}px`,
                animation: `fallDown ${emoji.duration}s linear forwards`,
                opacity: 0.9,
                filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))',
                pointerEvents: 'none'
              }}
            >
              {emoji.char}
            </span>
          ))}
        </div>
      )}

      {/* 3. FOREGROUND MAIN LAYOUT FRAME */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        {/* GLOBAL NAVBAR */}
        <header style={{ 
          ...styles.navbar, 
          backgroundColor: currentPage === 'home' ? 'rgba(255, 255, 255, 0.1)' : '#1e293b', 
          backdropFilter: currentPage === 'home' ? 'blur(10px)' : 'none',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{...styles.navBrand, color: '#fff'}} onClick={() => setCurrentPage('home')}>
            🤗 Our Activities Hub
          </div>
          <div style={styles.navLinks}>
            {currentPage !== 'home' && (
              <button onClick={() => setCurrentPage('home')} style={styles.backBtn}>
                🏠 Back to Dashboard
              </button>
            )}
            <button onClick={() => setIsAuthenticated(false)} style={styles.logoutBtn}>
              Logout
            </button>
          </div>
        </header>

        {/* DYNAMIC COMPONENT INJECTION ROUTER */}
        <main style={styles.mainContent}>
          {currentPage === 'home' && (
            <HomeDashboard onNavigate={(pageName) => setCurrentPage(pageName)} />
          )}

          {currentPage === 'drawing' && (
            <PlaceholderPage title="🎨 Drawing Board" text="Unleash your creativity here! Drawing canvas engine setting up next." onBack={() => setCurrentPage('home')} />
          )}

          {currentPage === 'quiz' && (
            <QuizRouterPage onBack={() => setCurrentPage('home')} />
          )}

          {currentPage === 'games' && (
            <GamesRouterPage onBack={() => setCurrentPage('home')} />
          )}

          {currentPage === 'bucketlist' && <BucketList />}
        </main>
      </div>
    </div>
  );
}

/* --- HOME DASHBOARD PANELS HUB --- */
function HomeDashboard({ onNavigate }) {
  return (
    <div style={styles.hubContainer}>
      <h2 style={{ ...styles.welcomeTitle, color: '#ffffff', textAlign: 'center' }}>Welcome to the Club! 👋</h2>
      <p style={{ ...styles.welcomeSub, color: '#94a3b8', textAlign: 'center' }}>Pick an activity block to get started with your friends.</p>

      <div style={styles.grid}>
        {/* Box 1: Drawing */}
        <div style={{ ...styles.card, borderLeft: '6px solid #ec4899' }} onClick={() => onNavigate('drawing')}>
          <div style={styles.cardIcon}>🎨</div>
          <h3 style={styles.cardTitle}>Drawing</h3>
          <p style={styles.cardText}>Express yourself visually on an interactive canvas layout!</p>
          <span style={styles.playLink}>Open Board →</span>
        </div>

        {/* Box 2: Quiz */}
        <div style={{ ...styles.card, borderLeft: '6px solid #3b82f6' }} onClick={() => onNavigate('quiz')}>
          <div style={styles.cardIcon}>🧠</div>
          <h3 style={styles.cardTitle}>Quiz</h3>
          <p style={styles.cardText}>Test your minds over trivia, music, pop culture, and custom profiles.</p>
          <span style={styles.playLink}>Start Quiz →</span>
        </div>

        {/* Box 3: Games */}
        <div style={{ ...styles.card, borderLeft: '6px solid #10b981' }} onClick={() => onNavigate('games')}>
          <div style={styles.cardIcon}>🎮</div>
          <h3 style={styles.cardTitle}>Games</h3>
          <p style={styles.cardText}>Co-op puzzles, split matches, and party-night icebreakers.</p>
          <span style={styles.playLink}>Play Games →</span>
        </div>

        {/* Box 4: Bucket List */}
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

/* --- INTERACTIVE SUBSIDIARY ROUTER: QUIZ PAGE --- */
function QuizRouterPage() {
  const categories = ['General Knowledge', 'Music', 'Sports', 'Movies', 'TV Shows', "Let's Make It Personal"];
  return (
    <div style={styles.subContainer}>
      <h2 style={styles.subHeader}>🧠 Choose a Quiz Category</h2>
      <div style={styles.subGrid}>
        {categories.map((cat, idx) => (
          <div key={idx} style={styles.subCard} onClick={() => alert(`Starting ${cat}...`)}>
            <div style={styles.subCardIcon}>📝</div>
            <h4 style={{margin: '0 0 4px 0', color: '#fff'}}>{cat}</h4>
            <span style={{fontSize: '12px', color: '#38bdf8'}}>Launch Trivia →</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --- INTERACTIVE SUBSIDIARY ROUTER: GAMES PAGE --- */
function GamesRouterPage() {
  const gameStructure = {
    "Together": ["Wordle", "Crossword", "Group the Words"],
    "Against": ["Uno", "Skip Bo", "Monopoly"],
    "Let's Make It Fun": ["Dares", "Truth", "Would You Rather", "Rate It"]
  };

  return (
    <div style={styles.subContainer}>
      <h2 style={styles.subHeader}>🎮 Arcade Zone</h2>
      
      {Object.keys(gameStructure).map((sectionTitle, sectionIdx) => (
        <div key={sectionIdx} style={{marginBottom: '2rem'}}>
          <h3 style={styles.sectionDividerTitle}>{sectionTitle}</h3>
          <div style={styles.subGrid}>
            {gameStructure[sectionTitle].map((gameName, gameIdx) => (
              <div key={gameIdx} style={{...styles.subCard, borderTop: '3px solid #a855f7'}} onClick={() => alert(`Launching ${gameName}...`)}>
                <h4 style={{margin: '0 0 6px 0', color: '#fff', fontSize: '16px'}}>{gameName}</h4>
                <span style={{fontSize: '12px', color: '#c084fc'}}>Play Match →</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* --- REUSABLE CANVAS COMPONENT --- */
function PlaceholderPage({ title, text }) {
  return (
    <div style={{ textAlign: 'center', marginTop: '4rem', padding: '20px', color: '#fff' }}>
      <h2>{title}</h2>
      <p style={{ color: '#94a3b8' }}>{text}</p>
    </div>
  );
}

/* --- INTEGRATED HUB STYLE DEFINITIONS --- */
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
  playLink: { marginTop: 'auto', fontWeight: 'bold', color: '#38bdf8', fontSize: '14px' },
  
  /* Sub-routers styles sheets */
  subContainer: { maxWidth: '850px', margin: '1.5rem auto', padding: '25px', background: 'rgba(30, 41, 59, 0.6)', backdropFilter: 'blur(16px)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)' },
  subHeader: { color: '#fff', fontSize: '24px', fontWeight: '800', margin: '0 0 1.5rem 0', letterSpacing: '-0.5px' },
  subGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px' },
  subCard: { background: '#0f172a', border: '1px solid #334155', padding: '16px', borderRadius: '12px', cursor: 'pointer', transition: 'transform 0.15s' },
  subCardIcon: { fontSize: '22px', marginBottom: '8px' },
  sectionDividerTitle: { color: '#94a3b8', fontSize: '14px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px', marginTop: '1.5rem', marginBottom: '1rem' }
};