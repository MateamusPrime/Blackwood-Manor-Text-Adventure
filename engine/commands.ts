import { ParsedCommand, GameState, GameAction, Room, Item } from './types';
import { processRoomEvents, hasItem } from './events';

type CommandResult = GameAction[];

export function executeCommand(
  cmd: ParsedCommand,
  state: GameState,
  rooms: Record<string, Room>,
  items: Record<string, Item>,
): CommandResult {
  const room = rooms[state.currentRoom];
  if (!room) return [addText('You are nowhere... which should be impossible.', 'error')];

  if (state.gameOver) {
    if (cmd.verb === 'load') return handleLoad();
    if (cmd.verb === 'reset' || cmd.raw === 'restart' || cmd.raw === 'new game') return [{ type: 'RESET' }];
    return [addText('The game is over. Type "restart" to begin again, or "load" to restore a save.', 'system')];
  }

  switch (cmd.verb) {
    case 'go': return handleGo(cmd, state, room, rooms);
    case 'look': return handleLook(cmd, state, room, items);
    case 'take': return handleTake(cmd, state, room);
    case 'drop': return handleDrop(cmd, state, room, items);
    case 'use': return handleUse(cmd, state, room, items);
    case 'open': return handleOpen(cmd, state, room, items);
    case 'read': return handleRead(cmd, state, items, room);
    case 'talk': return handleTalk(cmd, state, room);
    case 'inventory': return handleInventory(state, items);
    case 'help': return handleHelp();
    case 'save': return handleSave(state);
    case 'load': return handleLoad();
    case 'wait': return handleWait();
    case 'push': case 'pull': case 'turn': return handleInteract(cmd, state, room);
    case 'play': return handlePlay(cmd, state, room, items);
    case 'light': return handleLight(cmd, state, items);
    case 'ring': return handleRing(cmd, state, items);
    case 'set': return handleSet(cmd, state, room);
    case 'combine': return handleCombine(cmd, state, items);
    case 'pray': return handlePray(state);
    case 'close': return [addText("You close it.", 'normal')];
    default:
      return [addText(spookyError(), 'error')];
  }
}

function addText(text: string, type: 'normal' | 'system' | 'error' | 'spooky' | 'important' | 'title'): GameAction {
  return { type: 'ADD_TEXT', entry: { text, type } };
}

function spookyError(): string {
  const errors = [
    "The shadows don't understand that command...",
    "A cold whisper says: 'That makes no sense here...'",
    "The mansion echoes your words back, mocking you.",
    "Nothing happens. The darkness watches.",
    "The ghosts of Blackwood Manor are confused by your request.",
    "An unseen force prevents that action.",
    "The walls creak disapprovingly.",
  ];
  return errors[Math.floor(Math.random() * errors.length)];
}

// --- GO ---
function handleGo(cmd: ParsedCommand, state: GameState, room: Room, rooms: Record<string, Room>): CommandResult {
  if (!cmd.noun) return [addText('Go where? Specify a direction (north, south, east, west, up, down).', 'system')];

  const exit = room.exits.find(e =>
    e.direction === cmd.noun || e.roomId === cmd.noun
  );

  if (!exit) return [addText(`You can't go ${cmd.noun} from here.`, 'normal')];
  if (exit.hidden && !state.flags[exit.requiredFlag || '']) return [addText(`You can't go ${cmd.noun} from here.`, 'normal')];

  if (exit.locked) {
    if (exit.requiredItem && hasItem(state, exit.requiredItem)) {
      const actions: CommandResult = [
        addText(`You use the ${exit.requiredItem} to unlock the way ${cmd.noun}.`, 'normal'),
      ];
      return [...actions, ...moveToRoom(exit.roomId, state, rooms)];
    }
    if (exit.requiredFlag && state.flags[exit.requiredFlag]) {
      return moveToRoom(exit.roomId, state, rooms);
    }
    return [addText(exit.lockMessage || 'The way is locked.', 'normal')];
  }

  // Check NPC blocking
  const blocker = room.npcs.find(npc => npc.blocksExit === cmd.noun && !state.flags[npc.appeaseFlag || '']);
  if (blocker) {
    return [addText(`${blocker.name} blocks your path! You'll need to deal with them first.`, 'spooky')];
  }

  return moveToRoom(exit.roomId, state, rooms);
}

function moveToRoom(roomId: string, state: GameState, rooms: Record<string, Room>): CommandResult {
  const newRoom = rooms[roomId];
  if (!newRoom) return [addText('That room seems to have vanished from reality...', 'error')];

  const actions: CommandResult = [
    { type: 'MOVE_TO', roomId },
    { type: 'INCREMENT_MOVES' },
  ];

  // Dark room check
  if (newRoom.dark && !hasItem(state, 'flashlight') && !state.flags['has-light']) {
    actions.push(addText(`\n--- ${newRoom.name.toUpperCase()} ---`, 'title'));
    actions.push(addText('It is pitch black. You are likely to be eaten by something lurking in the dark.', 'spooky'));
  } else {
    actions.push(...describeRoom(newRoom, state));
  }

  // Process room events
  const eventActions = processRoomEvents(newRoom, state);
  actions.push(...eventActions);

  return actions;
}

function describeRoom(room: Room, state: GameState): CommandResult {
  const actions: CommandResult = [];
  const visited = state.visitedRooms.includes(room.id);

  actions.push(addText(`\n--- ${room.name.toUpperCase()} ---`, 'title'));
  actions.push(addText(visited && room.shortDescription ? room.shortDescription : room.description, 'normal'));

  // Show visible items
  const roomState = state.roomStates[room.id];
  const availableItems = room.items.filter(item => {
    if (item.hidden && (!item.revealedByFlag || !state.flags[item.revealedByFlag])) return false;
    if (roomState?.itemsTaken.includes(item.id)) return false;
    return true;
  });
  // Include dropped items
  const droppedItems = roomState?.itemsDropped || [];

  if (availableItems.length > 0 || droppedItems.length > 0) {
    const itemNames = [
      ...availableItems.map(i => i.name),
      ...droppedItems,
    ];
    actions.push(addText(`You can see: ${itemNames.join(', ')}`, 'normal'));
  }

  // Show visible NPCs
  const visibleNpcs = room.npcs.filter(npc => !npc.requiredFlag || state.flags[npc.requiredFlag]);
  for (const npc of visibleNpcs) {
    actions.push(addText(npc.description, 'spooky'));
  }

  // Show exits
  const visibleExits = room.exits.filter(e => !e.hidden || (e.requiredFlag && state.flags[e.requiredFlag]));
  const exitDirs = visibleExits.map(e => e.direction.toUpperCase());
  if (exitDirs.length > 0) {
    actions.push(addText(`Exits: ${exitDirs.join(', ')}`, 'system'));
  }

  return actions;
}

// --- LOOK ---
function handleLook(cmd: ParsedCommand, state: GameState, room: Room, items: Record<string, Item>): CommandResult {
  if (!cmd.noun) {
    return describeRoom(room, state);
  }

  // Look at room item
  const roomState = state.roomStates[state.currentRoom];
  const roomItem = room.items.find(i =>
    (i.name.toLowerCase().includes(cmd.noun) || i.id === cmd.noun) &&
    (!roomState || !roomState.itemsTaken.includes(i.id))
  );
  if (roomItem) {
    return [addText(roomItem.examineText || roomItem.description, 'normal')];
  }

  // Look at inventory item
  const invItemId = state.inventory.find(id => {
    const item = items[id];
    return item && (item.name.toLowerCase().includes(cmd.noun) || id === cmd.noun);
  });
  if (invItemId) {
    const item = items[invItemId];
    return [addText(item.description, 'normal')];
  }

  // Look at NPC
  const npc = room.npcs.find(n => n.name.toLowerCase().includes(cmd.noun));
  if (npc) {
    return [addText(npc.description, 'normal')];
  }

  // Check room's onExamine
  if (room.onExamine) {
    for (const [key, text] of Object.entries(room.onExamine)) {
      if (cmd.noun.includes(key.toLowerCase())) {
        return [addText(text, 'normal')];
      }
    }
  }

  return [addText(`You don't see any "${cmd.noun}" here.`, 'normal')];
}

// --- TAKE ---
function handleTake(cmd: ParsedCommand, state: GameState, room: Room): CommandResult {
  if (!cmd.noun) return [addText('Take what?', 'system')];

  const roomState = state.roomStates[state.currentRoom];
  const item = room.items.find(i =>
    (i.name.toLowerCase().includes(cmd.noun) || i.id === cmd.noun) &&
    (!roomState || !roomState.itemsTaken.includes(i.id))
  );

  if (!item) return [addText(`You don't see a "${cmd.noun}" here to take.`, 'normal')];
  if (item.hidden && (!item.revealedByFlag || !state.flags[item.revealedByFlag])) {
    return [addText(`You don't see a "${cmd.noun}" here to take.`, 'normal')];
  }
  if (!item.takeable) return [addText(`You can't take the ${item.name}.`, 'normal')];

  return [
    { type: 'TAKE_ITEM', itemId: item.id },
    addText(`Taken: ${item.name}`, 'important'),
  ];
}

// --- DROP ---
function handleDrop(cmd: ParsedCommand, state: GameState, room: Room, items: Record<string, Item>): CommandResult {
  if (!cmd.noun) return [addText('Drop what?', 'system')];

  const itemId = state.inventory.find(id => {
    const item = items[id];
    return item && (item.name.toLowerCase().includes(cmd.noun) || id === cmd.noun);
  });

  if (!itemId) return [addText(`You're not carrying a "${cmd.noun}".`, 'normal')];

  return [
    { type: 'DROP_ITEM', itemId },
    addText(`Dropped: ${items[itemId].name}`, 'normal'),
  ];
}

// --- USE ---
function handleUse(cmd: ParsedCommand, state: GameState, room: Room, items: Record<string, Item>): CommandResult {
  if (!cmd.noun) return [addText('Use what?', 'system')];

  const itemId = state.inventory.find(id => {
    const item = items[id];
    return item && (item.name.toLowerCase().includes(cmd.noun) || id === cmd.noun);
  });

  if (!itemId) return [addText(`You don't have a "${cmd.noun}".`, 'normal')];

  const item = items[itemId];
  const target = cmd.target || cmd.preposition;

  // Use with target
  if (target && item.useWith) {
    const useResult = Object.entries(item.useWith).find(([key]) =>
      target.includes(key.toLowerCase())
    );
    if (useResult) {
      const [, result] = useResult;
      const actions: CommandResult = [addText(result.message, 'normal')];
      if (result.setsFlag) actions.push({ type: 'SET_FLAG', flag: result.setsFlag });
      if (result.removesItem) actions.push({ type: 'REMOVE_INVENTORY', itemId });
      if (result.givesItem) actions.push({ type: 'ADD_INVENTORY', itemId: result.givesItem });
      if (result.damage) actions.push({ type: 'DAMAGE', amount: result.damage });
      if (result.teleport) actions.push({ type: 'MOVE_TO', roomId: result.teleport });
      return actions;
    }
  }

  // Use alone
  if (item.useAlone) {
    const result = item.useAlone;
    const actions: CommandResult = [addText(result.message, 'normal')];
    if (result.setsFlag) actions.push({ type: 'SET_FLAG', flag: result.setsFlag });
    if (result.removesItem) actions.push({ type: 'REMOVE_INVENTORY', itemId });
    if (result.givesItem) actions.push({ type: 'ADD_INVENTORY', itemId: result.givesItem });
    return actions;
  }

  return [addText(`You're not sure how to use the ${item.name} right now.`, 'normal')];
}

// --- OPEN ---
function handleOpen(cmd: ParsedCommand, state: GameState, room: Room, items: Record<string, Item>): CommandResult {
  if (!cmd.noun) return [addText('Open what?', 'system')];

  // Check room examine entries for openable things
  if (room.onExamine) {
    for (const [key, text] of Object.entries(room.onExamine)) {
      if (cmd.noun.includes(key.toLowerCase()) && key.includes('open')) {
        return [addText(text, 'normal')];
      }
    }
  }

  // Check exits
  const exit = room.exits.find(e => cmd.noun.includes(e.direction));
  if (exit && exit.locked) {
    if (exit.requiredItem && hasItem(state, exit.requiredItem)) {
      return [addText(`You unlock the way with the ${exit.requiredItem}.`, 'normal')];
    }
    return [addText(exit.lockMessage || "It's locked.", 'normal')];
  }

  return [addText(`You can't open that.`, 'normal')];
}

// --- READ ---
function handleRead(cmd: ParsedCommand, state: GameState, items: Record<string, Item>, room: Room): CommandResult {
  if (!cmd.noun) return [addText('Read what?', 'system')];

  // Check inventory items first
  const itemId = state.inventory.find(id => {
    const item = items[id];
    return item && (item.name.toLowerCase().includes(cmd.noun) || id === cmd.noun);
  });

  if (itemId && items[itemId].readText) {
    return [addText(items[itemId].readText!, 'normal')];
  }

  // Check room items (for non-takeable items or items with readText defined on room object)
  const roomState = state.roomStates[state.currentRoom];
  const roomItem = room.items.find(i =>
    (i.name.toLowerCase().includes(cmd.noun) || i.id === cmd.noun) &&
    (!roomState || !roomState.itemsTaken.includes(i.id))
  );
  if (roomItem?.readText) {
    return [addText(roomItem.readText, 'normal')];
  }

  if (itemId) return [addText(`There's nothing to read on the ${items[itemId].name}.`, 'normal')];
  if (roomItem) return [addText(`There's nothing to read on the ${roomItem.name}.`, 'normal')];
  return [addText(`You don't see anything like "${cmd.noun}" to read.`, 'normal')];
}

// --- TALK ---
function handleTalk(cmd: ParsedCommand, state: GameState, room: Room): CommandResult {
  if (!cmd.noun) return [addText('Talk to whom?', 'system')];

  const npc = room.npcs.find(n =>
    n.name.toLowerCase().includes(cmd.noun) ||
    n.description.toLowerCase().includes(cmd.noun)
  );
  if (!npc) return [addText('There is nobody here by that name.', 'normal')];

  if (npc.requiredFlag && !state.flags[npc.requiredFlag]) {
    return [addText('There is nobody here by that name.', 'normal')];
  }

  const actions: CommandResult = [];
  // Find the most specific matching dialogue line (conditional lines take priority)
  const conditionalMatch = npc.dialogue.find(line => line.condition && state.flags[line.condition]);
  const unconditionalMatch = npc.dialogue.find(line => !line.condition);
  const bestMatch = conditionalMatch || unconditionalMatch;

  if (bestMatch) {
    actions.push(addText(`${npc.name}: "${bestMatch.text}"`, 'spooky'));
    if (bestMatch.setsFlag) actions.push({ type: 'SET_FLAG', flag: bestMatch.setsFlag });
    if (bestMatch.givesItem) {
      actions.push({ type: 'ADD_INVENTORY', itemId: bestMatch.givesItem });
      actions.push(addText(`${npc.name} gives you something...`, 'important'));
    }
  }

  if (actions.length === 0) {
    actions.push(addText(`${npc.name} stares at you silently.`, 'spooky'));
  }

  return actions;
}

// --- INVENTORY ---
function handleInventory(state: GameState, items: Record<string, Item>): CommandResult {
  if (state.inventory.length === 0) {
    return [addText('You are empty-handed.', 'normal')];
  }

  const itemList = state.inventory.map(id => {
    const item = items[id];
    return item ? `  - ${item.name}` : `  - ${id}`;
  }).join('\n');

  return [addText(`You are carrying:\n${itemList}`, 'normal')];
}

// --- HELP ---
function handleHelp(): CommandResult {
  return [addText(
    `COMMANDS:
  go <direction>  - Move (n/s/e/w/up/down/ne/nw/se/sw)
  look            - Describe your surroundings
  look at <thing> - Examine something closely
  take <item>     - Pick up an item
  drop <item>     - Drop an item
  use <item>      - Use an item
  use <item> on <target> - Use item on something
  combine <x> with <y>  - Combine two items
  open <thing>    - Open a door, chest, etc.
  read <item>     - Read text on an item
  talk to <name>  - Talk to someone
  push/pull/turn <thing> - Interact with objects
  play <thing>    - Play an instrument or music box
  light <item>    - Light a candle or lamp
  ring <item>     - Ring a bell
  set <thing> to <value> - Set a dial or mechanism
  pray            - Pray (try it in holy places)
  wait (z)        - Wait and listen
  inventory (i)   - Check your belongings
  save / load     - Save or restore your game
  restart         - Start a new game
  help (?)        - Show this list

TIPS: Try examining everything. The dead have secrets to share.`,
    'system'
  )];
}

// --- SAVE/LOAD ---
function handleSave(state: GameState): CommandResult {
  if (typeof window !== 'undefined') {
    localStorage.setItem('blackwood-manor-save', JSON.stringify(state));
    return [addText('Game saved. The manor remembers...', 'system')];
  }
  return [addText('Cannot save in this environment.', 'error')];
}

function handleLoad(): CommandResult {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('blackwood-manor-save');
    if (saved) {
      try {
        const loadedState = JSON.parse(saved) as GameState;
        return [
          { type: 'LOAD_STATE', state: loadedState },
          addText('Game restored. You are back where you left off...', 'system'),
        ];
      } catch {
        return [addText('The save file is corrupted. The manor has consumed it.', 'error')];
      }
    }
    return [addText('No save file found.', 'system')];
  }
  return [addText('Cannot load in this environment.', 'error')];
}

// --- WAIT ---
function handleWait(): CommandResult {
  const messages = [
    'Time passes... The shadows grow longer.',
    'You wait. Something scratches inside the walls.',
    'A moment passes. Was that a whisper?',
    'You stand still. The house breathes around you.',
    'Seconds tick by. The temperature drops slightly.',
  ];
  return [
    addText(messages[Math.floor(Math.random() * messages.length)], 'spooky'),
    { type: 'INCREMENT_MOVES' },
  ];
}

// --- INTERACT (push/pull/turn) ---
function handleInteract(cmd: ParsedCommand, state: GameState, room: Room): CommandResult {
  if (!cmd.noun) return [addText(`${cmd.verb} what?`, 'system')];

  if (room.onExamine) {
    const key = Object.keys(room.onExamine).find(k =>
      cmd.noun.includes(k.toLowerCase())
    );
    if (key) return [addText(room.onExamine[key], 'normal')];
  }

  return [addText(`You ${cmd.verb} the ${cmd.noun}, but nothing happens.`, 'normal')];
}

// --- PLAY ---
function handlePlay(cmd: ParsedCommand, state: GameState, room: Room, items: Record<string, Item>): CommandResult {
  if (!cmd.noun) return [addText('Play what?', 'system')];

  if (cmd.noun.includes('music box') && hasItem(state, 'music-box-wound')) {
    if (state.currentRoom === 'childrens-room') {
      return [
        addText('The music box plays a haunting lullaby. The ghost child laughs with delight. The floor beneath the rocking horse slides open, revealing a hidden passage leading down!', 'spooky'),
        { type: 'SET_FLAG', flag: 'chapel-revealed' },
      ];
    }
    return [addText('The music box plays a haunting melody. Beautiful, but nothing happens here.', 'normal')];
  }

  if (cmd.noun.includes('piano') && state.currentRoom === 'ballroom') {
    return [addText('You press a few keys. Discordant notes echo through the empty ballroom. For a moment, you see ghostly dancers waltzing...', 'spooky')];
  }

  return [addText(`You can't play that.`, 'normal')];
}

// --- LIGHT ---
function handleLight(cmd: ParsedCommand, state: GameState, items: Record<string, Item>): CommandResult {
  if (cmd.noun.includes('candle') && hasItem(state, 'ritual-candle')) {
    return [
      addText('The ritual candle flickers to life with an unnatural blue flame.', 'spooky'),
      { type: 'SET_FLAG', flag: 'candle-lit' },
    ];
  }
  return [addText(`You can't light that.`, 'normal')];
}

// --- RING ---
function handleRing(cmd: ParsedCommand, state: GameState, items: Record<string, Item>): CommandResult {
  if (cmd.noun.includes('bell') && hasItem(state, 'ritual-bell')) {
    return [
      addText('The bell produces a deep, resonant tone that seems to come from everywhere at once.', 'spooky'),
      { type: 'SET_FLAG', flag: 'bell-rung' },
    ];
  }
  return [addText(`You can't ring that.`, 'normal')];
}

// --- SET ---
function handleSet(cmd: ParsedCommand, state: GameState, room: Room): CommandResult {
  if (cmd.noun.includes('clock') && state.currentRoom === 'ground-hallway') {
    if (cmd.target?.includes('midnight') || cmd.target?.includes('12')) {
      return [
        addText('You set the grandfather clock to midnight. The clock chimes twelve times, each strike shaking the floor. The clock face swings open revealing a dark passage to the northeast!', 'spooky'),
        { type: 'SET_FLAG', flag: 'clock-opened' },
      ];
    }
    return [addText('You adjust the clock hands, but nothing happens. What time should it be set to?', 'normal')];
  }
  return [addText(`You can't set that.`, 'normal')];
}

// --- COMBINE ---
function handleCombine(cmd: ParsedCommand, state: GameState, items: Record<string, Item>): CommandResult {
  if (!cmd.noun || !cmd.target) return [addText('Combine what with what? (combine X with Y)', 'system')];

  const item1 = state.inventory.find(id => items[id]?.name.toLowerCase().includes(cmd.noun));
  const item2 = state.inventory.find(id => items[id]?.name.toLowerCase().includes(cmd.target!));

  if (!item1 || !item2) return [addText("You don't have both of those items.", 'normal')];

  const itemDef = items[item1];
  if (itemDef.combinable?.includes(item2) && itemDef.combineResult) {
    return [
      addText(`You combine the ${items[item1].name} with the ${items[item2].name}...`, 'normal'),
      { type: 'REMOVE_INVENTORY', itemId: item1 },
      { type: 'REMOVE_INVENTORY', itemId: item2 },
      { type: 'ADD_INVENTORY', itemId: itemDef.combineResult },
      addText(`Created: ${items[itemDef.combineResult]?.name || itemDef.combineResult}!`, 'important'),
    ];
  }

  return [addText("Those items don't combine.", 'normal')];
}

// --- PRAY ---
function handlePray(state: GameState): CommandResult {
  if (state.currentRoom === 'crypt' && state.flags['candle-lit'] && state.flags['bell-rung'] && hasItem(state, 'ritual-book')) {
    return [
      addText('You kneel and recite the words from the ritual book. The candle burns bright, the bell resonates, and the ancient words fill the crypt with light. A spectral figure appears before you...', 'spooky'),
      { type: 'SET_FLAG', flag: 'ritual-complete' },
      { type: 'SET_FLAG', flag: 'spirit-freed' },
    ];
  }

  if (state.currentRoom === 'hidden-chapel') {
    return [addText('You pray in the chapel. A warm light briefly fills the room, and you feel a little better.', 'normal'), { type: 'HEAL', amount: 1 }];
  }

  return [addText('You offer a quiet prayer. The darkness seems to recede, if only slightly.', 'normal')];
}

export { describeRoom };
