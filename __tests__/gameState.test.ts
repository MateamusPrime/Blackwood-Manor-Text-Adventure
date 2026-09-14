import { describe, it, expect } from 'vitest';
import { getInitialState, gameReducer } from '../engine/gameState';
import type { GameState } from '../engine/types';

describe('getInitialState', () => {
  it('starts the player on the front porch', () => {
    expect(getInitialState().currentRoom).toBe('front-porch');
  });

  it('gives the player a flashlight and a notebook', () => {
    expect(getInitialState().inventory).toEqual(['flashlight', 'notebook']);
  });

  it('starts at full health with no moves made', () => {
    const state = getInitialState();
    expect(state.health).toBe(state.maxHealth);
    expect(state.moveCount).toBe(0);
  });

  it('starts with the game neither over nor won', () => {
    expect(getInitialState()).toMatchObject({ gameOver: false, won: false });
  });

  it('returns a fresh object each call', () => {
    const first = getInitialState();
    first.inventory.push('crowbar');
    expect(getInitialState().inventory).toEqual(['flashlight', 'notebook']);
  });
});

describe('gameReducer', () => {
  it('returns the state unchanged for an unknown action', () => {
    const state = getInitialState();
    // @ts-expect-error - exercising the reducer's default branch
    expect(gameReducer(state, { type: 'NOT_A_REAL_ACTION' })).toBe(state);
  });

  it('never mutates the state it is given', () => {
    const state = getInitialState();
    const snapshot = JSON.stringify(state);
    gameReducer(state, { type: 'MOVE_TO', roomId: 'grand-foyer' });
    gameReducer(state, { type: 'TAKE_ITEM', itemId: 'crowbar' });
    gameReducer(state, { type: 'SET_FLAG', flag: 'clock-opened' });
    gameReducer(state, { type: 'DAMAGE', amount: 2 });
    expect(JSON.stringify(state)).toBe(snapshot);
  });

  describe('ADD_TEXT', () => {
    it('appends the entry to the log', () => {
      const state = gameReducer(getInitialState(), {
        type: 'ADD_TEXT',
        entry: { text: 'The floor creaks.', type: 'spooky' },
      });
      expect(state.textLog).toHaveLength(1);
      expect(state.textLog[0]).toMatchObject({ text: 'The floor creaks.', type: 'spooky' });
    });

    it('gives each entry a distinct, increasing id', () => {
      let state = getInitialState();
      state = gameReducer(state, { type: 'ADD_TEXT', entry: { text: 'one', type: 'normal' } });
      state = gameReducer(state, { type: 'ADD_TEXT', entry: { text: 'two', type: 'normal' } });
      state = gameReducer(state, { type: 'ADD_TEXT', entry: { text: 'three', type: 'normal' } });
      const ids = state.textLog.map(e => e.id);
      expect(new Set(ids).size).toBe(3);
      expect(ids).toEqual([...ids].sort((a, b) => a - b));
    });
  });

  describe('MOVE_TO', () => {
    it('moves the player and remembers where they came from', () => {
      const state = gameReducer(getInitialState(), { type: 'MOVE_TO', roomId: 'grand-foyer' });
      expect(state.currentRoom).toBe('grand-foyer');
      expect(state.previousRoom).toBe('front-porch');
    });

    it('records the room as visited', () => {
      const state = gameReducer(getInitialState(), { type: 'MOVE_TO', roomId: 'grand-foyer' });
      expect(state.visitedRooms).toContain('grand-foyer');
    });

    it('does not record the same room twice', () => {
      let state = gameReducer(getInitialState(), { type: 'MOVE_TO', roomId: 'grand-foyer' });
      state = gameReducer(state, { type: 'MOVE_TO', roomId: 'front-porch' });
      state = gameReducer(state, { type: 'MOVE_TO', roomId: 'grand-foyer' });
      expect(state.visitedRooms.filter(r => r === 'grand-foyer')).toHaveLength(1);
    });

    it('seeds a room state for a room entered for the first time', () => {
      const state = gameReducer(getInitialState(), { type: 'MOVE_TO', roomId: 'grand-foyer' });
      expect(state.roomStates['grand-foyer']).toEqual({
        visited: false,
        itemsTaken: [],
        itemsDropped: [],
      });
    });

    it('preserves an existing room state on re-entry', () => {
      let state = gameReducer(getInitialState(), { type: 'MOVE_TO', roomId: 'grand-foyer' });
      state = gameReducer(state, { type: 'TAKE_ITEM', itemId: 'torn-diary-page-1' });
      state = gameReducer(state, { type: 'MOVE_TO', roomId: 'front-porch' });
      state = gameReducer(state, { type: 'MOVE_TO', roomId: 'grand-foyer' });
      expect(state.roomStates['grand-foyer'].itemsTaken).toEqual(['torn-diary-page-1']);
    });
  });

  describe('TAKE_ITEM', () => {
    it('adds the item to the inventory', () => {
      const state = gameReducer(getInitialState(), { type: 'TAKE_ITEM', itemId: 'crowbar' });
      expect(state.inventory).toContain('crowbar');
    });

    it('records the item as taken from the current room', () => {
      const state = gameReducer(getInitialState(), { type: 'TAKE_ITEM', itemId: 'crowbar' });
      expect(state.roomStates['front-porch'].itemsTaken).toEqual(['crowbar']);
    });
  });

  describe('DROP_ITEM', () => {
    it('removes the item from the inventory', () => {
      const state = gameReducer(getInitialState(), { type: 'DROP_ITEM', itemId: 'notebook' });
      expect(state.inventory).not.toContain('notebook');
      expect(state.inventory).toContain('flashlight');
    });

    it('records the item as dropped in the current room', () => {
      const state = gameReducer(getInitialState(), { type: 'DROP_ITEM', itemId: 'notebook' });
      expect(state.roomStates['front-porch'].itemsDropped).toEqual(['notebook']);
    });
  });

  describe('SET_FLAG', () => {
    it('sets a flag to true by default', () => {
      const state = gameReducer(getInitialState(), { type: 'SET_FLAG', flag: 'clock-opened' });
      expect(state.flags['clock-opened']).toBe(true);
    });

    it('sets a flag to true when passed value: true', () => {
      const state = gameReducer(getInitialState(), { type: 'SET_FLAG', flag: 'clock-opened', value: true });
      expect(state.flags['clock-opened']).toBe(true);
    });

    it('clears a flag when passed value: false', () => {
      let state = gameReducer(getInitialState(), { type: 'SET_FLAG', flag: 'clock-opened' });
      state = gameReducer(state, { type: 'SET_FLAG', flag: 'clock-opened', value: false });
      expect(state.flags['clock-opened']).toBe(false);
    });
  });

  describe('ADD_INVENTORY / REMOVE_INVENTORY', () => {
    it('adds an item without touching room state', () => {
      const state = gameReducer(getInitialState(), { type: 'ADD_INVENTORY', itemId: 'ritual-bell' });
      expect(state.inventory).toContain('ritual-bell');
      expect(state.roomStates).toEqual({});
    });

    it('removes an item without touching room state', () => {
      const state = gameReducer(getInitialState(), { type: 'REMOVE_INVENTORY', itemId: 'flashlight' });
      expect(state.inventory).not.toContain('flashlight');
      expect(state.roomStates).toEqual({});
    });

    it('is a no-op when removing an item the player does not hold', () => {
      const state = gameReducer(getInitialState(), { type: 'REMOVE_INVENTORY', itemId: 'nonexistent' });
      expect(state.inventory).toEqual(['flashlight', 'notebook']);
    });
  });

  describe('DAMAGE', () => {
    it('subtracts from health', () => {
      const state = gameReducer(getInitialState(), { type: 'DAMAGE', amount: 2 });
      expect(state.health).toBe(3);
      expect(state.gameOver).toBe(false);
    });

    it('ends the game as a loss when health reaches zero', () => {
      const state = gameReducer(getInitialState(), { type: 'DAMAGE', amount: 5 });
      expect(state).toMatchObject({ health: 0, gameOver: true, won: false });
    });

    it('never drops health below zero', () => {
      const state = gameReducer(getInitialState(), { type: 'DAMAGE', amount: 99 });
      expect(state.health).toBe(0);
    });
  });

  describe('HEAL', () => {
    it('restores health', () => {
      let state = gameReducer(getInitialState(), { type: 'DAMAGE', amount: 3 });
      state = gameReducer(state, { type: 'HEAL', amount: 2 });
      expect(state.health).toBe(4);
    });

    it('never heals past max health', () => {
      const state = gameReducer(getInitialState(), { type: 'HEAL', amount: 10 });
      expect(state.health).toBe(5);
    });
  });

  describe('GAME_OVER', () => {
    it('ends the game as a win and logs the message', () => {
      const state = gameReducer(getInitialState(), {
        type: 'GAME_OVER',
        won: true,
        message: 'You escaped!',
      });
      expect(state).toMatchObject({ gameOver: true, won: true });
      expect(state.textLog.at(-1)).toMatchObject({ text: 'You escaped!', type: 'spooky' });
    });

    it('ends the game as a loss', () => {
      const state = gameReducer(getInitialState(), {
        type: 'GAME_OVER',
        won: false,
        message: 'The manor claims you.',
      });
      expect(state).toMatchObject({ gameOver: true, won: false });
    });
  });

  it('counts moves one at a time', () => {
    let state = getInitialState();
    state = gameReducer(state, { type: 'INCREMENT_MOVES' });
    state = gameReducer(state, { type: 'INCREMENT_MOVES' });
    expect(state.moveCount).toBe(2);
  });

  it('records fired events', () => {
    let state = gameReducer(getInitialState(), { type: 'FIRE_EVENT', eventId: 'foyer-whisper' });
    state = gameReducer(state, { type: 'FIRE_EVENT', eventId: 'cellar-scream' });
    expect(state.firedEvents).toEqual(['foyer-whisper', 'cellar-scream']);
  });

  describe('LOAD_STATE', () => {
    it('replaces the state wholesale', () => {
      const saved: GameState = {
        ...getInitialState(),
        currentRoom: 'crypt',
        health: 2,
        moveCount: 41,
        inventory: ['ritual-book'],
      };
      const state = gameReducer(getInitialState(), { type: 'LOAD_STATE', state: saved });
      expect(state).toEqual(saved);
    });

    it('keeps text ids unique after a load', () => {
      const saved: GameState = {
        ...getInitialState(),
        textLog: [
          { id: 1, text: 'one', type: 'normal' },
          { id: 2, text: 'two', type: 'normal' },
        ],
      };
      let state = gameReducer(getInitialState(), { type: 'LOAD_STATE', state: saved });
      state = gameReducer(state, { type: 'ADD_TEXT', entry: { text: 'three', type: 'normal' } });
      const ids = state.textLog.map(e => e.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  it('resets back to a fresh game', () => {
    let state = gameReducer(getInitialState(), { type: 'MOVE_TO', roomId: 'grand-foyer' });
    state = gameReducer(state, { type: 'DAMAGE', amount: 3 });
    state = gameReducer(state, { type: 'RESET' });
    expect(state).toEqual(getInitialState());
  });
});
