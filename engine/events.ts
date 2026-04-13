import { GameState, GameAction, Room, RoomEvent } from './types';

export function processRoomEvents(
  room: Room,
  state: GameState
): GameAction[] {
  if (!room.onEnter) return [];

  const actions: GameAction[] = [];

  for (const event of room.onEnter) {
    if (event.once && event.eventId && state.firedEvents.includes(event.eventId)) {
      continue;
    }

    if (event.condition && !state.flags[event.condition]) {
      continue;
    }

    if (event.notCondition && state.flags[event.notCondition]) {
      continue;
    }

    if (event.eventId) {
      actions.push({ type: 'FIRE_EVENT', eventId: event.eventId });
    }

    switch (event.type) {
      case 'message':
        if (event.message) {
          actions.push({ type: 'ADD_TEXT', entry: { text: event.message, type: 'spooky' } });
        }
        break;
      case 'setFlag':
        if (event.flag) {
          actions.push({ type: 'SET_FLAG', flag: event.flag });
        }
        break;
      case 'addItem':
        if (event.item) {
          actions.push({ type: 'ADD_INVENTORY', itemId: event.item });
          actions.push({ type: 'ADD_TEXT', entry: { text: `Something materializes in your hands... You received: ${event.item}`, type: 'important' } });
        }
        break;
      case 'removeItem':
        if (event.item) {
          actions.push({ type: 'REMOVE_INVENTORY', itemId: event.item });
          actions.push({ type: 'ADD_TEXT', entry: { text: `The ${event.item} vanishes from your possession!`, type: 'spooky' } });
        }
        break;
      case 'damage':
        actions.push({ type: 'DAMAGE', amount: event.amount || 1 });
        if (event.message) {
          actions.push({ type: 'ADD_TEXT', entry: { text: event.message, type: 'spooky' } });
        }
        break;
      case 'teleport':
        if (event.roomId) {
          if (event.message) {
            actions.push({ type: 'ADD_TEXT', entry: { text: event.message, type: 'spooky' } });
          }
          actions.push({ type: 'MOVE_TO', roomId: event.roomId });
        }
        break;
      case 'gameOver':
        actions.push({ type: 'GAME_OVER', won: false, message: event.message || 'You have perished...' });
        break;
      case 'win':
        actions.push({ type: 'GAME_OVER', won: true, message: event.message || 'You escaped!' });
        break;
    }
  }

  return actions;
}

export function checkFlag(state: GameState, flag: string): boolean {
  return !!state.flags[flag];
}

export function hasItem(state: GameState, itemId: string): boolean {
  return state.inventory.includes(itemId);
}
