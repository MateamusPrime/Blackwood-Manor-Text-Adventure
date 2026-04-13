import { GameState, GameAction, TextEntry } from './types';

let nextTextId = 1;

export function getInitialState(): GameState {
  return {
    currentRoom: 'front-porch',
    previousRoom: '',
    inventory: ['flashlight', 'notebook'],
    roomStates: {},
    flags: {},
    health: 5,
    maxHealth: 5,
    moveCount: 0,
    textLog: [],
    gameOver: false,
    won: false,
    visitedRooms: [],
    firedEvents: [],
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'ADD_TEXT': {
      const entry: TextEntry = { ...action.entry, id: nextTextId++ };
      return {
        ...state,
        textLog: [...state.textLog, entry],
      };
    }

    case 'MOVE_TO': {
      const visited = state.visitedRooms.includes(action.roomId)
        ? state.visitedRooms
        : [...state.visitedRooms, action.roomId];
      return {
        ...state,
        previousRoom: state.currentRoom,
        currentRoom: action.roomId,
        visitedRooms: visited,
        roomStates: {
          ...state.roomStates,
          [action.roomId]: state.roomStates[action.roomId] || {
            visited: false,
            itemsTaken: [],
            itemsDropped: [],
          },
        },
      };
    }

    case 'TAKE_ITEM': {
      const roomState = state.roomStates[state.currentRoom] || {
        visited: true,
        itemsTaken: [],
        itemsDropped: [],
      };
      return {
        ...state,
        inventory: [...state.inventory, action.itemId],
        roomStates: {
          ...state.roomStates,
          [state.currentRoom]: {
            ...roomState,
            itemsTaken: [...roomState.itemsTaken, action.itemId],
          },
        },
      };
    }

    case 'DROP_ITEM': {
      const roomState = state.roomStates[state.currentRoom] || {
        visited: true,
        itemsTaken: [],
        itemsDropped: [],
      };
      return {
        ...state,
        inventory: state.inventory.filter(i => i !== action.itemId),
        roomStates: {
          ...state.roomStates,
          [state.currentRoom]: {
            ...roomState,
            itemsDropped: [...roomState.itemsDropped, action.itemId],
          },
        },
      };
    }

    case 'SET_FLAG':
      return {
        ...state,
        flags: { ...state.flags, [action.flag]: action.value !== false },
      };

    case 'ADD_INVENTORY':
      return {
        ...state,
        inventory: [...state.inventory, action.itemId],
      };

    case 'REMOVE_INVENTORY':
      return {
        ...state,
        inventory: state.inventory.filter(i => i !== action.itemId),
      };

    case 'DAMAGE': {
      const newHealth = Math.max(0, state.health - action.amount);
      if (newHealth === 0) {
        return {
          ...state,
          health: 0,
          gameOver: true,
          won: false,
        };
      }
      return { ...state, health: newHealth };
    }

    case 'HEAL':
      return {
        ...state,
        health: Math.min(state.maxHealth, state.health + action.amount),
      };

    case 'GAME_OVER': {
      const entry: TextEntry = { id: nextTextId++, text: action.message, type: 'spooky' };
      return {
        ...state,
        gameOver: true,
        won: action.won,
        textLog: [...state.textLog, entry],
      };
    }

    case 'INCREMENT_MOVES':
      return { ...state, moveCount: state.moveCount + 1 };

    case 'FIRE_EVENT':
      return {
        ...state,
        firedEvents: [...state.firedEvents, action.eventId],
      };

    case 'LOAD_STATE':
      nextTextId = action.state.textLog.length + 1;
      return action.state;

    case 'RESET':
      nextTextId = 1;
      return getInitialState();

    default:
      return state;
  }
}
