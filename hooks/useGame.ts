'use client';

import { useReducer, useCallback } from 'react';
import { gameReducer, getInitialState } from '../engine/gameState';
import { parseCommand } from '../engine/parser';
import { executeCommand } from '../engine/commands';
import { GameAction } from '../engine/types';
import { rooms } from '../data/rooms';
import { items } from '../data/items';

export function useGame() {
  const [state, dispatch] = useReducer(gameReducer, undefined, getInitialState);

  const processCommand = useCallback((input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return;

    // Log the player's input
    dispatch({
      type: 'ADD_TEXT',
      entry: { text: `> ${trimmed}`, type: 'system' },
    });

    const cmd = parseCommand(trimmed);
    const actions: GameAction[] = executeCommand(cmd, state, rooms, items);

    // Special flag handling for specific examine actions
    if (
      cmd.verb === 'look' &&
      cmd.noun.includes('plate') &&
      state.currentRoom === 'dining-room'
    ) {
      actions.push({ type: 'SET_FLAG', flag: 'checked-plates' });
    }

    if (
      cmd.verb === 'look' &&
      cmd.noun.includes('bed') &&
      state.currentRoom === 'master-bedroom'
    ) {
      actions.push({ type: 'SET_FLAG', flag: 'searched-bed' });
    }

    // Check if all 3 diary pages collected
    if (cmd.verb === 'use' && cmd.noun.includes('diary')) {
      const hasPage1 = state.inventory.includes('torn-diary-page-1');
      const hasPage2 = state.inventory.includes('torn-diary-page-2');
      const hasPage3 = state.inventory.includes('torn-diary-page-3');
      if (hasPage1 && !state.flags['diary-page-1-read']) {
        actions.push({ type: 'SET_FLAG', flag: 'diary-page-1-read' });
      }
      if (hasPage2 && !state.flags['diary-page-2-read']) {
        actions.push({ type: 'SET_FLAG', flag: 'diary-page-2-read' });
      }
      if (hasPage3 && !state.flags['diary-page-3-read']) {
        actions.push({ type: 'SET_FLAG', flag: 'diary-page-3-read' });
      }
      if (hasPage1 && hasPage2 && hasPage3 && !state.flags['diary-assembled']) {
        actions.push({ type: 'SET_FLAG', flag: 'diary-assembled' });
        actions.push({
          type: 'ADD_TEXT',
          entry: {
            text: 'You have assembled all three diary pages. The story of Edmund Blackwood becomes clear...',
            type: 'important',
          },
        });
      }
    }

    // Holy water heals 1 HP when used alone
    if (
      cmd.verb === 'use' &&
      cmd.noun.includes('holy water') &&
      !cmd.target &&
      state.inventory.includes('holy-water')
    ) {
      actions.push({ type: 'HEAL', amount: 1 });
    }

    // Wine bottle heals 1 HP
    if (
      cmd.verb === 'use' &&
      (cmd.noun.includes('wine') || cmd.noun.includes('bottle')) &&
      state.inventory.includes('wine-bottle')
    ) {
      actions.push({ type: 'HEAL', amount: 1 });
    }

    // Angel tears heal the player
    if (
      cmd.verb === 'use' &&
      cmd.noun.includes('tear') &&
      state.inventory.includes('angel-tears')
    ) {
      actions.push({ type: 'HEAL', amount: 2 });
      actions.push({ type: 'REMOVE_INVENTORY', itemId: 'angel-tears' });
    }

    // Auto-wind music box if player has both pieces and tries to use/wind it
    if (
      cmd.verb === 'use' &&
      cmd.noun.includes('music box') &&
      state.inventory.includes('music-box') &&
      state.inventory.includes('music-box-key')
    ) {
      actions.length = 0; // Clear the "needs a key" message
      actions.push({ type: 'REMOVE_INVENTORY', itemId: 'music-box' });
      actions.push({ type: 'REMOVE_INVENTORY', itemId: 'music-box-key' });
      actions.push({ type: 'ADD_INVENTORY', itemId: 'music-box-wound' });
      actions.push({ type: 'ADD_TEXT', entry: { text: 'You insert the tiny brass key and wind the music box. The spring tightens with a satisfying click.', type: 'important' } });
    }

    // Open safe in study with combination
    if (
      (cmd.verb === 'open' || cmd.verb === 'use' || cmd.verb === 'set') &&
      cmd.noun.includes('safe') &&
      state.currentRoom === 'study' &&
      !state.flags['safe-opened']
    ) {
      const target = cmd.target || cmd.noun;
      if (target.includes('10') && target.includes('31') && target.includes('89')) {
        actions.length = 0;
        actions.push({ type: 'SET_FLAG', flag: 'safe-opened' });
        actions.push({ type: 'ADD_TEXT', entry: { text: 'Click... click... click. The safe swings open! Inside you find Edmund Blackwood\'s final letter and a vial of holy water.', type: 'important' } });
        actions.push({ type: 'ADD_INVENTORY', itemId: 'holy-water' });
        actions.push({ type: 'ADD_TEXT', entry: { text: 'The letter reads: "If you have found this, I have failed. The entity feeds on fear. Do not be afraid. The counter-ritual requires conviction, not just instruments. -E.B."', type: 'normal' } });
      } else if (target.match(/\d/)) {
        actions.push({ type: 'ADD_TEXT', entry: { text: 'The combination is wrong. The safe remains locked.', type: 'normal' } });
      }
    }

    // Push/pull bookshelf in library reveals secret passage
    if (
      (cmd.verb === 'push' || cmd.verb === 'pull' || cmd.verb === 'open') &&
      cmd.noun.includes('bookshelf') &&
      state.currentRoom === 'library' &&
      !state.flags['bookshelf-moved']
    ) {
      actions.push({ type: 'SET_FLAG', flag: 'bookshelf-moved' });
      actions.push({
        type: 'ADD_TEXT',
        entry: {
          text: 'The bookshelf groans and swings open, revealing a narrow, dark passage behind it!',
          type: 'spooky',
        },
      });
    }

    // Portrait puzzle in upper hallway
    if (
      cmd.verb === 'look' &&
      (cmd.noun.includes('portrait') || cmd.noun.includes('woman') || cmd.noun.includes('children') || cmd.noun.includes('man')) &&
      state.currentRoom === 'upper-hallway' &&
      !state.flags['portrait-order']
    ) {
      // Track examination steps
      if (cmd.noun.includes('woman') && !state.flags['portrait-woman']) {
        actions.push({ type: 'SET_FLAG', flag: 'portrait-woman' });
        actions.push({ type: 'ADD_TEXT', entry: { text: 'The woman in white seems to acknowledge your gaze. Her painted eyes shift toward the children\'s portrait...', type: 'spooky' } });
      } else if (cmd.noun.includes('children') && state.flags['portrait-woman'] && !state.flags['portrait-children']) {
        actions.push({ type: 'SET_FLAG', flag: 'portrait-children' });
        actions.push({ type: 'ADD_TEXT', entry: { text: 'The twin children smile as you look at them. Their eyes turn toward the man in black...', type: 'spooky' } });
      } else if (cmd.noun.includes('man') && state.flags['portrait-children'] && !state.flags['portrait-order']) {
        actions.push({ type: 'SET_FLAG', flag: 'portrait-order' });
        actions.push({ type: 'ADD_TEXT', entry: { text: 'As you look at the man in black, all three portraits begin to glow. The wall to the northwest shimmers and a mirror-like portal appears!', type: 'spooky' } });
      }
    }

    // Reading ritual book aloud in final chamber also banishes entity
    if (
      cmd.verb === 'read' &&
      cmd.noun.includes('book') &&
      state.currentRoom === 'final-chamber' &&
      state.inventory.includes('ritual-book') &&
      state.flags['ritual-complete']
    ) {
      actions.push({ type: 'SET_FLAG', flag: 'entity-banished' });
      actions.push({ type: 'ADD_TEXT', entry: { text: 'You read the banishment incantation aloud! Light erupts from the book, the bell rings of its own accord, the candle burns white-hot. The Entity screams as reality tears open and pulls it back to the void!', type: 'spooky' } });
    }

    // Room-restricted item uses: block use-on-target if not in correct room
    if (cmd.verb === 'use' && cmd.target) {
      const targetRoom: Record<string, string> = {
        entity: 'final-chamber',
        angel: 'garden',
      };
      for (const [target, requiredRoom] of Object.entries(targetRoom)) {
        if (cmd.target.includes(target) && state.currentRoom !== requiredRoom) {
          // Remove any flag-setting actions that shouldn't fire
          const flagsToBlock = ['entity-banished', 'entity-weakened', 'angel-appeased'];
          for (let i = actions.length - 1; i >= 0; i--) {
            const a = actions[i];
            if (a.type === 'SET_FLAG' && 'flag' in a && flagsToBlock.includes(a.flag)) {
              actions.splice(i, 1);
            }
          }
          // Replace with error message
          actions.push({ type: 'ADD_TEXT', entry: { text: `There is no ${target} here to use that on.`, type: 'normal' } });
        }
      }
    }

    // Win prerequisite: must have completed ritual before banishing entity
    if (
      actions.some(a => a.type === 'SET_FLAG' && 'flag' in a && a.flag === 'entity-banished') &&
      !state.flags['ritual-complete']
    ) {
      // Block the banishment
      for (let i = actions.length - 1; i >= 0; i--) {
        const a = actions[i];
        if (a.type === 'SET_FLAG' && 'flag' in a && a.flag === 'entity-banished') {
          actions.splice(i, 1);
        }
      }
      actions.push({ type: 'ADD_TEXT', entry: { text: 'You read the words aloud, but they feel hollow and powerless. The Entity laughs. You must perform the ritual first...', type: 'spooky' } });
    }

    // Win condition: entity banished
    if (actions.some(a => a.type === 'SET_FLAG' && 'flag' in a && a.flag === 'entity-banished')) {
      actions.push({
        type: 'GAME_OVER',
        won: true,
        message: 'Dawn breaks. The Entity is banished. Blackwood Manor falls silent at last. You stumble out into the morning light, forever changed, but alive. You have survived Blackwood Manor!',
      });
    }

    for (const action of actions) {
      dispatch(action);
    }
  }, [state]);

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return { state, processCommand, resetGame };
}
