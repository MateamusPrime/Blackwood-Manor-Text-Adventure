// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { executeCommand } from '../engine/commands';
import { parseCommand } from '../engine/parser';
import { getInitialState, gameReducer } from '../engine/gameState';
import type { GameAction, GameState, Item, Room } from '../engine/types';

// Saving and loading is the only thing the game does that outlives the tab, and
// it is the only path that reads back data the engine did not produce this run:
// a save file can be stale, hand-edited, or written by an older build. The rest
// of the suite runs in the node environment, where `window` is undefined and
// both handlers bail out on their first line, so none of this code has ever run
// under test. This file gives it a localStorage to write to.

const SAVE_KEY = 'blackwood-manor-save';

// Save and load never look at the world, but executeCommand needs the player to
// be standing somewhere real before it will dispatch anything.
const rooms: Record<string, Room> = {
  hall: { id: 'hall', name: 'Hall', description: 'A hall.', exits: [], items: [], npcs: [], artKey: 'hall' },
};
const items: Record<string, Item> = {};

function run(input: string, state: GameState): GameAction[] {
  return executeCommand(parseCommand(input), state, rooms, items);
}

/** A new game, standing in the fixture room so executeCommand will act. */
function fresh(): GameState {
  return { ...getInitialState(), currentRoom: 'hall' };
}

function textOf(actions: GameAction[]): string {
  return actions
    .filter(a => a.type === 'ADD_TEXT')
    .map(a => (a as Extract<GameAction, { type: 'ADD_TEXT' }>).entry.text)
    .join('\n');
}

/** A game several moves in: somewhere else, carrying more, hurt, with history. */
function midGame(): GameState {
  const actions: GameAction[] = [
    { type: 'MOVE_TO', roomId: 'hall' },
    { type: 'TAKE_ITEM', itemId: 'brass-key' },
    { type: 'SET_FLAG', flag: 'bookshelf-moved' },
    { type: 'DAMAGE', amount: 2 },
    { type: 'INCREMENT_MOVES' },
    { type: 'FIRE_EVENT', eventId: 'hall-0' },
    { type: 'ADD_TEXT', entry: { text: 'The bookshelf grinds aside.', type: 'system' } },
  ];
  return actions.reduce(gameReducer, fresh());
}

beforeEach(() => {
  localStorage.clear();
  // The reducer numbers text lines from a module-level counter, so tests in one
  // file would otherwise inherit each other's. RESET is what a page load does.
  gameReducer(getInitialState(), { type: 'RESET' });
});

describe('saving', () => {
  it('writes the state to localStorage', () => {
    const state = midGame();
    run('save', state);
    expect(JSON.parse(localStorage.getItem(SAVE_KEY)!)).toEqual(state);
  });

  it('says so in character', () => {
    expect(textOf(run('save', midGame()))).toContain('The manor remembers');
  });

  it('dispatches nothing but the message', () => {
    expect(run('save', midGame()).every(a => a.type === 'ADD_TEXT')).toBe(true);
  });

  it('overwrites an earlier save rather than keeping both', () => {
    run('save', fresh());
    const later = midGame();
    run('save', later);
    expect(JSON.parse(localStorage.getItem(SAVE_KEY)!)).toEqual(later);
  });
});

describe('loading', () => {
  it('restores every part of the saved state', () => {
    const saved = midGame();
    run('save', saved);

    // A fresh run of the game, which knows nothing about the save.
    const actions = run('load', fresh());
    const restored = actions.reduce(gameReducer, fresh());

    expect(restored.currentRoom).toBe(saved.currentRoom);
    expect(restored.previousRoom).toBe(saved.previousRoom);
    expect(restored.inventory).toEqual(saved.inventory);
    expect(restored.flags).toEqual(saved.flags);
    expect(restored.health).toBe(saved.health);
    expect(restored.moveCount).toBe(saved.moveCount);
    expect(restored.visitedRooms).toEqual(saved.visitedRooms);
    expect(restored.firedEvents).toEqual(saved.firedEvents);
    expect(restored.roomStates).toEqual(saved.roomStates);
  });

  it('keeps the log the player had, and says it is back', () => {
    const saved = midGame();
    run('save', saved);

    const restored = run('load', fresh()).reduce(gameReducer, fresh());

    expect(restored.textLog.map(e => e.text)).toContain('The bookshelf grinds aside.');
    expect(restored.textLog.at(-1)!.text).toContain('back where you left off');
  });

  it('gives the next line an id no earlier line is using', () => {
    const saved = midGame();
    run('save', saved);

    let state = run('load', fresh()).reduce(gameReducer, fresh());
    state = gameReducer(state, { type: 'ADD_TEXT', entry: { text: 'You look around.', type: 'normal' } });

    const ids = state.textLog.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('says so when there is no save file', () => {
    expect(textOf(run('load', fresh()))).toContain('No save file found');
  });

  it('treats an empty save file as no save file, not as a corrupted one', () => {
    localStorage.setItem(SAVE_KEY, '');
    expect(textOf(run('load', fresh()))).toContain('No save file found');
  });

  it('is still available after the game is over', () => {
    run('save', midGame());
    const over = { ...fresh(), gameOver: true };
    expect(run('load', over).some(a => a.type === 'LOAD_STATE')).toBe(true);
  });
});

describe('a save file that cannot be trusted', () => {
  // The player's save is the one input the engine cannot vouch for. Anything
  // unreadable has to come back as the in-character refusal, because the
  // alternative is handing the reducer a GameState-shaped hole and taking the
  // whole page down with it.
  const unusable: Record<string, string> = {
    'truncated mid-write': '{"currentRoom":"hall","inv',
    'not JSON at all': 'the manor has consumed it',
    'the literal null': 'null',
    'a bare number': '42',
    'a bare string': '"front-porch"',
    'an array': '[]',
    'an object that is not a game': '{"user":"matt"}',
    'a save from a build with a different shape': '{"currentRoom":"hall","health":3}',
  };

  // A save that is a game in every respect but one. Each entry below stands for
  // a field the check would otherwise be free to stop looking at.
  const oneFieldWrong: Record<string, unknown> = {
    'a room that is not a name': { currentRoom: 7 },
    'a previous room that is not a name': { previousRoom: null },
    'no inventory at all': { inventory: undefined },
    'an inventory that is not a list': { inventory: 'flashlight' },
    'an inventory holding something that is not an item id': { inventory: ['flashlight', { id: 'notebook' }] },
    'room states that are not keyed': { roomStates: [] },
    'flags that are not keyed': { flags: ['bookshelf-moved'] },
    'health that is not a number': { health: '5' },
    'no maximum health': { maxHealth: undefined },
    'a move count that is not a number': { moveCount: null },
    'a text log that is not a list': { textLog: 'none' },
    'a game-over that is not a yes or no': { gameOver: 'maybe' },
    'a win that is not a yes or no': { won: 1 },
    'visited rooms that are not a list': { visitedRooms: {} },
    'a fired event that is not an event id': { firedEvents: [17] },
  };

  for (const [description, field] of Object.entries(oneFieldWrong)) {
    unusable[description] = JSON.stringify({ ...fresh(), ...(field as object) });
  }

  for (const [description, contents] of Object.entries(unusable)) {
    it(`refuses ${description}`, () => {
      localStorage.setItem(SAVE_KEY, contents);
      const actions = run('load', fresh());

      expect(textOf(actions)).toContain('corrupted');
      // Nothing may reach the reducer: that is where the crash used to be.
      expect(actions.some(a => a.type === 'LOAD_STATE')).toBe(false);
    });
  }

  it('accepts a save that is a game in every respect', () => {
    // The guard above is only worth having if it still lets a real save in.
    localStorage.setItem(SAVE_KEY, JSON.stringify(midGame()));
    expect(run('load', fresh()).some(a => a.type === 'LOAD_STATE')).toBe(true);
  });

  it('leaves the game running rather than throwing', () => {
    localStorage.setItem(SAVE_KEY, 'null');
    const before = midGame();
    const after = run('load', before).reduce(gameReducer, before);
    expect(after.currentRoom).toBe(before.currentRoom);
    expect(after.inventory).toEqual(before.inventory);
  });

  it('still accepts a genuine save once a bad one is replaced', () => {
    localStorage.setItem(SAVE_KEY, 'null');
    expect(textOf(run('load', fresh()))).toContain('corrupted');

    const saved = midGame();
    run('save', saved);
    const restored = run('load', fresh()).reduce(gameReducer, fresh());
    expect(restored.currentRoom).toBe(saved.currentRoom);
  });
});
