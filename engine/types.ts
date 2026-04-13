export interface Exit {
  direction: string;
  roomId: string;
  locked?: boolean;
  lockMessage?: string;
  requiredItem?: string;
  requiredFlag?: string;
  hidden?: boolean;
}

export interface RoomItem {
  id: string;
  name: string;
  description: string;
  takeable?: boolean;
  hidden?: boolean;
  revealedByFlag?: string;
  examineText?: string;
  useText?: string;
  readText?: string;
}

export interface NPC {
  id: string;
  name: string;
  description: string;
  dialogue: DialogueLine[];
  requiredFlag?: string;
  blocksExit?: string;
  appeaseItem?: string;
  appeaseFlag?: string;
}

export interface DialogueLine {
  text: string;
  condition?: string;
  setsFlag?: string;
  givesItem?: string;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  exits: Exit[];
  items: RoomItem[];
  npcs: NPC[];
  artKey: string;
  onEnter?: RoomEvent[];
  onExamine?: Record<string, string>;
  dark?: boolean;
  visited?: boolean;
}

export interface RoomEvent {
  type: 'message' | 'setFlag' | 'addItem' | 'removeItem' | 'damage' | 'teleport' | 'gameOver' | 'win';
  condition?: string;
  notCondition?: string;
  message?: string;
  flag?: string;
  item?: string;
  amount?: number;
  roomId?: string;
  once?: boolean;
  eventId?: string;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  useWith?: Record<string, UseResult>;
  useAlone?: UseResult;
  readText?: string;
  combinable?: string[];
  combineResult?: string;
}

export interface UseResult {
  message: string;
  setsFlag?: string;
  removesItem?: boolean;
  givesItem?: string;
  teleport?: string;
  damage?: number;
}

export interface TextEntry {
  id: number;
  text: string;
  type: 'normal' | 'system' | 'error' | 'spooky' | 'important' | 'title';
}

export interface GameState {
  currentRoom: string;
  previousRoom: string;
  inventory: string[];
  roomStates: Record<string, RoomState>;
  flags: Record<string, boolean>;
  health: number;
  maxHealth: number;
  moveCount: number;
  textLog: TextEntry[];
  gameOver: boolean;
  won: boolean;
  visitedRooms: string[];
  firedEvents: string[];
}

export interface RoomState {
  visited: boolean;
  itemsTaken: string[];
  itemsDropped: string[];
}

export interface ParsedCommand {
  verb: string;
  noun: string;
  preposition?: string;
  target?: string;
  raw: string;
}

export type GameAction =
  | { type: 'ADD_TEXT'; entry: Omit<TextEntry, 'id'> }
  | { type: 'MOVE_TO'; roomId: string }
  | { type: 'TAKE_ITEM'; itemId: string }
  | { type: 'DROP_ITEM'; itemId: string }
  | { type: 'SET_FLAG'; flag: string; value?: boolean }
  | { type: 'ADD_INVENTORY'; itemId: string }
  | { type: 'REMOVE_INVENTORY'; itemId: string }
  | { type: 'DAMAGE'; amount: number }
  | { type: 'HEAL'; amount: number }
  | { type: 'GAME_OVER'; won: boolean; message: string }
  | { type: 'INCREMENT_MOVES' }
  | { type: 'FIRE_EVENT'; eventId: string }
  | { type: 'LOAD_STATE'; state: GameState }
  | { type: 'RESET' };
