import fs from 'node:fs';
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

// The panel ArtPanel falls back to when a room's artKey is missing. It belongs
// to no room by design.
const FALLBACK_ART_KEY = '_default';

// Panels that belong to no room. They are leftovers keyed by names the world
// does not use, kept rather than deleted, and listed here so a NEW orphan --
// art drawn under a key that never reaches the screen -- still fails the suite.
const UNUSED_ART = ['drawing-room', 'hallway', 'outside-crypt'];

describe('art', () => {
  it('has a panel for every room', () => {
    const missing = roomEntries.filter(([, room]) => !roomArt[room.artKey]).map(([key]) => key);
    expect(missing).toEqual([]);
  });

  it('keys every panel to the id of the room that shows it', () => {
    // data/rooms.ts sets artKey to the room's own id throughout; this keeps a
    // renamed room from silently leaving its panel behind.
    const mismatched = roomEntries
      .filter(([key, room]) => room.artKey !== key)
      .map(([key, room]) => `${key} -> ${room.artKey}`);
    expect(mismatched).toEqual([]);
  });

  it('defines the panel ArtPanel falls back to', () => {
    expect(roomArt[FALLBACK_ART_KEY]).toBeTruthy();
  });

  it('draws no panel that no room can reach', () => {
    const used = new Set(roomEntries.map(([, room]) => room.artKey));
    const orphans = Object.keys(roomArt)
      .filter(k => k !== FALLBACK_ART_KEY && !used.has(k) && !UNUSED_ART.includes(k));
    expect(orphans).toEqual([]);
  });

  it('still has every known-unused panel', () => {
    // Fails once an orphan finds a room, as a prompt to shorten the list above.
    const used = new Set(roomEntries.map(([, room]) => room.artKey));
    expect(UNUSED_ART.filter(k => !used.has(k))).toEqual(UNUSED_ART);
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

// A flag only works as a gate if something, somewhere, can actually set it. The
// world data sets flags through room events, item results and NPC dialogue; the
// engine and the game hook set a further set as string literals (winding the
// music box, assembling the diary, and so on). Both halves are gathered here so
// the check covers the whole game rather than just data/.
const CODE_THAT_SETS_FLAGS = [
  'engine/commands.ts',
  'engine/events.ts',
  'hooks/useGame.ts',
];

function flagsSetInCode(): Set<string> {
  const found = new Set<string>();
  for (const file of CODE_THAT_SETS_FLAGS) {
    const source = fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
    for (const m of source.matchAll(/(?:\bflag|setsFlag):\s*'([^']+)'/g)) found.add(m[1]);
  }
  return found;
}

function flagsSetInData(): Set<string> {
  const found = new Set<string>();
  for (const [, room] of roomEntries) {
    for (const event of room.onEnter ?? []) {
      if (event.type === 'setFlag' && event.flag) found.add(event.flag);
    }
    for (const npc of room.npcs) {
      for (const line of npc.dialogue) if (line.setsFlag) found.add(line.setsFlag);
    }
  }
  for (const item of Object.values(items)) {
    if (item.useAlone?.setsFlag) found.add(item.useAlone.setsFlag);
    for (const result of Object.values(item.useWith ?? {})) {
      if (result.setsFlag) found.add(result.setsFlag);
    }
  }
  return found;
}

// Every place the world refuses to do something until a flag is set, with a
// label naming where the gate is so a failure points at the content.
function everyGate(): { flag: string; where: string }[] {
  const gates: { flag: string; where: string }[] = [];
  for (const [key, room] of roomEntries) {
    for (const exit of room.exits) {
      if (exit.requiredFlag) gates.push({ flag: exit.requiredFlag, where: `${key} exit ${exit.direction}` });
    }
    for (const item of room.items) {
      if (item.revealedByFlag) gates.push({ flag: item.revealedByFlag, where: `${key} item ${item.id}` });
    }
    for (const npc of room.npcs) {
      if (npc.requiredFlag) gates.push({ flag: npc.requiredFlag, where: `${key} npc ${npc.id}` });
      if (npc.appeaseFlag) gates.push({ flag: npc.appeaseFlag, where: `${key} npc ${npc.id} appease` });
      for (const line of npc.dialogue) {
        if (line.condition) gates.push({ flag: line.condition, where: `${key} npc ${npc.id} dialogue` });
      }
    }
    for (const event of room.onEnter ?? []) {
      if (event.condition) gates.push({ flag: event.condition, where: `${key} event ${event.type}` });
      if (event.notCondition) gates.push({ flag: event.notCondition, where: `${key} event ${event.type} (not)` });
    }
  }
  return gates;
}

describe('flags', () => {
  it('can set every flag the world gates something behind', () => {
    // A gate on a flag nothing sets is content the player can never reach --
    // a hidden item that never appears, an exit that never opens.
    const settable = new Set([...flagsSetInData(), ...flagsSetInCode()]);
    const unreachable = everyGate()
      .filter(g => !settable.has(g.flag))
      .map(g => `${g.where} waits on "${g.flag}", which nothing sets`);
    expect(unreachable).toEqual([]);
  });

  it('reads flag setters out of the engine, not just the world data', () => {
    // Guards the check above: if the engine stops setting flags as literals,
    // or a file gets renamed, the scan would silently return nothing and the
    // reachability test would pass for the wrong reason.
    expect(flagsSetInCode().size).toBeGreaterThan(0);
  });

  it('gates something behind a flag at all', () => {
    // Likewise: an empty gate list would make the check vacuous.
    expect(everyGate().length).toBeGreaterThan(0);
  });
});
