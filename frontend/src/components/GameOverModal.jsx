import React from 'react';

/**
 * Reusable "game over" overlay. Pass either a simple `winnerText`, or a
 * `standings` array of { username, detail } rows for a ranked leaderboard.
 */
export default function GameOverModal({ title = '🏆 Game Over!', winnerText, standings, onPlayAgain, accentColor = '#22c55e' }) {
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={{ margin: '0 0 10px 0' }}>{title}</h2>

        {winnerText && (
          <p style={{ fontSize: '18px', margin: '0 0 15px 0' }}>{winnerText}</p>
        )}

        {standings && standings.length > 0 && (
          <div style={styles.standings}>
            {standings.map((row, idx) => (
              <div key={idx} style={{ ...styles.row, borderColor: idx === 0 ? accentColor : '#334155' }}>
                <span>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`} {row.username}</span>
                <span style={{ color: '#94a3b8' }}>{row.detail}</span>
              </div>
            ))}
          </div>
        )}

        {onPlayAgain && (
          <button style={{ ...styles.button, backgroundColor: accentColor }} onClick={onPlayAgain}>
            Play Again
          </button>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modal: { backgroundColor: '#1e293b', padding: '30px', borderRadius: '16px', border: '1px solid #334155', textAlign: 'center', width: '85%', maxWidth: '420px', color: '#fff' },
  standings: { display: 'flex', flexDirection: 'column', gap: '8px', margin: '10px 0 20px 0' },
  row: { display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#0f172a', border: '1px solid', borderRadius: '10px', fontSize: '14px' },
  button: { padding: '12px 24px', fontSize: '16px', borderRadius: '8px', border: 'none', color: '#fff', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }
};