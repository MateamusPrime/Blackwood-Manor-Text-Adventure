'use client';

import { useState, useCallback } from 'react';
import { useGame } from '../hooks/useGame';
import { items } from '../data/items';
import StatusBar from './StatusBar';
import ArtPanel from './ArtPanel';
import TextOutput from './TextOutput';
import CommandInput from './CommandInput';
import Inventory from './Inventory';

const TITLE_ART =
  ' ██████╗ ██╗      █████╗  ██████╗██╗  ██╗██╗    ██╗ ██████╗  ██████╗ ██████╗ \n' +
  ' ██╔══██╗██║     ██╔══██╗██╔════╝██║ ██╔╝██║    ██║██╔═══██╗██╔═══██╗██╔══██╗\n' +
  ' ██████╔╝██║     ███████║██║     █████╔╝ ██║ █╗ ██║██║   ██║██║   ██║██║  ██║\n' +
  ' ██╔══██╗██║     ██╔══██║██║     ██╔═██╗ ██║███╗██║██║   ██║██║   ██║██║  ██║\n' +
  ' ██████╔╝███████╗██║  ██║╚██████╗██║  ██╗╚███╔███╔╝╚██████╔╝╚██████╔╝██████╔╝\n' +
  ' ╚═════╝ ╚══════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝ ╚══╝╚══╝  ╚═════╝  ╚═════╝ ╚═════╝\n' +
  '\n' +
  '          ███╗   ███╗ █████╗ ███╗   ██╗ ██████╗ ██████╗ \n' +
  '          ████╗ ████║██╔══██╗████╗  ██║██╔═══██╗██╔══██╗\n' +
  '          ██╔████╔██║███████║██╔██╗ ██║██║   ██║██████╔╝\n' +
  '          ██║╚██╔╝██║██╔══██║██║╚██╗██║██║   ██║██╔══██╗\n' +
  '          ██║ ╚═╝ ██║██║  ██║██║ ╚████║╚██████╔╝██║  ██║\n' +
  '          ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝  ╚═╝';

const INITIAL_TITLE_LOG = [
  '> Something stirs in the darkness of Blackwood Manor...',
  '> A missing man. A cursed house. A thing that should not be.',
  '',
  '  Type  START  to begin your investigation.',
  '  Type  HELP   at any time for a list of commands.',
  '',
  '  [ Use arrow keys to recall previous commands ]',
];

export default function GameScreen() {
  const { state, processCommand } = useGame();
  const [gameStarted, setGameStarted] = useState(false);
  const [titleLog, setTitleLog] = useState<string[]>(INITIAL_TITLE_LOG);

  const handleTitleCommand = useCallback(
    (input: string) => {
      const cmd = input.trim().toLowerCase();
      setTitleLog((prev) => [...prev, '> ' + input]);

      if (['start', 'begin', 'play', 'go', 'enter', 'yes'].includes(cmd)) {
        setTitleLog((prev) => [
          ...prev,
          '',
          '> You approach the iron gate of Blackwood Manor...',
          '> It swings open with a groan.',
          '> There is no going back now.',
          '',
        ]);
        setTimeout(() => {
          setGameStarted(true);
          processCommand('look');
        }, 800);
      } else if (['help', '?', 'commands'].includes(cmd)) {
        setTitleLog((prev) => [
          ...prev,
          '',
          '  COMMANDS:',
          '  go <direction>     - Move (n/s/e/w/up/down)',
          '  look               - Describe surroundings',
          '  look at <thing>    - Examine something',
          '  take <item>        - Pick up an item',
          '  use <item>         - Use an item',
          '  inventory (i)      - Check your items',
          '  save / load        - Save or restore progress',
          '  help               - Show this list',
          '',
          '  Type START to begin.',
          '',
        ]);
      } else {
        setTitleLog((prev) => [
          ...prev,
          '  The manor waits. Type START to enter.',
        ]);
      }
    },
    [processCommand],
  );

  const handleGameCommand = useCallback(
    (input: string) => {
      processCommand(input);
    },
    [processCommand],
  );

  if (!gameStarted) {
    return (
      <div
        className="crt-effect h-full flex flex-col overflow-hidden"
        style={{ backgroundColor: '#0a0a0a' }}
      >
        {/* Title art block */}
        <div
          className="flex flex-col items-center justify-center pt-8 pb-4 px-4"
          style={{ fontFamily: "'VT323', monospace" }}
        >
          <pre
            className="pixel-art text-center"
            style={{
              color: '#ffb000',
              fontSize: 'clamp(0.55rem, 1.1vw, 0.9rem)',
              lineHeight: 1.15,
              letterSpacing: '0.02em',
              textShadow: '0 0 12px rgba(255,176,0,0.6)',
              maxWidth: '100%',
              overflow: 'hidden',
            }}
          >
            {TITLE_ART}
          </pre>

          <div
            className="mt-4 text-center"
            style={{
              color: '#cc4444',
              fontSize: '1.4rem',
              fontFamily: "'VT323', monospace",
              textShadow: '0 0 8px rgba(200,50,50,0.6)',
              letterSpacing: '0.2em',
            }}
          >
            {'~ A HAUNTED TEXT ADVENTURE ~'}
          </div>

          <div
            className="cursor-blink mt-1"
            style={{
              color: '#00ff41',
              fontSize: '1.2rem',
              fontFamily: "'VT323', monospace",
            }}
          >
            _
          </div>
        </div>

        {/* Title log */}
        <div
          className="flex-1 overflow-y-auto px-6 py-2"
          style={{
            fontFamily: "'VT323', monospace",
            fontSize: '1.1rem',
            color: '#00ff41',
          }}
        >
          {titleLog.map((line, i) => (
            <div
              key={i}
              className="text-entry-fadein"
              style={{
                color: line.startsWith('>')
                  ? '#ffb000'
                  : line.startsWith('  [')
                    ? '#1a5c1a'
                    : '#00ff41',
                lineHeight: line === '' ? '0.6' : '1.5',
                minHeight: line === '' ? '0.6em' : undefined,
              }}
            >
              {line || '\u00A0'}
            </div>
          ))}
        </div>

        <CommandInput onCommand={handleTitleCommand} />
      </div>
    );
  }

  // Game running layout
  return (
    <div
      className="crt-effect h-full flex flex-col overflow-hidden"
      style={{ backgroundColor: '#0a0a0a', position: 'relative' }}
    >
      <StatusBar
        health={state.health}
        maxHealth={state.maxHealth}
        moveCount={state.moveCount}
      />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left panel: Art + Inventory */}
        <div
          className="flex flex-col overflow-hidden shrink-0"
          style={{
            width: '38%',
            minWidth: '200px',
            maxWidth: '340px',
            borderRight: '1px solid #1a3a1a',
          }}
        >
          <ArtPanel artKey={state.currentRoom || 'default'} />
          <div className="flex-1" />
          <Inventory inventory={state.inventory} items={items} />
        </div>

        {/* Right panel: Text output */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <TextOutput textLog={state.textLog} />
        </div>
      </div>

      {/* Command input full width */}
      <CommandInput onCommand={handleGameCommand} />

      {/* Game over overlay */}
      {state.gameOver && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 20,
          }}
        >
          <div
            style={{
              fontFamily: "'VT323', monospace",
              fontSize: '2rem',
              color: state.won ? '#ffb000' : '#ff3333',
              textShadow: state.won
                ? '0 0 20px rgba(255,176,0,0.8)'
                : '0 0 20px rgba(255,50,50,0.8)',
              backgroundColor: 'rgba(0,0,0,0.88)',
              padding: '1.5rem 2.5rem',
              border: '2px solid ' + (state.won ? '#ffb000' : '#ff3333'),
              textAlign: 'center',
            }}
          >
            {state.won
              ? '\u2726 YOU ESCAPED THE MANOR \u2726'
              : '\u271D THE DARKNESS CLAIMS YOU \u271D'}
            <div
              style={{
                fontSize: '1rem',
                marginTop: '0.5rem',
                color: '#00ff41',
              }}
            >
              Type &quot;restart&quot; to play again
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
