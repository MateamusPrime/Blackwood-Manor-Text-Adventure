'use client';

import { roomArt } from '../data/art';

interface ArtPanelProps {
  artKey: string;
}

export default function ArtPanel({ artKey }: ArtPanelProps) {
  const art = roomArt[artKey] ?? roomArt['default'] ?? '';

  return (
    <div
      className="flex flex-col items-center justify-center p-2 shrink-0"
      style={{
        fontFamily: "'VT323', monospace",
      }}
    >
      <pre
        className="pixel-art text-center overflow-hidden"
        style={{
          color: '#00ff41',
          fontSize: 'clamp(0.6rem, 1.2vw, 0.85rem)',
          lineHeight: 1,
          letterSpacing: 0,
          textShadow: '0 0 4px rgba(0,255,65,0.4)',
          maxWidth: '100%',
          whiteSpace: 'pre',
        }}
      >
        {art}
      </pre>
    </div>
  );
}
