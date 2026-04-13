'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useCommandHistory } from '../hooks/useCommandHistory';

interface CommandInputProps {
  onCommand: (cmd: string) => void;
  disabled?: boolean;
}

export default function CommandInput({ onCommand, disabled = false }: CommandInputProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { addCommand, navigateUp, navigateDown } = useCommandHistory();

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const cmd = value.trim();
      if (cmd) {
        addCommand(cmd);
        onCommand(cmd);
        setValue('');
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setValue(navigateUp());
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setValue(navigateDown());
    }
  };

  return (
    <div
      className="flex items-center px-3 py-2 border-t shrink-0"
      style={{
        backgroundColor: '#0a0a0a',
        borderColor: '#1a3a1a',
        fontFamily: "'VT323', monospace",
      }}
      onClick={() => inputRef.current?.focus()}
    >
      <span
        style={{
          color: '#00ff41',
          fontSize: '1.2rem',
          marginRight: '0.5rem',
          userSelect: 'none',
          textShadow: '0 0 4px rgba(0,255,65,0.6)',
        }}
      >
        &gt;
      </span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        placeholder={disabled ? 'Game over...' : 'Enter command...'}
        className="flex-1 bg-transparent outline-none border-none"
        style={{
          color: '#00ff41',
          fontFamily: "'VT323', monospace",
          fontSize: '1.2rem',
          caretColor: '#00ff41',
          textShadow: '0 0 4px rgba(0,255,65,0.4)',
        }}
      />
    </div>
  );
}
