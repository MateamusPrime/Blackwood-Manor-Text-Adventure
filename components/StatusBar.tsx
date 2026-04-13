'use client';

interface StatusBarProps {
  health: number;
  maxHealth: number;
  moveCount: number;
}

export default function StatusBar({ health, maxHealth, moveCount }: StatusBarProps) {
  const hearts = Array.from({ length: maxHealth }, (_, i) => i < health ? '♥' : '♡');

  return (
    <div
      className="flex items-center justify-between px-3 py-1 border-b text-sm select-none shrink-0"
      style={{
        backgroundColor: '#0a0a0a',
        borderColor: '#1a3a1a',
        color: '#ffb000',
        fontFamily: "'VT323', monospace",
        fontSize: '1.1rem',
        letterSpacing: '0.05em',
      }}
    >
      {/* Title */}
      <span style={{ color: '#ffb000', textShadow: '0 0 8px rgba(255,176,0,0.5)' }}>
        BLACKWOOD MANOR
      </span>

      {/* Health hearts */}
      <span style={{ color: '#ff4444', letterSpacing: '0.1em' }}>
        {hearts.map((h, i) => (
          <span
            key={i}
            style={{ color: h === '♥' ? '#ff4444' : '#441111' }}
          >
            {h}
          </span>
        ))}
      </span>

      {/* Move count */}
      <span style={{ color: '#00b32c' }}>
        MOVES: {String(moveCount).padStart(4, '0')}
      </span>
    </div>
  );
}
