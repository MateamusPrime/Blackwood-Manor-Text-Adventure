// @vitest-environment jsdom
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import GameScreen from '../components/GameScreen';

// GameScreen is the only thing standing between a player and the game: it owns
// the title screen, decides what counts as "start", and swaps itself for the
// play layout once the player is in. Nothing else in the suite renders it, so
// a change that left the manor permanently shut would go unnoticed.
//
// These tests drive it the way a player does -- by typing into the one input on
// the screen -- and assert on what comes back.

afterEach(cleanup);

beforeAll(() => {
  // TextOutput scrolls the newest line into view; jsdom has no layout.
  Element.prototype.scrollIntoView = vi.fn();
});

beforeEach(() => {
  // Entering the manor is on an 800ms delay, for the gate to swing open.
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

const GATE_DELAY = 800;

function type(command: string) {
  const input = screen.getByPlaceholderText('Enter command...');
  fireEvent.change(input, { target: { value: command } });
  fireEvent.keyDown(input, { key: 'Enter' });
}

/** Type a command and let the gate finish swinging, if it opened one. */
function enter(command: string) {
  type(command);
  act(() => { vi.advanceTimersByTime(GATE_DELAY); });
}

/** The status bar only exists once the player is inside. */
function isPlaying() {
  return screen.queryByText('BLACKWOOD MANOR') !== null;
}

/** The panels draw their frames one text node at a time, so read the lot. */
function screenText() {
  return document.body.textContent ?? '';
}

describe('the title screen', () => {
  it('invites the player in', () => {
    render(<GameScreen />);
    expect(screen.getByText(/Type\s+START\s+to begin your investigation/)).toBeTruthy();
  });

  it('does not show the game yet', () => {
    render(<GameScreen />);
    expect(isPlaying()).toBe(false);
  });

  it('echoes what the player typed', () => {
    render(<GameScreen />);
    type('hello?');
    expect(screen.getByText('> hello?')).toBeTruthy();
  });

  it('turns away anything that is not a way in', () => {
    render(<GameScreen />);
    enter('open the door');
    expect(screen.getByText(/The manor waits\. Type START to enter\./)).toBeTruthy();
    expect(isPlaying()).toBe(false);
  });

  it('lists the commands without starting the game', () => {
    render(<GameScreen />);
    enter('help');
    expect(screen.getByText(/COMMANDS:/)).toBeTruthy();
    expect(screen.getByText(/take <item>/)).toBeTruthy();
    expect(isPlaying()).toBe(false);
  });

  it('answers a bare question mark with the same list', () => {
    render(<GameScreen />);
    enter('?');
    expect(screen.getByText(/COMMANDS:/)).toBeTruthy();
  });
});

describe('entering the manor', () => {
  it('opens the gate and drops the player on the front porch', () => {
    render(<GameScreen />);
    enter('start');

    expect(isPlaying()).toBe(true);
    expect(screen.getByText(/decaying entrance of Blackwood Manor/)).toBeTruthy();
  });

  it('shows the player their health and move count', () => {
    render(<GameScreen />);
    enter('start');

    expect(screenText()).toMatch(/MOVES: 0000/);
    expect(screen.getAllByText('♥')).toHaveLength(5);
  });

  it('waits for the gate before letting the player in', () => {
    render(<GameScreen />);
    type('start');

    expect(screen.getByText(/It swings open with a groan/)).toBeTruthy();
    expect(isPlaying()).toBe(false);

    // The pause is the gate swinging open, and it is meant to be read: the
    // player is still on the title screen until the last moment of it.
    act(() => { vi.advanceTimersByTime(GATE_DELAY - 1); });
    expect(isPlaying()).toBe(false);

    act(() => { vi.advanceTimersByTime(1); });
    expect(isPlaying()).toBe(true);
  });

  for (const word of ['start', 'begin', 'play', 'go', 'enter', 'yes']) {
    it(`accepts "${word}"`, () => {
      render(<GameScreen />);
      enter(word);
      expect(isPlaying()).toBe(true);
    });
  }

  it('does not mind how the player capitalises it', () => {
    render(<GameScreen />);
    enter('START');
    expect(isPlaying()).toBe(true);
  });

  it('does not mind the spaces around it', () => {
    render(<GameScreen />);
    enter('  start  ');
    expect(isPlaying()).toBe(true);
  });
});

describe('once inside', () => {
  it('passes what the player types to the game', () => {
    render(<GameScreen />);
    enter('start');

    type('north');
    expect(screen.getByText(/GRAND FOYER/)).toBeTruthy();
  });

  it('counts the moves the player has made', () => {
    render(<GameScreen />);
    enter('start');
    expect(screenText()).toMatch(/MOVES: 0000/);

    type('north');
    expect(screenText()).toMatch(/MOVES: 0001/);
  });

  it('shows what the player is carrying', () => {
    render(<GameScreen />);
    enter('start');

    // The panel truncates anything longer than the frame, so match the stem.
    expect(screenText()).toContain('INVENTORY');
    expect(screenText()).toMatch(/Heavy-Duty Flash/);
  });

  it('keeps taking commands rather than dropping back to the title', () => {
    render(<GameScreen />);
    enter('start');

    type('north');
    type('west');
    expect(screen.getByText(/DINING ROOM/)).toBeTruthy();
    expect(isPlaying()).toBe(true);
  });
});
