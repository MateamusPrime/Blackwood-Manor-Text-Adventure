// @vitest-environment jsdom
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import StatusBar from '../components/StatusBar';
import Inventory from '../components/Inventory';
import TextOutput from '../components/TextOutput';
import ArtPanel from '../components/ArtPanel';
import CommandInput from '../components/CommandInput';
import type { Item, TextEntry } from '../engine/types';

// These components are what the player actually reads and types into. The
// tests below assert on what reaches the screen and what a keystroke does,
// not on the terminal styling, which is free to change.

// Without vitest globals, Testing Library does not register its own cleanup,
// so renders would pile up in the document and queries would match several.
afterEach(cleanup);

beforeAll(() => {
  // TextOutput scrolls the newest line into view; jsdom has no layout, so it
  // does not implement this.
  Element.prototype.scrollIntoView = vi.fn();
});

describe('StatusBar', () => {
  it('fills one heart per point of health and leaves the rest hollow', () => {
    const { container } = render(<StatusBar health={3} maxHealth={5} moveCount={0} />);
    const text = container.textContent ?? '';
    expect(text).toContain('♥♥♥♡♡');
  });

  it('empties every heart at zero health', () => {
    const { container } = render(<StatusBar health={0} maxHealth={5} moveCount={0} />);
    expect(container.textContent).toContain('♡♡♡♡♡');
  });

  it('pads the move count to four digits', () => {
    render(<StatusBar health={5} maxHealth={5} moveCount={7} />);
    expect(screen.getByText(/MOVES: 0007/)).toBeTruthy();
  });

  it('keeps counting past four digits rather than truncating', () => {
    render(<StatusBar health={5} maxHealth={5} moveCount={12345} />);
    expect(screen.getByText(/MOVES: 12345/)).toBeTruthy();
  });
});

describe('Inventory', () => {
  const items: Record<string, Item> = {
    flashlight: { id: 'flashlight', name: 'Heavy-Duty Flashlight', description: '' },
    bell: { id: 'bell', name: 'Silver Bell', description: '' },
  };

  it('says so when the player is empty-handed', () => {
    const { container } = render(<Inventory inventory={[]} items={items} />);
    expect(container.textContent).toContain('(empty)');
  });

  it('lists what the player carries by name', () => {
    const { container } = render(<Inventory inventory={['bell']} items={items} />);
    expect(container.textContent).toContain('Silver Bell');
  });

  it('truncates a name too long for the panel', () => {
    const { container } = render(<Inventory inventory={['flashlight']} items={items} />);
    // 'Heavy-Duty Flashlight' is 21 characters; the panel holds 18.
    expect(container.textContent).toContain('…');
    expect(container.textContent).not.toContain('Heavy-Duty Flashlight');
  });

  it('falls back to the id for an item with no definition', () => {
    const { container } = render(<Inventory inventory={['mystery-thing']} items={items} />);
    expect(container.textContent).toContain('mystery-thing');
  });
});

describe('TextOutput', () => {
  const entry = (id: number, text: string, type: TextEntry['type'] = 'normal'): TextEntry =>
    ({ id, text, type });

  it('renders the log in order', () => {
    const { container } = render(
      <TextOutput textLog={[entry(1, 'first'), entry(2, 'second')]} />,
    );
    const text = container.textContent ?? '';
    expect(text.indexOf('first')).toBeLessThan(text.indexOf('second'));
  });

  it('renders every entry type without falling over', () => {
    const types: TextEntry['type'][] = ['normal', 'system', 'error', 'spooky', 'important', 'title'];
    const { container } = render(
      <TextOutput textLog={types.map((t, i) => entry(i, `line-${t}`, t))} />,
    );
    for (const t of types) expect(container.textContent).toContain(`line-${t}`);
  });

  it('breaks a multi-line entry across lines', () => {
    const { container } = render(<TextOutput textLog={[entry(1, 'top\nbottom')]} />);
    expect(container.querySelectorAll('br')).toHaveLength(1);
    expect(container.textContent).toContain('top');
    expect(container.textContent).toContain('bottom');
  });

  it('renders nothing for an empty log', () => {
    const { container } = render(<TextOutput textLog={[]} />);
    expect(container.textContent).toBe('');
  });
});

describe('ArtPanel', () => {
  it('draws the panel for the room', () => {
    const { container } = render(<ArtPanel artKey="crypt" />);
    expect(container.textContent).toContain('BLACKWOOD');
  });

  it('falls back to the default panel for an unknown key', () => {
    // The fallback used to be looked up under the wrong key, so a room with no
    // panel rendered blank. This is that regression.
    const { container } = render(<ArtPanel artKey="no-such-room" />);
    expect((container.textContent ?? '').trim()).not.toBe('');
  });
});

describe('CommandInput', () => {
  const type = (input: HTMLElement, value: string) => fireEvent.change(input, { target: { value } });
  const enter = (input: HTMLElement) => fireEvent.keyDown(input, { key: 'Enter' });

  it('sends the typed command and clears the field', () => {
    const onCommand = vi.fn();
    render(<CommandInput onCommand={onCommand} />);
    const input = screen.getByPlaceholderText('Enter command...') as HTMLInputElement;

    type(input, 'go north');
    enter(input);

    expect(onCommand).toHaveBeenCalledWith('go north');
    expect(input.value).toBe('');
  });

  it('trims what it sends', () => {
    const onCommand = vi.fn();
    render(<CommandInput onCommand={onCommand} />);
    const input = screen.getByPlaceholderText('Enter command...');

    type(input, '   look   ');
    enter(input);

    expect(onCommand).toHaveBeenCalledWith('look');
  });

  it('sends nothing for a blank line', () => {
    const onCommand = vi.fn();
    render(<CommandInput onCommand={onCommand} />);
    const input = screen.getByPlaceholderText('Enter command...');

    type(input, '    ');
    enter(input);

    expect(onCommand).not.toHaveBeenCalled();
  });

  it('recalls the previous command with the up arrow', () => {
    render(<CommandInput onCommand={vi.fn()} />);
    const input = screen.getByPlaceholderText('Enter command...') as HTMLInputElement;

    type(input, 'take lantern');
    enter(input);
    expect(input.value).toBe('');

    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(input.value).toBe('take lantern');
  });

  it('walks back down the history to an empty line', () => {
    render(<CommandInput onCommand={vi.fn()} />);
    const input = screen.getByPlaceholderText('Enter command...') as HTMLInputElement;

    type(input, 'north');
    enter(input);
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(input.value).toBe('north');

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input.value).toBe('');
  });

  it('has nothing to recall before anything is typed', () => {
    render(<CommandInput onCommand={vi.fn()} />);
    const input = screen.getByPlaceholderText('Enter command...') as HTMLInputElement;

    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(input.value).toBe('');
  });

  it('shuts the prompt down once the game is over', () => {
    const onCommand = vi.fn();
    render(<CommandInput onCommand={onCommand} disabled />);

    // The prompt says why it stopped accepting input, rather than just going dead.
    const input = screen.getByPlaceholderText('Game over...') as HTMLInputElement;
    expect(input.disabled).toBe(true);
    expect(screen.queryByPlaceholderText('Enter command...')).toBeNull();

    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onCommand).not.toHaveBeenCalled();
  });
});
