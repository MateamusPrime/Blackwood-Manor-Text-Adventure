import { describe, it, expect } from 'vitest';
import { parseCommand, getDirectionFromNoun } from '../engine/parser';

describe('parseCommand', () => {
  describe('empty and whitespace input', () => {
    it('returns an empty verb for an empty string', () => {
      expect(parseCommand('')).toMatchObject({ verb: '', noun: '' });
    });

    it('returns an empty verb for whitespace only', () => {
      expect(parseCommand('   ')).toMatchObject({ verb: '', noun: '' });
    });

    it('trims the raw input but preserves its original casing', () => {
      expect(parseCommand('  TAKE The Key  ').raw).toBe('TAKE The Key');
    });
  });

  describe('bare directions', () => {
    it.each([
      ['n', 'north'],
      ['s', 'south'],
      ['e', 'east'],
      ['w', 'west'],
      ['u', 'up'],
      ['d', 'down'],
      ['ne', 'northeast'],
      ['nw', 'northwest'],
      ['se', 'southeast'],
      ['sw', 'southwest'],
    ])('expands the shorthand "%s" to %s', (input, direction) => {
      expect(parseCommand(input)).toMatchObject({ verb: 'go', noun: direction });
    });

    it('accepts a spelled-out direction on its own', () => {
      expect(parseCommand('northwest')).toMatchObject({ verb: 'go', noun: 'northwest' });
    });

    it('is case insensitive', () => {
      expect(parseCommand('NE')).toMatchObject({ verb: 'go', noun: 'northeast' });
    });
  });

  describe('single-word verbs', () => {
    it.each([
      ['look', 'look'],
      ['l', 'look'],
      ['i', 'inventory'],
      ['inventory', 'inventory'],
      ['items', 'inventory'],
      ['help', 'help'],
      ['?', 'help'],
      ['commands', 'help'],
      ['wait', 'wait'],
      ['z', 'wait'],
      ['restore', 'load'],
      ['kneel', 'pray'],
    ])('maps "%s" to the %s verb', (input, verb) => {
      expect(parseCommand(input)).toMatchObject({ verb, noun: '' });
    });

    it('passes an unrecognized word through as its own verb', () => {
      expect(parseCommand('yodel')).toMatchObject({ verb: 'yodel', noun: '' });
    });
  });

  describe('verb aliases', () => {
    it.each([
      ['walk north', 'go'],
      ['head north', 'go'],
      ['travel north', 'go'],
      ['run north', 'go'],
    ])('"%s" is a movement command', (input, verb) => {
      expect(parseCommand(input)).toMatchObject({ verb, noun: 'north' });
    });

    it.each([
      ['examine painting', 'look'],
      ['inspect painting', 'look'],
      ['check painting', 'look'],
      ['describe painting', 'look'],
    ])('"%s" is a look command', (input, verb) => {
      expect(parseCommand(input)).toMatchObject({ verb, noun: 'painting' });
    });

    it.each([
      ['take key', 'take'],
      ['get key', 'take'],
      ['grab key', 'take'],
      ['collect key', 'take'],
    ])('"%s" is a take command', (input, verb) => {
      expect(parseCommand(input)).toMatchObject({ verb, noun: 'key' });
    });

    it.each([
      ['drop key', 'drop'],
      ['leave key', 'drop'],
      ['discard key', 'drop'],
    ])('"%s" is a drop command', (input, verb) => {
      expect(parseCommand(input)).toMatchObject({ verb, noun: 'key' });
    });

    it.each([
      ['speak ghost', 'talk'],
      ['ask ghost', 'talk'],
      ['chat ghost', 'talk'],
    ])('"%s" is a talk command', (input, verb) => {
      expect(parseCommand(input)).toMatchObject({ verb, noun: 'ghost' });
    });

    it('treats "wind" as a use command', () => {
      expect(parseCommand('wind music box')).toMatchObject({ verb: 'use', noun: 'music box' });
    });

    it('treats "burn" as a light command', () => {
      expect(parseCommand('burn candle')).toMatchObject({ verb: 'light', noun: 'candle' });
    });
  });

  describe('articles', () => {
    it.each(['the', 'a', 'an', 'some', 'this', 'that'])('strips the article "%s"', (article) => {
      expect(parseCommand(`take ${article} key`)).toMatchObject({ verb: 'take', noun: 'key' });
    });

    it('strips several articles from one command', () => {
      expect(parseCommand('use the crowbar on the floorboards')).toMatchObject({
        verb: 'use',
        noun: 'crowbar',
        preposition: 'on',
        target: 'floorboards',
      });
    });
  });

  describe('multi-word phrasings', () => {
    it('turns "pick up X" into a take', () => {
      expect(parseCommand('pick up the rusty key')).toMatchObject({ verb: 'take', noun: 'rusty key' });
    });

    it('turns "put down X" into a drop', () => {
      expect(parseCommand('put down the notebook')).toMatchObject({ verb: 'drop', noun: 'notebook' });
    });

    it('turns "turn on X" into a use', () => {
      expect(parseCommand('turn on the flashlight')).toMatchObject({ verb: 'use', noun: 'flashlight' });
    });

    it('turns "move <direction>" into a go', () => {
      expect(parseCommand('move north')).toMatchObject({ verb: 'go', noun: 'north' });
    });

    it('keeps "move <thing>" as a push', () => {
      expect(parseCommand('move the bookshelf')).toMatchObject({ verb: 'push', noun: 'bookshelf' });
    });

    it('drops the "to" in "talk to X"', () => {
      expect(parseCommand('talk to the ghost child')).toMatchObject({ verb: 'talk', noun: 'ghost child' });
    });

    it('drops prepositions after "go"', () => {
      expect(parseCommand('go to the kitchen')).toMatchObject({ verb: 'go', noun: 'kitchen' });
    });

    it('expands a direction shorthand after "go"', () => {
      expect(parseCommand('go n')).toMatchObject({ verb: 'go', noun: 'north' });
    });

    it('leaves the noun empty when "go" has no destination', () => {
      expect(parseCommand('go')).toMatchObject({ verb: 'go', noun: '' });
    });
  });

  describe('prepositions', () => {
    it('splits noun and target around a middle preposition', () => {
      expect(parseCommand('use crowbar on floorboards')).toMatchObject({
        verb: 'use',
        noun: 'crowbar',
        preposition: 'on',
        target: 'floorboards',
      });
    });

    it('splits on "with"', () => {
      expect(parseCommand('combine handle with blade')).toMatchObject({
        verb: 'combine',
        noun: 'handle',
        preposition: 'with',
        target: 'blade',
      });
    });

    it('treats a leading preposition as part of the verb phrase', () => {
      expect(parseCommand('look at the painting')).toMatchObject({
        verb: 'look',
        noun: 'painting',
        preposition: 'at',
      });
    });

    it('leaves no target when the preposition leads', () => {
      expect(parseCommand('look at painting').target).toBeUndefined();
    });

    it('keeps multi-word nouns and targets intact', () => {
      expect(parseCommand('use the rusty key on the cellar door')).toMatchObject({
        noun: 'rusty key',
        target: 'cellar door',
      });
    });
  });

  it('parses these equivalent phrasings identically', () => {
    const asMove = (input: string) => {
      const { verb, noun } = parseCommand(input);
      return { verb, noun };
    };
    expect(asMove('go north')).toEqual(asMove('north'));
    expect(asMove('go north')).toEqual(asMove('n'));

    const asLook = (input: string) => {
      const { verb, noun } = parseCommand(input);
      return { verb, noun };
    };
    expect(asLook('look at the painting')).toEqual(asLook('examine painting'));
    expect(asLook('look at the painting')).toEqual(asLook('inspect painting'));

    const asTake = (input: string) => {
      const { verb, noun } = parseCommand(input);
      return { verb, noun };
    };
    expect(asTake('take the rusty key')).toEqual(asTake('grab rusty key'));
    expect(asTake('take the rusty key')).toEqual(asTake('pick up rusty key'));
  });
});

describe('getDirectionFromNoun', () => {
  it('resolves a shorthand direction', () => {
    expect(getDirectionFromNoun('sw')).toBe('southwest');
  });

  it('resolves a full direction to itself', () => {
    expect(getDirectionFromNoun('down')).toBe('down');
  });

  it('returns null for anything that is not a direction', () => {
    expect(getDirectionFromNoun('kitchen')).toBeNull();
  });
});
