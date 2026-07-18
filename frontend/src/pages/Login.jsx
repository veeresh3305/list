import React, { useState } from 'react';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [key, setKey] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, key })
      });

      const data = await response.json();

      if (data.success) {
        onLoginSuccess(); // Tell App.js to unlock the dashboard
      } else {
        setError(data.message || 'Incorrect Access Key!');
      }
    } catch (err) {
      setError('Cannot connect to backend server. Is it running?');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={{ textAlign: 'center', margin: '0 0 10px 0' }}>🔒 Private Access Hub</h2>
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
    </div>
  );
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', fontFamily: 'system-ui, sans-serif' },
  card: { background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', maxWidth: '400px', width: '100%' },
  sub: { color: '#666', fontSize: '14px', textAlign: 'center', marginBottom: '20px' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  input: { padding: '12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '16px' },
  btn: { padding: '12px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' },
  error: { background: '#fee2e2', color: '#991b1b', padding: '10px', borderRadius: '6px', fontSize: '14px', textAlign: 'center' }
};