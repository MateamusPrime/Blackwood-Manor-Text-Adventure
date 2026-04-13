import { ParsedCommand } from './types';

const DIRECTION_ALIASES: Record<string, string> = {
  n: 'north', s: 'south', e: 'east', w: 'west',
  u: 'up', d: 'down',
  north: 'north', south: 'south', east: 'east', west: 'west',
  up: 'up', down: 'down',
  ne: 'northeast', nw: 'northwest', se: 'southeast', sw: 'southwest',
  northeast: 'northeast', northwest: 'northwest', southeast: 'southeast', southwest: 'southwest',
};

const VERB_ALIASES: Record<string, string> = {
  go: 'go', walk: 'go', head: 'go', travel: 'go', run: 'go',
  look: 'look', l: 'look', examine: 'look', inspect: 'look', check: 'look', describe: 'look',
  take: 'take', get: 'take', grab: 'take', pick: 'take', collect: 'take',
  drop: 'drop', put: 'drop', leave: 'drop', discard: 'drop',
  use: 'use', apply: 'use', activate: 'use', drink: 'use',
  move: 'push',
  open: 'open', unlock: 'open',
  close: 'close', shut: 'close',
  read: 'read',
  talk: 'talk', speak: 'talk', ask: 'talk', chat: 'talk',
  inventory: 'inventory', i: 'inventory', items: 'inventory',
  help: 'help', '?': 'help', commands: 'help',
  save: 'save',
  load: 'load', restore: 'load',
  wait: 'wait', z: 'wait',
  push: 'push', pull: 'pull', turn: 'turn', twist: 'turn',
  play: 'play',
  light: 'light', burn: 'light',
  ring: 'ring',
  set: 'set',
  combine: 'combine', attach: 'combine', join: 'combine', wind: 'use',
  pray: 'pray', kneel: 'pray',
};

const PREPOSITIONS = ['at', 'to', 'on', 'with', 'in', 'into', 'from', 'about', 'under', 'behind', 'through'];

const ARTICLES = ['the', 'a', 'an', 'some', 'this', 'that'];

export function parseCommand(input: string): ParsedCommand {
  const raw = input.trim();
  const words = raw.toLowerCase().split(/\s+/).filter(w => !ARTICLES.includes(w));

  if (words.length === 0) {
    return { verb: '', noun: '', raw };
  }

  // Single direction shortcut (just typing "n", "south", etc.)
  if (words.length === 1 && DIRECTION_ALIASES[words[0]]) {
    return { verb: 'go', noun: DIRECTION_ALIASES[words[0]], raw };
  }

  // Single verb shortcut
  if (words.length === 1) {
    const verb = VERB_ALIASES[words[0]] || words[0];
    return { verb, noun: '', raw };
  }

  const firstWord = words[0];
  let verb = VERB_ALIASES[firstWord] || firstWord;
  const rest = words.slice(1);

  // "go north" or "go to kitchen"
  if (verb === 'go') {
    const filtered = rest.filter(w => !PREPOSITIONS.includes(w));
    const dir = filtered[0] ? (DIRECTION_ALIASES[filtered[0]] || filtered.join(' ')) : '';
    return { verb: 'go', noun: dir, raw };
  }

  // "pick up X" -> take X
  if (firstWord === 'pick' && rest[0] === 'up') {
    return { verb: 'take', noun: rest.slice(1).join(' '), raw };
  }

  // "put down X" -> drop X
  if (firstWord === 'put' && rest[0] === 'down') {
    return { verb: 'drop', noun: rest.slice(1).join(' '), raw };
  }

  // "turn on X" -> use X
  if (firstWord === 'turn' && rest[0] === 'on') {
    return { verb: 'use', noun: rest.slice(1).join(' '), raw };
  }

  // "move <direction>" -> go <direction>
  if (verb === 'push' && rest.length === 1 && DIRECTION_ALIASES[rest[0]]) {
    return { verb: 'go', noun: DIRECTION_ALIASES[rest[0]], raw };
  }

  // "talk to X"
  if (verb === 'talk' && rest[0] === 'to') {
    return { verb: 'talk', noun: rest.slice(1).join(' '), raw };
  }

  // Find preposition to split noun and target
  const prepIndex = rest.findIndex(w => PREPOSITIONS.includes(w));
  if (prepIndex > 0) {
    const noun = rest.slice(0, prepIndex).join(' ');
    const preposition = rest[prepIndex];
    const target = rest.slice(prepIndex + 1).join(' ');
    return { verb, noun, preposition, target, raw };
  }

  // "look at X" where preposition is first word after verb
  if (prepIndex === 0 && rest.length > 1) {
    const preposition = rest[0];
    const noun = rest.slice(1).join(' ');
    return { verb, noun, preposition, raw };
  }

  return { verb, noun: rest.join(' '), raw };
}

export function getDirectionFromNoun(noun: string): string | null {
  return DIRECTION_ALIASES[noun] || null;
}
