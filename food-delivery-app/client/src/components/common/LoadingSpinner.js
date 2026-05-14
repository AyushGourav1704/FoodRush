import React from 'react';

export default function LoadingSpinner({ fullScreen = false, size = 40 }) {
  const spinner = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{
        width: size, height: size,
        border: `3px solid #2a2a2a`,
        borderTop: `3px solid var(--primary)`,
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (fullScreen) return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg)' }}>
      {spinner}
    </div>
  );

  return spinner;
}
