'use client';

import { useEffect, useRef } from 'react';
import { TextEntry } from '../engine/types';

interface TextOutputProps {
  textLog: TextEntry[];
}

const entryStyles: Record<TextEntry['type'], React.CSSProperties> = {
  normal: { color: '#00ff41' },
  system: { color: '#ffb000' },
  error: { color: '#ff3333' },
  spooky: { color: '#cc4444', textShadow: '0 0 8px rgba(200,50,50,0.5)' },
  important: { color: '#39ff14', fontWeight: 'bold', textShadow: '0 0 6px rgba(57,255,20,0.6)' },
  title: { color: '#ffb000', textTransform: 'uppercase', fontSize: '1.1em', textShadow: '0 0 8px rgba(255,176,0,0.5)' },
};

export default function TextOutput({ textLog }: TextOutputProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);

  useEffect(() => {
    if (textLog.length !== prevLengthRef.current) {
      prevLengthRef.current = textLog.length;
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [textLog]);

  return (
    <div
      className="flex-1 overflow-y-auto p-3"
      style={{
        fontFamily: "'VT323', monospace",
        fontSize: '1.05rem',
        lineHeight: '1.4',
        backgroundColor: '#0a0a0a',
      }}
    >
      {textLog.map((entry) => (
        <div
          key={entry.id}
          className="text-entry-fadein mb-1"
          style={entryStyles[entry.type] ?? entryStyles.normal}
        >
          {entry.text.split('\n').map((line, i) => (
            <span key={i}>
              {line}
              {i < entry.text.split('\n').length - 1 && <br />}
            </span>
          ))}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
