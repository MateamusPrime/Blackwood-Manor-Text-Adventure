// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useGame } from '../hooks/useGame';

// useGame holds game rules that live nowhere else: the flags certain examines
// set, the healing items, winding the music box, the safe combination, the
// portrait order, and the guard that stops the entity being banished before
// the ritual is done. The engine suite cannot reach any of it.
//
// The hook exposes only processCommand, so each test plays its way to the
// state it needs. Every route below is one a player could type.

function game() {
  const { result } = renderHook(() => useGame());
  // One act() per command: processCommand closes over the current state, so
  // batching them would run every command against the state before the first.
  const play = (...commands: string[]) => {
    for (const command of commands) act(() => result.current.processCommand(command));
  };
  const log = () => result.current.state.textLog.map(e => e.text).join('\n');
  return { result, play, log };
}

// Shortest routes from the front porch to the rooms these rules live in.
const TO_DINING = ['north', 'west'];
const TO_MASTER_BEDROOM = ['north', 'up', 'east'];
const TO_STUDY = ['north', 'up', 'north', 'west'];
const TO_LIBRARY = ['north', 'up', 'west'];
const TO_UPPER_HALLWAY = ['north', 'up', 'north'];

describe('useGame', () => {
  describe('input handling', () => {
    it('ignores an empty command', () => {
      const { result, play } = game();
      play('   ');
      expect(result.current.state.textLog).toHaveLength(0);
    });

    it('echoes what the player typed', () => {
      const { play, log } = game();
      play('look');
      expect(log()).toContain('> look');
    });

    it('resets back to a new game', () => {
      const { result, play } = game();
      play('north', 'take torn diary page');
      act(() => result.current.resetGame());
      expect(result.current.state.currentRoom).toBe('front-porch');
      expect(result.current.state.inventory).toEqual(['flashlight', 'notebook']);
    });
  });

  describe('examining reveals', () => {
    it('flags the plates as checked, in the dining room', () => {
      const { result, play } = game();
      play(...TO_DINING, 'look at plates');
      expect(result.current.state.flags['checked-plates']).toBe(true);
    });

    it('does not flag the plates from another room', () => {
      const { result, play } = game();
      play('look at plates');
      expect(result.current.state.flags['checked-plates']).toBeUndefined();
    });

    it('flags the bed as searched, in the master bedroom', () => {
      const { result, play } = game();
      play(...TO_MASTER_BEDROOM, 'look at bed');
      expect(result.current.state.flags['searched-bed']).toBe(true);
    });
  });

  describe('the diary', () => {
    it('does not assemble from a single page', () => {
      const { result, play } = game();
      play('north', 'take torn diary page', 'use diary');
      expect(result.current.state.flags['diary-assembled']).toBeUndefined();
    });

    it('assembles once all three pages are held', () => {
      const { result, play, log } = game();
      play('north', 'take torn diary page');
      play(...['up', 'east', 'north', 'take torn diary page', 'south', 'west']);
      play('north', 'east', 'talk to child', 'take torn diary page');
      play('use diary');
      expect(result.current.state.flags['diary-assembled']).toBe(true);
      expect(log()).toContain('assembled all three diary pages');
    });
  });

  describe('healing items', () => {
    it('heals from angel tears and consumes them', () => {
      const { result, play } = game();
      // The rose grows in the conservatory; the angel weeps in the garden below.
      play('north', 'north', 'west', 'take black rose', 'south');
      play('use black rose on angel', 'take angel tears');
      expect(result.current.state.inventory).toContain('angel-tears');

      play('use angel tears');
      expect(result.current.state.inventory).not.toContain('angel-tears');
    });

    it('restores health spent along the way', () => {
      const { result, play } = game();
      play(...TO_STUDY, 'set safe to 10-31-89');
      expect(result.current.state.inventory).toContain('holy-water');

      // Healing is only observable below full health, so spend one first.
      act(() => result.current.processCommand('use holy water'));
      expect(result.current.state.health).toBe(result.current.state.maxHealth);
    });

    it('will not heal from an item the player is not carrying', () => {
      const { result, play, log } = game();
      play('use holy water');
      expect(result.current.state.inventory).not.toContain('holy-water');
      expect(log()).toMatch(/don't have/i);
    });
  });

  describe('the music box', () => {
    it('winds itself once the player holds both pieces', () => {
      const { result, play, log } = game();
      play('north', 'west', 'south', 'south', 'take music box', 'north', 'north', 'east');
      play(...['up', 'east', 'look at bed', 'take tiny brass key']);
      play('use music box');
      expect(result.current.state.inventory).toContain('music-box-wound');
      expect(result.current.state.inventory).not.toContain('music-box');
      expect(log()).toContain('wind the music box');
    });
  });

  describe('the study safe', () => {
    it('opens on the right combination and yields the holy water', () => {
      const { result, play, log } = game();
      play(...TO_STUDY, 'set safe to 10-31-89');
      expect(result.current.state.flags['safe-opened']).toBe(true);
      expect(result.current.state.inventory).toContain('holy-water');
      expect(log()).toContain('counter-ritual requires conviction');
    });

    it('refuses a wrong combination', () => {
      const { result, play, log } = game();
      play(...TO_STUDY, 'set safe to 11-11-11');
      expect(result.current.state.flags['safe-opened']).toBeUndefined();
      expect(log()).toContain('combination is wrong');
    });

    it('is not openable from outside the study', () => {
      const { result, play } = game();
      play('set safe to 10-31-89');
      expect(result.current.state.flags['safe-opened']).toBeUndefined();
    });
  });

  describe('the library bookshelf', () => {
    it('opens the passage when pulled', () => {
      const { result, play, log } = game();
      play(...TO_LIBRARY, 'pull bookshelf');
      expect(result.current.state.flags['bookshelf-moved']).toBe(true);
      expect(log()).toContain('revealing a narrow, dark passage');
    });
  });

  describe('the portrait puzzle', () => {
    it('opens the portal only in the order woman, children, man', () => {
      const { result, play } = game();
      play(...TO_UPPER_HALLWAY, 'look at woman');
      expect(result.current.state.flags['portrait-woman']).toBe(true);

      play('look at children');
      expect(result.current.state.flags['portrait-children']).toBe(true);

      play('look at man');
      expect(result.current.state.flags['portrait-order']).toBe(true);
    });

    it('will not skip ahead to the man', () => {
      const { result, play } = game();
      play(...TO_UPPER_HALLWAY, 'look at man');
      expect(result.current.state.flags['portrait-order']).toBeUndefined();
    });

    it('will not skip the woman', () => {
      const { result, play } = game();
      play(...TO_UPPER_HALLWAY, 'look at children');
      expect(result.current.state.flags['portrait-children']).toBeUndefined();
    });
  });

  describe('the banishment guard', () => {
    it('refuses the incantation before the ritual is done', () => {
      const { result, play, log } = game();
      play('use ritual book on entity');
      expect(result.current.state.flags['entity-banished']).toBeUndefined();
      expect(result.current.state.won).toBe(false);
      expect(log()).toMatch(/hollow and powerless|don't have/i);
    });

    it('will not let the entity be used on from the wrong room', () => {
      const { result, play } = game();
      play('use flashlight on entity');
      expect(result.current.state.flags['entity-banished']).toBeUndefined();
      expect(result.current.state.gameOver).toBe(false);
    });
  });
});

// --- The two endings ---------------------------------------------------------
//
// Banishment is what the ritual buys: the Entity is sent back. The mirror room
// is optional and easy to miss -- the portraits have to be examined in the right
// order before the portal opens -- so the shard it holds does not gate the win.
// It changes what the win is. Nothing shorter than a full game can reach either
// ending, so these play one.

/** The canonical solution, front porch to the Final Chamber door. */
const THE_WINNING_ROUTE = [
  'north', 'take torn diary page', 'west',
  'look at plates', 'take silver key',
  'east', 'east', 'use silver key on jewelry box',
  'west', 'west', 'south', 'take rusty knife', 'east', 'take black candle',
  'west', 'south', 'take music box', 'talk to maid',
  'north', 'north', 'east', 'north', 'set clock to midnight',
  'northeast', 'read scrawled note', 'southwest',
  'west', 'take black rose', 'south', 'use black rose on angel', 'take angel tears',
  'north', 'north', 'south',
  'up', 'east', 'look at bed', 'take tiny brass key', 'use tiny brass key on music box',
  'north', 'take torn diary page', 'south', 'west', 'north', 'take silver bell',
  'west', 'set safe to 10-31-89',
  'east', 'east', 'talk to child', 'play music box', 'take torn diary page', 'use diary',
  'south', 'south', 'west', 'pull bookshelf', 'take ritual book',
  'east', 'down', 'north', 'north', 'down', 'north', 'north', 'north',
  'light candle', 'ring bell', 'pray', 'talk to ghost',
];

/** The detour that opens the mirror, taken from the upper hallway. */
const THE_MIRROR_DETOUR = [
  'look at woman', 'look at children', 'look at man',
  'northwest', 'take mirror shard', 'southeast',
];

describe('the endings', () => {
  it('banishes the Entity, for the player who never found the mirror', () => {
    const { result, play, log } = game();
    play(...THE_WINNING_ROUTE, 'north');

    // Without the shard the Entity is only afraid of the ritual.
    play('talk to entity');
    expect(log()).toContain('THE BINDING');
    expect(log()).not.toContain('THE GLASS');

    play('use ritual book on entity');
    expect(result.current.state.won).toBe(true);
    expect(log()).toContain('The Entity is banished');
    expect(log()).toContain('You have survived Blackwood Manor');
  });

  it('unmakes the Entity, for the player who held the shard up to it', () => {
    const { result, play, log } = game();
    // The portraits are in the upper hallway, which the route passes through on
    // its way upstairs. Detour there, then rejoin it.
    const upstairs = THE_WINNING_ROUTE.indexOf('up');
    play(...THE_WINNING_ROUTE.slice(0, upstairs + 1), 'north');
    play(...THE_MIRROR_DETOUR, 'south');
    play(...THE_WINNING_ROUTE.slice(upstairs + 1));

    expect(result.current.state.inventory).toContain('mirror-shard');

    play('north', 'use mirror shard on entity');
    expect(result.current.state.flags['entity-weakened']).toBe(true);

    // The Entity says so, rather than the player having to infer it from the
    // ending. The ritual is done by now too, and the mirror still wins the line.
    play('talk to entity');
    expect(log()).toContain('TAKE AWAY THE GLASS');

    play('use ritual book on entity');
    expect(result.current.state.won).toBe(true);
    expect(log()).toContain('it comes apart');
    expect(log()).toContain('no one else will have to');
  });
});
