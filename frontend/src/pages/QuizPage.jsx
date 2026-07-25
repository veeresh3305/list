import React, { useState } from 'react';
import QuizRoom from '../games/QuizRoom';

const CATEGORIES = [
  { name: 'General Knowledge', icon: '🌍' },
  { name: 'Movies', icon: '🎬' },
  { name: 'Sports', icon: '🏆' },
  { name: 'Music', icon: '🎵' }
];

export default function QuizPage({ username = 'Player' }) {
  const [selectedCategory, setSelectedCategory] = useState(null);

  if (selectedCategory) {
    return (
      <QuizRoom
        username={username}
        category={selectedCategory}
        onExitCategory={() => setSelectedCategory(null)}
      />
    );
  }

  return (
    <div style={styles.subContainer}>
      <h2 style={styles.subHeader}>🧠 Choose a Quiz Category</h2>
      <p style={{ color: '#94a3b8', margin: '-10px 0 20px 0', fontSize: '14px' }}>
        10 questions, 2 minutes, most correct answers wins.
      </p>
      <div style={styles.subGrid}>
        {CATEGORIES.map((cat, idx) => (
          <div key={idx} style={styles.subCard} onClick={() => setSelectedCategory(cat.name)}>
            <div style={styles.subCardIcon}>{cat.icon}</div>
            <h4 style={{ margin: '0 0 4px 0', color: '#fff' }}>{cat.name}</h4>
            <span style={{ fontSize: '12px', color: '#38bdf8' }}>Launch Trivia →</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  subContainer: { maxWidth: '850px', margin: '1.5rem auto', padding: '25px', background: 'rgba(30, 41, 59, 0.6)', backdropFilter: 'blur(16px)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)' },
  subHeader: { color: '#fff', fontSize: '24px', fontWeight: '800', margin: '0 0 0.4rem 0', letterSpacing: '-0.5px' },
  subGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px' },
  subCard: { background: '#0f172a', border: '1px solid #334155', padding: '16px', borderRadius: '12px', cursor: 'pointer', transition: 'transform 0.15s' },
  subCardIcon: { fontSize: '22px', marginBottom: '8px' }
};