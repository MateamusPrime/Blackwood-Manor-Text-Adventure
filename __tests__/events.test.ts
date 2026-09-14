import { describe, it, expect } from 'vitest';
import { processRoomEvents, checkFlag, hasItem } from '../engine/events';
import { getInitialState } from '../engine/gameState';
import type { GameState, Room, RoomEvent } from '../engine/types';

function makeRoom(onEnter?: RoomEvent[]): Room {
  return {
    id: 'test-room',
    name: 'Test Room',
    description: 'A room that exists only for testing.',
    exits: [],
    items: [],
    npcs: [],
    artKey: 'test-room',
    onEnter,
  };
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  return { ...getInitialState(), ...overrides };
}

describe('processRoomEvents', () => {
  it('produces nothing for a room with no events', () => {
    expect(processRoomEvents(makeRoom(), makeState())).toEqual([]);
  });

  it('produces nothing for an empty event list', () => {
    expect(processRoomEvents(makeRoom([]), makeState())).toEqual([]);
  });

  describe('event types', () => {
    it('turns a message event into spooky text', () => {
      const actions = processRoomEvents(makeRoom([{ type: 'message', message: 'A door slams.' }]), makeState());
      expect(actions).toEqual([
        { type: 'ADD_TEXT', entry: { text: 'A door slams.', type: 'spooky' } },
      ]);
    });

    it('ignores a message event with no message', () => {
      expect(processRoomEvents(makeRoom([{ type: 'message' }]), makeState())).toEqual([]);
    });

    it('sets a flag', () => {
      const actions = processRoomEvents(makeRoom([{ type: 'setFlag', flag: 'saw-ghost' }]), makeState());
      expect(actions).toEqual([{ type: 'SET_FLAG', flag: 'saw-ghost' }]);
    });

    it('grants an item and announces it', () => {
      const actions = processRoomEvents(makeRoom([{ type: 'addItem', item: 'ritual-bell' }]), makeState());
      expect(actions[0]).toEqual({ type: 'ADD_INVENTORY', itemId: 'ritual-bell' });
      expect(actions[1]).toMatchObject({ type: 'ADD_TEXT' });
    });

    it('takes an item away and announces it', () => {
      const actions = processRoomEvents(makeRoom([{ type: 'removeItem', item: 'flashlight' }]), makeState());
      expect(actions[0]).toEqual({ type: 'REMOVE_INVENTORY', itemId: 'flashlight' });
      expect(actions[1]).toMatchObject({ type: 'ADD_TEXT' });
    });

    it('applies the stated damage amount', () => {
      const actions = processRoomEvents(makeRoom([{ type: 'damage', amount: 3 }]), makeState());
      expect(actions).toContainEqual({ type: 'DAMAGE', amount: 3 });
    });

    it('defaults damage to 1 when no amount is given', () => {
      const actions = processRoomEvents(makeRoom([{ type: 'damage' }]), makeState());
      expect(actions).toContainEqual({ type: 'DAMAGE', amount: 1 });
    });

    it('includes the damage message alongside the damage', () => {
      const actions = processRoomEvents(
        makeRoom([{ type: 'damage', amount: 2, message: 'Claws rake your back!' }]),
        makeState(),
      );
      expect(actions).toContainEqual({
        type: 'ADD_TEXT',
        entry: { text: 'Claws rake your back!', type: 'spooky' },
      });
    });

    it('narrates a teleport before moving the player', () => {
      const actions = processRoomEvents(
        makeRoom([{ type: 'teleport', roomId: 'crypt', message: 'The floor gives way!' }]),
        makeState(),
      );
      expect(actions).toEqual([
        { type: 'ADD_TEXT', entry: { text: 'The floor gives way!', type: 'spooky' } },
        { type: 'MOVE_TO', roomId: 'crypt' },
      ]);
    });

    it('ignores a teleport with no destination', () => {
      expect(processRoomEvents(makeRoom([{ type: 'teleport', message: 'nowhere' }]), makeState())).toEqual([]);
    });

    it('ends the game on a gameOver event', () => {
      const actions = processRoomEvents(
        makeRoom([{ type: 'gameOver', message: 'The dark takes you.' }]),
        makeState(),
      );
      expect(actions).toEqual([{ type: 'GAME_OVER', won: false, message: 'The dark takes you.' }]);
    });

    it('falls back to a default death message', () => {
      const actions = processRoomEvents(makeRoom([{ type: 'gameOver' }]), makeState());
      expect(actions[0]).toMatchObject({ type: 'GAME_OVER', won: false });
    });

    it('wins the game on a win event', () => {
      const actions = processRoomEvents(makeRoom([{ type: 'win', message: 'Daylight at last.' }]), makeState());
      expect(actions).toEqual([{ type: 'GAME_OVER', won: true, message: 'Daylight at last.' }]);
    });
  });

  describe('conditions', () => {
    it('skips an event whose required flag is unset', () => {
      const room = makeRoom([{ type: 'message', message: 'gated', condition: 'has-key' }]);
      expect(processRoomEvents(room, makeState())).toEqual([]);
    });

    it('runs an event whose required flag is set', () => {
      const room = makeRoom([{ type: 'message', message: 'gated', condition: 'has-key' }]);
      const actions = processRoomEvents(room, makeState({ flags: { 'has-key': true } }));
      expect(actions).toHaveLength(1);
    });

    it('skips an event whose blocking flag is set', () => {
      const room = makeRoom([{ type: 'message', message: 'once only', notCondition: 'seen-it' }]);
      expect(processRoomEvents(room, makeState({ flags: { 'seen-it': true } }))).toEqual([]);
    });

    it('runs an event whose blocking flag is unset', () => {
      const room = makeRoom([{ type: 'message', message: 'once only', notCondition: 'seen-it' }]);
      expect(processRoomEvents(room, makeState())).toHaveLength(1);
    });
  });

  describe('once-only events', () => {
    const room = makeRoom([
      { type: 'message', message: 'The chandelier sways.', once: true, eventId: 'foyer-intro' },
    ]);

    it('fires the first time and records the event id', () => {
      const actions = processRoomEvents(room, makeState());
      expect(actions[0]).toEqual({ type: 'FIRE_EVENT', eventId: 'foyer-intro' });
      expect(actions[1]).toMatchObject({ type: 'ADD_TEXT' });
    });

    it('does not fire again once recorded', () => {
      expect(processRoomEvents(room, makeState({ firedEvents: ['foyer-intro'] }))).toEqual([]);
    });

    it('records the id of a repeatable event too', () => {
      const repeatable = makeRoom([{ type: 'message', message: 'drip', eventId: 'drip' }]);
      const actions = processRoomEvents(repeatable, makeState({ firedEvents: ['drip'] }));
      expect(actions[0]).toEqual({ type: 'FIRE_EVENT', eventId: 'drip' });
    });
  });

  it('processes several events in order', () => {
    const room = makeRoom([
      { type: 'message', message: 'first' },
      { type: 'setFlag', flag: 'second' },
      { type: 'damage', amount: 1 },
    ]);
    expect(processRoomEvents(room, makeState()).map(a => a.type)).toEqual([
      'ADD_TEXT',
      'SET_FLAG',
      'DAMAGE',
    ]);
  });
});

describe('checkFlag', () => {
  it('is true for a set flag', () => {
    expect(checkFlag(makeState({ flags: { 'bell-rung': true } }), 'bell-rung')).toBe(true);
  });

  it('is false for a cleared flag', () => {
    expect(checkFlag(makeState({ flags: { 'bell-rung': false } }), 'bell-rung')).toBe(false);
  });

  it('is false for a flag that was never set', () => {
    expect(checkFlag(makeState(), 'never-set')).toBe(false);
  });
});

describe('hasItem', () => {
  it('is true for a carried item', () => {
    expect(hasItem(makeState(), 'flashlight')).toBe(true);
  });

  it('is false for an item the player does not carry', () => {
    expect(hasItem(makeState(), 'crowbar')).toBe(false);
  });
});
