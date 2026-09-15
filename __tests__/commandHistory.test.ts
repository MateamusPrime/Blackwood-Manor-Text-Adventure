// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useCommandHistory } from '../hooks/useCommandHistory';

// Arrow-key recall is the one convenience the title screen promises the player
// outright -- "[ Use arrow keys to recall previous commands ]" -- and in a game
// where half the commands are four words long it gets a lot of use.
//
// The hook returns the recalled command from navigateUp/navigateDown rather
// than holding it in state, so each press has to be wrapped in its own act():
// the value comes from the render the key was pressed in.

function history() {
  const { result } = renderHook(() => useCommandHistory());

  const type = (...commands: string[]) => {
    for (const command of commands) act(() => result.current.addCommand(command));
  };
  const up = () => {
    let recalled = '';
    act(() => { recalled = result.current.navigateUp(); });
    return recalled;
  };
  const down = () => {
    let recalled = '';
    act(() => { recalled = result.current.navigateDown(); });
    return recalled;
  };

  return { type, up, down };
}

describe('useCommandHistory', () => {
  describe('with nothing typed yet', () => {
    it('recalls nothing going up', () => {
      const { up } = history();
      expect(up()).toBe('');
    });

    it('recalls nothing going down', () => {
      const { down } = history();
      expect(down()).toBe('');
    });
  });

  describe('what gets remembered', () => {
    it('recalls the last command', () => {
      const { type, up } = history();
      type('look at plates');
      expect(up()).toBe('look at plates');
    });

    it('does not remember a blank line', () => {
      const { type, up } = history();
      type('north', '   ');
      expect(up()).toBe('north');
    });

    it('does not remember the same command twice in a row', () => {
      const { type, up } = history();
      // Repeated moves are how a player crosses the manor, so a second copy
      // would mean pressing up twice to get past each one.
      type('look', 'north', 'north');
      expect(up()).toBe('north');
      expect(up()).toBe('look');
    });

    it('does remember a command repeated after something else', () => {
      const { type, up } = history();
      type('north', 'look', 'north');
      expect(up()).toBe('north');
      expect(up()).toBe('look');
      expect(up()).toBe('north');
    });
  });

  describe('walking back through the history', () => {
    it('goes one command further back each time', () => {
      const { type, up } = history();
      type('north', 'take silver key', 'west');
      expect(up()).toBe('west');
      expect(up()).toBe('take silver key');
      expect(up()).toBe('north');
    });

    it('stops at the oldest command rather than running off the end', () => {
      const { type, up } = history();
      type('north', 'west');
      up();
      up();
      expect(up()).toBe('north');
      expect(up()).toBe('north');
    });
  });

  describe('walking forward again', () => {
    it('returns towards the most recent command', () => {
      const { type, up, down } = history();
      type('north', 'take silver key', 'west');
      up();
      up();
      up();
      expect(down()).toBe('take silver key');
      expect(down()).toBe('west');
    });

    it('clears the line once past the newest command', () => {
      const { type, up, down } = history();
      type('north', 'west');
      up();
      expect(down()).toBe('');
    });

    it('leaves the next press of up back at the newest command', () => {
      const { type, up, down } = history();
      type('north', 'take silver key', 'west');
      up();
      down(); // off the end of the history, on a blank line again
      expect(up()).toBe('west');
    });

    it('does nothing when the player never went up', () => {
      const { type, down } = history();
      type('north', 'west');
      expect(down()).toBe('');
    });
  });

  describe('after a new command is entered', () => {
    it('starts the next recall from the newest command again', () => {
      const { type, up } = history();
      type('north', 'west');
      up();
      up(); // back at the oldest

      type('take silver key');
      expect(up()).toBe('take silver key');
    });
  });
});
