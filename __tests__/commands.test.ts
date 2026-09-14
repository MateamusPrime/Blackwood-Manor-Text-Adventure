import { describe, it, expect } from 'vitest';
import { executeCommand } from '../engine/commands';
import { parseCommand } from '../engine/parser';
import { getInitialState } from '../engine/gameState';
import type { GameAction, GameState, Item, Room } from '../engine/types';

// A miniature world, so these tests assert on the command logic rather than
// on the content of data/rooms.ts.
const rooms: Record<string, Room> = {
  hall: {
    id: 'hall',
    name: 'Hall',
    description: 'A long hall lined with portraits.',
    shortDescription: 'The long hall.',
    exits: [
      { direction: 'north', roomId: 'study' },
      { direction: 'east', roomId: 'vault', locked: true, requiredItem: 'brass-key', lockMessage: 'The vault door will not budge.' },
      { direction: 'west', roomId: 'cellar', locked: true, requiredFlag: 'cellar-open' },
      { direction: 'down', roomId: 'crypt', hidden: true, requiredFlag: 'crypt-revealed' },
      { direction: 'south', roomId: 'garden' },
    ],
    items: [
      { id: 'brass-key', name: 'Brass Key', description: 'A small brass key.', takeable: true },
      { id: 'portrait', name: 'Portrait', description: 'A stern man in a high collar.', examineText: 'The eyes seem to follow you.' },
      { id: 'loose-brick', name: 'Loose Brick', description: 'A brick set slightly proud of the wall.', takeable: true, hidden: true, revealedByFlag: 'brick-found' },
      { id: 'plaque', name: 'Plaque', description: 'A tarnished plaque.', readText: 'ERASMUS BLACKWOOD, 1841' },
    ],
    npcs: [],
    artKey: 'hall',
    onExamine: { 'open window': 'The window is painted shut.' },
  },
  study: {
    id: 'study',
    name: 'Study',
    description: 'Bookshelves from floor to ceiling.',
    exits: [{ direction: 'south', roomId: 'hall' }],
    items: [],
    npcs: [
      {
        id: 'butler',
        name: 'The Butler',
        description: 'A gaunt figure in a rotting uniform.',
        blocksExit: 'south',
        appeaseFlag: 'butler-appeased',
        dialogue: [
          { text: 'You should not have come.' },
          { text: 'Take this, and go.', condition: 'butler-appeased', givesItem: 'silver-coin', setsFlag: 'coin-given' },
        ],
      },
    ],
    artKey: 'study',
  },
  vault: { id: 'vault', name: 'Vault', description: 'Cold stone.', exits: [], items: [], npcs: [], artKey: 'vault' },
  cellar: { id: 'cellar', name: 'Cellar', description: 'Damp and black.', exits: [], items: [], npcs: [], artKey: 'cellar', dark: true },
  crypt: { id: 'crypt', name: 'Crypt', description: 'Stone caskets.', exits: [], items: [], npcs: [], artKey: 'crypt' },
  garden: {
    id: 'garden',
    name: 'Garden',
    description: 'Overgrown hedges.',
    exits: [{ direction: 'north', roomId: 'hall' }],
    items: [],
    npcs: [],
    artKey: 'garden',
    onEnter: [{ type: 'message', message: 'Something moves in the hedge.' }],
  },
  'hidden-chapel': { id: 'hidden-chapel', name: 'Hidden Chapel', description: 'A tiny chapel.', exits: [], items: [], npcs: [], artKey: 'chapel' },
};

const items: Record<string, Item> = {
  flashlight: { id: 'flashlight', name: 'Flashlight', description: 'A heavy steel flashlight.' },
  notebook: { id: 'notebook', name: 'Notebook', description: 'Your own notebook.', readText: 'Day one: the house is worse than described.' },
  'brass-key': {
    id: 'brass-key',
    name: 'Brass Key',
    description: 'A small brass key.',
    useWith: { 'vault door': { message: 'The lock turns.', setsFlag: 'vault-open', removesItem: true } },
  },
  matches: { id: 'matches', name: 'Matches', description: 'A damp matchbook.', useAlone: { message: 'You strike a match.', setsFlag: 'match-lit' } },
  handle: { id: 'handle', name: 'Handle', description: 'A wooden handle.', combinable: ['blade'], combineResult: 'crowbar' },
  blade: { id: 'blade', name: 'Blade', description: 'A flat iron blade.' },
  crowbar: { id: 'crowbar', name: 'Crowbar', description: 'Handle and blade, joined.' },
  'silver-coin': { id: 'silver-coin', name: 'Silver Coin', description: 'Tarnished silver.' },
};

function run(input: string, overrides: Partial<GameState> = {}): GameAction[] {
  const state: GameState = { ...getInitialState(), currentRoom: 'hall', ...overrides };
  return executeCommand(parseCommand(input), state, rooms, items);
}

function texts(actions: GameAction[]): string[] {
  return actions.flatMap(a => (a.type === 'ADD_TEXT' ? [a.entry.text] : []));
}

function saysSomethingLike(actions: GameAction[], fragment: string): boolean {
  return texts(actions).some(t => t.toLowerCase().includes(fragment.toLowerCase()));
}

describe('executeCommand', () => {
  it('fails gracefully when the player is in a room that does not exist', () => {
    const actions = run('look', { currentRoom: 'nowhere' });
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({ type: 'ADD_TEXT', entry: { type: 'error' } });
  });

  it('reports an unrecognized verb as an error', () => {
    const actions = run('yodel loudly');
    expect(actions[0]).toMatchObject({ type: 'ADD_TEXT', entry: { type: 'error' } });
  });

  describe('when the game is over', () => {
    const over = { gameOver: true };

    it('refuses ordinary commands', () => {
      expect(saysSomethingLike(run('go north', over), 'the game is over')).toBe(true);
    });

    it('still accepts "restart"', () => {
      expect(run('restart', over)).toEqual([{ type: 'RESET' }]);
    });

    it('still accepts "new game"', () => {
      expect(run('new game', over)).toEqual([{ type: 'RESET' }]);
    });

    it('still accepts "load"', () => {
      expect(run('load', over).every(a => a.type === 'ADD_TEXT')).toBe(true);
    });
  });

  describe('go', () => {
    it('asks for a direction when none is given', () => {
      expect(saysSomethingLike(run('go'), 'go where')).toBe(true);
    });

    it('moves through an open exit', () => {
      expect(run('go north')).toContainEqual({ type: 'MOVE_TO', roomId: 'study' });
    });

    it('counts the move', () => {
      expect(run('north')).toContainEqual({ type: 'INCREMENT_MOVES' });
    });

    it('refuses a direction with no exit', () => {
      const actions = run('go up');
      expect(saysSomethingLike(actions, "can't go up")).toBe(true);
      expect(actions.some(a => a.type === 'MOVE_TO')).toBe(false);
    });

    it('blocks a locked exit with its own message', () => {
      expect(saysSomethingLike(run('go east'), 'will not budge')).toBe(true);
    });

    it('opens a locked exit when carrying the required item', () => {
      const actions = run('go east', { inventory: ['brass-key'] });
      expect(actions).toContainEqual({ type: 'MOVE_TO', roomId: 'vault' });
      expect(saysSomethingLike(actions, 'unlock')).toBe(true);
    });

    it('opens a locked exit when the required flag is set', () => {
      expect(run('go west', { flags: { 'cellar-open': true } })).toContainEqual({
        type: 'MOVE_TO',
        roomId: 'cellar',
      });
    });

    it('hides a hidden exit until its flag is set', () => {
      expect(run('go down').some(a => a.type === 'MOVE_TO')).toBe(false);
    });

    it('reveals a hidden exit once its flag is set', () => {
      expect(run('go down', { flags: { 'crypt-revealed': true } })).toContainEqual({
        type: 'MOVE_TO',
        roomId: 'crypt',
      });
    });

    it('lets an NPC block the way out', () => {
      const actions = run('go south', { currentRoom: 'study' });
      expect(saysSomethingLike(actions, 'blocks your path')).toBe(true);
      expect(actions.some(a => a.type === 'MOVE_TO')).toBe(false);
    });

    it('lets the player past an appeased NPC', () => {
      const actions = run('go south', { currentRoom: 'study', flags: { 'butler-appeased': true } });
      expect(actions).toContainEqual({ type: 'MOVE_TO', roomId: 'hall' });
    });

    it('runs the destination room\'s entry events', () => {
      expect(saysSomethingLike(run('go south'), 'moves in the hedge')).toBe(true);
    });

    it('describes a dark room as pitch black without a light source', () => {
      const actions = run('go west', { flags: { 'cellar-open': true }, inventory: [] });
      expect(saysSomethingLike(actions, 'pitch black')).toBe(true);
    });

    it('describes a dark room normally when carrying the flashlight', () => {
      const actions = run('go west', { flags: { 'cellar-open': true }, inventory: ['flashlight'] });
      expect(saysSomethingLike(actions, 'pitch black')).toBe(false);
      expect(saysSomethingLike(actions, 'damp and black')).toBe(true);
    });
  });

  describe('look', () => {
    it('describes the current room', () => {
      expect(saysSomethingLike(run('look'), 'lined with portraits')).toBe(true);
    });

    it('lists the exits', () => {
      expect(saysSomethingLike(run('look'), 'exits:')).toBe(true);
    });

    it('omits a hidden exit from the list', () => {
      const exitLine = texts(run('look')).find(t => t.startsWith('Exits:'));
      expect(exitLine).not.toContain('DOWN');
    });

    it('lists a hidden exit once revealed', () => {
      const exitLine = texts(run('look', { flags: { 'crypt-revealed': true } })).find(t => t.startsWith('Exits:'));
      expect(exitLine).toContain('DOWN');
    });

    it('uses the short description for a room already visited', () => {
      expect(saysSomethingLike(run('look', { visitedRooms: ['hall'] }), 'the long hall')).toBe(true);
    });

    it('prefers examine text when looking at a room item', () => {
      expect(saysSomethingLike(run('look at the portrait'), 'eyes seem to follow you')).toBe(true);
    });

    it('describes an item in the inventory', () => {
      expect(saysSomethingLike(run('examine notebook'), 'your own notebook')).toBe(true);
    });

    it('describes an NPC', () => {
      expect(saysSomethingLike(run('look at butler', { currentRoom: 'study' }), 'gaunt figure')).toBe(true);
    });

    it('falls back to the room\'s examine entries', () => {
      expect(saysSomethingLike(run('look at the open window'), 'painted shut')).toBe(true);
    });

    it('says so when there is nothing by that name', () => {
      expect(saysSomethingLike(run('look at the unicorn'), "don't see")).toBe(true);
    });

    it('does not list an item the player has already taken', () => {
      const seen = texts(run('look', {
        roomStates: { hall: { visited: true, itemsTaken: ['brass-key'], itemsDropped: [] } },
      })).find(t => t.startsWith('You can see:'));
      expect(seen).not.toContain('Brass Key');
    });

    it('lists an item the player dropped here', () => {
      const seen = texts(run('look', {
        roomStates: { hall: { visited: true, itemsTaken: [], itemsDropped: ['notebook'] } },
      })).find(t => t.startsWith('You can see:'));
      expect(seen).toContain('notebook');
    });
  });

  describe('take', () => {
    it('asks what to take when given no noun', () => {
      expect(saysSomethingLike(run('take'), 'take what')).toBe(true);
    });

    it('takes a takeable item', () => {
      const actions = run('take the brass key');
      expect(actions).toContainEqual({ type: 'TAKE_ITEM', itemId: 'brass-key' });
      expect(saysSomethingLike(actions, 'taken: brass key')).toBe(true);
    });

    it('refuses an item that is not takeable', () => {
      const actions = run('take the portrait');
      expect(saysSomethingLike(actions, "can't take")).toBe(true);
      expect(actions.some(a => a.type === 'TAKE_ITEM')).toBe(false);
    });

    it('refuses an item that is not here', () => {
      expect(saysSomethingLike(run('take the chandelier'), "don't see")).toBe(true);
    });

    it('refuses an item already taken', () => {
      const actions = run('take brass key', {
        roomStates: { hall: { visited: true, itemsTaken: ['brass-key'], itemsDropped: [] } },
      });
      expect(actions.some(a => a.type === 'TAKE_ITEM')).toBe(false);
    });

    it('hides an unrevealed item', () => {
      expect(run('take loose brick').some(a => a.type === 'TAKE_ITEM')).toBe(false);
    });

    it('allows a revealed item to be taken', () => {
      expect(run('take loose brick', { flags: { 'brick-found': true } })).toContainEqual({
        type: 'TAKE_ITEM',
        itemId: 'loose-brick',
      });
    });
  });

  describe('drop', () => {
    it('drops a carried item', () => {
      const actions = run('drop the notebook');
      expect(actions).toContainEqual({ type: 'DROP_ITEM', itemId: 'notebook' });
    });

    it('refuses an item the player is not carrying', () => {
      const actions = run('drop the crowbar');
      expect(saysSomethingLike(actions, "not carrying")).toBe(true);
      expect(actions.some(a => a.type === 'DROP_ITEM')).toBe(false);
    });
  });

  describe('use', () => {
    it('refuses an item the player does not have', () => {
      expect(saysSomethingLike(run('use the crowbar'), "don't have")).toBe(true);
    });

    it('applies a useWith result against a matching target', () => {
      const actions = run('use brass key on vault door', { inventory: ['brass-key'] });
      expect(actions).toContainEqual({ type: 'SET_FLAG', flag: 'vault-open' });
      expect(actions).toContainEqual({ type: 'REMOVE_INVENTORY', itemId: 'brass-key' });
      expect(saysSomethingLike(actions, 'the lock turns')).toBe(true);
    });

    it('applies a useAlone result', () => {
      const actions = run('use the matches', { inventory: ['matches'] });
      expect(actions).toContainEqual({ type: 'SET_FLAG', flag: 'match-lit' });
    });

    it('says the item is no help when it has no use here', () => {
      expect(saysSomethingLike(run('use the flashlight'), 'not sure how to use')).toBe(true);
    });
  });

  describe('read', () => {
    it('reads an inventory item', () => {
      expect(saysSomethingLike(run('read the notebook'), 'the house is worse than described')).toBe(true);
    });

    it('reads a room item', () => {
      expect(saysSomethingLike(run('read the plaque'), 'erasmus blackwood')).toBe(true);
    });

    it('says when an item has nothing written on it', () => {
      expect(saysSomethingLike(run('read the flashlight'), 'nothing to read')).toBe(true);
    });

    it('says when there is nothing by that name to read', () => {
      expect(saysSomethingLike(run('read the tombstone'), "don't see")).toBe(true);
    });
  });

  describe('talk', () => {
    it('says nobody is here when the room has no NPCs', () => {
      expect(saysSomethingLike(run('talk to the butler'), 'nobody here')).toBe(true);
    });

    it('speaks the unconditional line by default', () => {
      expect(saysSomethingLike(run('talk to the butler', { currentRoom: 'study' }), 'should not have come')).toBe(true);
    });

    it('prefers a conditional line once its flag is set', () => {
      const actions = run('talk to the butler', { currentRoom: 'study', flags: { 'butler-appeased': true } });
      expect(saysSomethingLike(actions, 'take this, and go')).toBe(true);
      expect(actions).toContainEqual({ type: 'ADD_INVENTORY', itemId: 'silver-coin' });
      expect(actions).toContainEqual({ type: 'SET_FLAG', flag: 'coin-given' });
    });
  });

  describe('inventory', () => {
    it('lists what the player carries', () => {
      const actions = run('i');
      expect(saysSomethingLike(actions, 'flashlight')).toBe(true);
      expect(saysSomethingLike(actions, 'notebook')).toBe(true);
    });

    it('reports empty hands', () => {
      expect(saysSomethingLike(run('inventory', { inventory: [] }), 'empty-handed')).toBe(true);
    });
  });

  describe('combine', () => {
    it('asks for both items when only one is named', () => {
      expect(saysSomethingLike(run('combine handle', { inventory: ['handle', 'blade'] }), 'combine what')).toBe(true);
    });

    it('refuses when the player lacks one of the items', () => {
      expect(saysSomethingLike(run('combine handle with blade', { inventory: ['handle'] }), "don't have both")).toBe(true);
    });

    it('consumes both items and yields the result', () => {
      const actions = run('combine handle with blade', { inventory: ['handle', 'blade'] });
      expect(actions).toContainEqual({ type: 'REMOVE_INVENTORY', itemId: 'handle' });
      expect(actions).toContainEqual({ type: 'REMOVE_INVENTORY', itemId: 'blade' });
      expect(actions).toContainEqual({ type: 'ADD_INVENTORY', itemId: 'crowbar' });
    });

    it('refuses items that do not combine', () => {
      expect(saysSomethingLike(
        run('combine flashlight with notebook', { inventory: ['flashlight', 'notebook'] }),
        "don't combine",
      )).toBe(true);
    });
  });

  describe('pray', () => {
    it('heals the player in the hidden chapel', () => {
      expect(run('pray', { currentRoom: 'hidden-chapel' })).toContainEqual({ type: 'HEAL', amount: 1 });
    });

    it('does nothing mechanical anywhere else', () => {
      const actions = run('pray');
      expect(actions.every(a => a.type === 'ADD_TEXT')).toBe(true);
    });
  });

  it('lists the verb set under help', () => {
    expect(saysSomethingLike(run('help'), 'commands:')).toBe(true);
  });

  it('counts waiting as a move', () => {
    const actions = run('wait');
    expect(actions).toContainEqual({ type: 'INCREMENT_MOVES' });
    expect(texts(actions)).toHaveLength(1);
  });
});
