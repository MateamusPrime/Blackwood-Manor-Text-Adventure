import { describe, it, expect } from 'vitest';
import { rooms } from '../data/rooms';
import { items } from '../data/items';
import { roomArt } from '../data/art';
import { getInitialState } from '../engine/gameState';

const roomEntries = Object.entries(rooms);
const roomIds = new Set(Object.keys(rooms));
const itemIds = new Set(Object.keys(items));

// Item ids that exist as objects in rooms rather than as carryable definitions
// in data/items.ts. Collected once so the reachability checks below can tell a
// scenery id from a typo.
const roomItemIds = new Set(roomEntries.flatMap(([, room]) => room.items.map(i => i.id)));

describe('rooms', () => {
  it('has a world to explore', () => {
    expect(roomEntries.length).toBeGreaterThan(0);
  });

  it('keys every room by its own id', () => {
    for (const [key, room] of roomEntries) {
      expect(room.id, `room "${key}" disagrees with its key`).toBe(key);
    }
  });

  it('gives every room a name, a description and art', () => {
    for (const [key, room] of roomEntries) {
      expect(room.name, `room "${key}" has no name`).toBeTruthy();
      expect(room.description, `room "${key}" has no description`).toBeTruthy();
      expect(room.artKey, `room "${key}" has no art key`).toBeTruthy();
    }
  });

  it('points every exit at a room that exists', () => {
    const broken: string[] = [];
    for (const [key, room] of roomEntries) {
      for (const exit of room.exits) {
        if (!roomIds.has(exit.roomId)) broken.push(`${key} --${exit.direction}--> ${exit.roomId}`);
      }
    }
    expect(broken).toEqual([]);
  });

  it('requires an item or a flag for every locked exit', () => {
    const unopenable: string[] = [];
    for (const [key, room] of roomEntries) {
      for (const exit of room.exits) {
        if (exit.locked && !exit.requiredItem && !exit.requiredFlag) {
          unopenable.push(`${key} --${exit.direction}--> ${exit.roomId}`);
        }
      }
    }
    expect(unopenable).toEqual([]);
  });

  it('requires a flag to reveal every hidden exit', () => {
    const unreachable: string[] = [];
    for (const [key, room] of roomEntries) {
      for (const exit of room.exits) {
        if (exit.hidden && !exit.requiredFlag) unreachable.push(`${key} --${exit.direction}--> ${exit.roomId}`);
      }
    }
    expect(unreachable).toEqual([]);
  });

  it('names a real item for every exit that requires one', () => {
    const missing: string[] = [];
    for (const [key, room] of roomEntries) {
      for (const exit of room.exits) {
        if (exit.requiredItem && !itemIds.has(exit.requiredItem) && !roomItemIds.has(exit.requiredItem)) {
          missing.push(`${key} --${exit.direction}--> needs "${exit.requiredItem}"`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it('does not use the same direction twice in one room', () => {
    const duplicated: string[] = [];
    for (const [key, room] of roomEntries) {
      const seen = new Set<string>();
      for (const exit of room.exits) {
        if (seen.has(exit.direction)) duplicated.push(`${key}: ${exit.direction}`);
        seen.add(exit.direction);
      }
    }
    expect(duplicated).toEqual([]);
  });

  it('gives every room item an id, a name and a description', () => {
    for (const [key, room] of roomEntries) {
      for (const item of room.items) {
        expect(item.id, `an item in "${key}" has no id`).toBeTruthy();
        expect(item.name, `item "${item.id}" in "${key}" has no name`).toBeTruthy();
        expect(item.description, `item "${item.id}" in "${key}" has no description`).toBeTruthy();
      }
    }
  });

  it('names a reveal flag for every hidden room item', () => {
    const unrevealable: string[] = [];
    for (const [key, room] of roomEntries) {
      for (const item of room.items) {
        if (item.hidden && !item.revealedByFlag) unrevealable.push(`${key}: ${item.id}`);
      }
    }
    expect(unrevealable).toEqual([]);
  });

  it('does not repeat an item id inside one room', () => {
    for (const [key, room] of roomEntries) {
      const ids = room.items.map(i => i.id);
      expect(new Set(ids).size, `room "${key}" repeats an item id`).toBe(ids.length);
    }
  });

  it('gives every NPC a name, a description and something to say', () => {
    for (const [key, room] of roomEntries) {
      for (const npc of room.npcs) {
        expect(npc.name, `an NPC in "${key}" has no name`).toBeTruthy();
        expect(npc.description, `NPC "${npc.id}" in "${key}" has no description`).toBeTruthy();
        expect(npc.dialogue.length, `NPC "${npc.id}" in "${key}" has no dialogue`).toBeGreaterThan(0);
      }
    }
  });

  it('gives every blocking NPC a way to be appeased', () => {
    const impassable: string[] = [];
    for (const [key, room] of roomEntries) {
      for (const npc of room.npcs) {
        if (npc.blocksExit && !npc.appeaseFlag && !npc.appeaseItem) impassable.push(`${key}: ${npc.id}`);
      }
    }
    expect(impassable).toEqual([]);
  });

  it('has every blocking NPC guard an exit that exists', () => {
    const phantom: string[] = [];
    for (const [key, room] of roomEntries) {
      for (const npc of room.npcs) {
        if (npc.blocksExit && !room.exits.some(e => e.direction === npc.blocksExit)) {
          phantom.push(`${key}: ${npc.id} blocks "${npc.blocksExit}"`);
        }
      }
    }
    expect(phantom).toEqual([]);
  });

  it('gives every entry event the field its type needs', () => {
    const malformed: string[] = [];
    for (const [key, room] of roomEntries) {
      for (const event of room.onEnter ?? []) {
        const needs =
          event.type === 'setFlag' ? event.flag :
          event.type === 'addItem' || event.type === 'removeItem' ? event.item :
          event.type === 'teleport' ? event.roomId :
          event.type === 'message' ? event.message :
          'n/a';
        if (!needs) malformed.push(`${key}: ${event.type} event is missing its payload`);
      }
    }
    expect(malformed).toEqual([]);
  });

  it('teleports only to rooms that exist', () => {
    const broken: string[] = [];
    for (const [key, room] of roomEntries) {
      for (const event of room.onEnter ?? []) {
        if (event.type === 'teleport' && event.roomId && !roomIds.has(event.roomId)) {
          broken.push(`${key} -> ${event.roomId}`);
        }
      }
    }
    expect(broken).toEqual([]);
  });

  it('gives every once-only event an id to remember it by', () => {
    const anonymous: string[] = [];
    for (const [key, room] of roomEntries) {
      for (const event of room.onEnter ?? []) {
        if (event.once && !event.eventId) anonymous.push(`${key}: ${event.type}`);
      }
    }
    expect(anonymous).toEqual([]);
  });

  it('does not reuse an event id across rooms', () => {
    const seen = new Map<string, string>();
    const collisions: string[] = [];
    for (const [key, room] of roomEntries) {
      for (const event of room.onEnter ?? []) {
        if (!event.eventId) continue;
        const owner = seen.get(event.eventId);
        if (owner && owner !== key) collisions.push(`"${event.eventId}" in both ${owner} and ${key}`);
        seen.set(event.eventId, key);
      }
    }
    expect(collisions).toEqual([]);
  });
});

describe('items', () => {
  it('keys every item by its own id', () => {
    for (const [key, item] of Object.entries(items)) {
      expect(item.id, `item "${key}" disagrees with its key`).toBe(key);
    }
  });

  it('gives every item a name and a description', () => {
    for (const [key, item] of Object.entries(items)) {
      expect(item.name, `item "${key}" has no name`).toBeTruthy();
      expect(item.description, `item "${key}" has no description`).toBeTruthy();
    }
  });

  it('gives every useWith result a message', () => {
    const silent: string[] = [];
    for (const [key, item] of Object.entries(items)) {
      for (const [target, result] of Object.entries(item.useWith ?? {})) {
        if (!result.message) silent.push(`${key} + ${target}`);
      }
    }
    expect(silent).toEqual([]);
  });

  it('teleports only to rooms that exist', () => {
    const broken: string[] = [];
    for (const [key, item] of Object.entries(items)) {
      for (const [target, result] of Object.entries(item.useWith ?? {})) {
        if (result.teleport && !roomIds.has(result.teleport)) broken.push(`${key} + ${target} -> ${result.teleport}`);
      }
    }
    expect(broken).toEqual([]);
  });

  it('grants only items that exist', () => {
    const missing: string[] = [];
    const check = (source: string, given?: string) => {
      if (given && !itemIds.has(given)) missing.push(`${source} gives "${given}"`);
    };
    for (const [key, item] of Object.entries(items)) {
      check(key, item.useAlone?.givesItem);
      for (const [target, result] of Object.entries(item.useWith ?? {})) {
        check(`${key} + ${target}`, result.givesItem);
      }
    }
    for (const [key, room] of roomEntries) {
      for (const npc of room.npcs) {
        for (const line of npc.dialogue) check(`${key}/${npc.id}`, line.givesItem);
      }
      for (const event of room.onEnter ?? []) {
        if (event.type === 'addItem') check(key, event.item);
      }
    }
    expect(missing).toEqual([]);
  });

  it('produces an item that exists from every combination', () => {
    const broken: string[] = [];
    for (const [key, item] of Object.entries(items)) {
      if (!item.combinable?.length) continue;
      if (!item.combineResult) {
        broken.push(`${key} is combinable but yields nothing`);
        continue;
      }
      if (!itemIds.has(item.combineResult)) broken.push(`${key} yields missing item "${item.combineResult}"`);
      for (const partner of item.combinable) {
        if (!itemIds.has(partner)) broken.push(`${key} combines with missing item "${partner}"`);
      }
    }
    expect(broken).toEqual([]);
  });
});

// data/art.ts defines 33 panels for 33 rooms, but five artKeys do not line up
// by name, so these rooms render an empty panel: ArtPanel falls back to
// roomArt['default'], which is not defined either. Five panels go unused in
// turn (bathroom, drawing-room, greenhouse, hallway, outside-crypt), so this is
// a naming mismatch rather than missing art. Listed explicitly so the check
// below still catches any NEW room that loses its art, and so the list shrinks
// as the keys are reconciled.
const ROOMS_WITH_NO_ART = [
  'pantry',
  'conservatory',
  'master-bathroom',
  'guest-bedroom',
  'attic-stairs',
];

describe('art', () => {
  it('has a panel for every room except the known gaps', () => {
    const missing = roomEntries
      .filter(([key, room]) => !roomArt[room.artKey] && !ROOMS_WITH_NO_ART.includes(key))
      .map(([key]) => key);
    expect(missing).toEqual([]);
  });

  it('still needs art for each room on the known-gap list', () => {
    // Fails once a gap is filled, as a prompt to shorten the list above.
    const stillMissing = ROOMS_WITH_NO_ART.filter(key => !roomArt[rooms[key].artKey]);
    expect(stillMissing).toEqual(ROOMS_WITH_NO_ART);
  });

  it('draws something in every panel', () => {
    for (const [key, art] of Object.entries(roomArt)) {
      expect(art.trim(), `art "${key}" is blank`).not.toBe('');
    }
  });
});

describe('the starting state', () => {
  it('begins in a room that exists', () => {
    expect(roomIds.has(getInitialState().currentRoom)).toBe(true);
  });

  it('begins with items that exist', () => {
    for (const id of getInitialState().inventory) {
      expect(itemIds.has(id), `starting item "${id}" is not defined`).toBe(true);
    }
  });
});
