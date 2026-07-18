import React, { useState } from 'react';
import PixelSnow from '../PixelSnow'; // Adjusted path assuming it's in the parent folder

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [key, setKey] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // CHANGED: Removed http://localhost:5000 so it utilizes your Vercel vercel.json rewrite rules securely
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, key })
      });

      const data = await response.json();

      if (data.success) {
        onLoginSuccess(); 
      } else {
        setError(data.message || 'Incorrect Access Key!');
      }
    } catch (err) {
      setError('Cannot connect to backend server. Try again shortly!');
    }
  };

  return (
    <div style={styles.container}>
      
      {/* 1. MATCHING FULL SCREEN SNOW BACKGROUND */}
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

      {/* 2. RESPONSIVE DECORATIVE SIDEKICKS FLEX LAYOUT */}
      <div style={styles.flexWrapper}>
        
        {/* Giant Leopard Sidekick */}
        <div style={{ ...styles.giantEmoji, ...styles.leftEmoji }}>🐆</div>

        {/* Login Central Card */}
        <div style={styles.card}>
          <h2 style={{ textAlign: 'center', margin: '0 0 10px 0', color: '#fff', fontWeight: '800' }}>
            🔒 Private Access Hub
          </h2>
          <p style={styles.sub}>Enter your name and the key provided by the owner.</p>
          
          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit} style={styles.form}>
            <input 
              type="text" 
              placeholder="Your Name (e.g. Alex)" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
              required
            />
            <input 
              type="password" 
              placeholder="Secret Access Key" 
              value={key}
              onChange={(e) => setKey(e.target.value)}
              style={styles.input}
              required
            />
            <button type="submit" style={styles.btn}>Unlock Hub</button>
          </form>
        </div>

        {/* Giant Tiger Sidekick */}
        <div style={{ ...styles.giantEmoji, ...styles.rightEmoji }}>🐅</div>

      </div>
    </div>
  );
}

const styles = {
  container: { 
    position: 'relative',
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '100vh', 
    width: '100vw',
    backgroundColor: '#0f172a', 
    fontFamily: 'system-ui, sans-serif',
    overflow: 'hidden'
  },
  fullscreenBackground: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    width: '100%', 
    height: '100%', 
    zIndex: 1, 
    pointerEvents: 'none' 
  },
  flexWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '40px',
    zIndex: 2,
    padding: '20px',
    width: '100%',
    maxWidth: '900px'
  },
  /* GIANT EMOJIS STYLE SHEETS */
  giantEmoji: {
    fontSize: 'min(110px, 18vw)', // Scales down automatically on smaller phone displays
    userSelect: 'none',
    filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.5))',
    transition: 'transform 0.3s ease',
  },
  leftEmoji: {
    transform: 'rotate(-5deg)',
  },
  rightEmoji: {
    transform: 'rotate(5deg)',
  },
  /* UPGRADED FROSTED CARD UI */
  card: { 
    background: 'rgba(30, 41, 59, 0.75)', 
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    padding: '40px 30px', 
    borderRadius: '24px', 
    boxShadow: '0 20px 40px rgba(0,0,0,0.4)', 
    maxWidth: '400px', 
    width: '100%',
    textAlign: 'center'
  },
  sub: { 
    color: '#94a3b8', 
    fontSize: '14px', 
    textAlign: 'center', 
    marginBottom: '25px',
    lineHeight: '1.5'
  },
  form: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '18px' 
  },
  input: { 
    padding: '14px 16px', 
    borderRadius: '12px', 
    border: '1px solid #334155', 
    backgroundColor: '#0f172a',
    color: '#fff',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  btn: { 
    padding: '14px', 
    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', 
    color: '#fff', 
    border: 'none', 
    borderRadius: '12px', 
    fontWeight: 'bold', 
    cursor: 'pointer', 
    fontSize: '16px',
    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
    transition: 'opacity 0.2s'
  },
  error: { 
    background: 'rgba(239, 68, 68, 0.2)', 
    color: '#fca5a5', 
    border: '1px solid rgba(239, 68, 68, 0.3)',
    padding: '12px', 
    borderRadius: '10px', 
    fontSize: '14px', 
    textAlign: 'center',
    marginBottom: '15px'
  }
};