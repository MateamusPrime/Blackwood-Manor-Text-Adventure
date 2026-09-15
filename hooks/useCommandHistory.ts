'use client';

import { useState, useCallback } from 'react';

export function useCommandHistory() {
  const [history, setHistory] = useState<string[]>([]);
  const [index, setIndex] = useState<number>(-1);

  const addCommand = useCallback((cmd: string) => {
    if (!cmd.trim()) return;
    setHistory(prev => {
      // Avoid duplicating the same command in a row
      if (prev[prev.length - 1] === cmd) return prev;
      return [...prev, cmd];
    });
    setIndex(-1);
  }, []);

  const navigateUp = useCallback((): string => {
    // One step back, or the newest command if the player is on a blank line.
    // Computed once: the caller puts the returned command in the input, so the
    // index this moves to and the command handed back have to be the same one.
    const newIndex = index === -1
      ? history.length - 1
      : Math.max(0, index - 1);
    setIndex(newIndex);
    return history[newIndex] ?? '';
  }, [history, index]);

  const navigateDown = useCallback((): string => {
    if (index === -1) return '';
    const newIndex = index + 1;
    if (newIndex >= history.length) {
      setIndex(-1);
      return '';
    }
    setIndex(newIndex);
    return history[newIndex] ?? '';
  }, [history, index]);

  return { addCommand, navigateUp, navigateDown };
}
