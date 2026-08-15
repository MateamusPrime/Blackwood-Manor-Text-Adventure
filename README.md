# Blackwood Manor

A haunted-house text adventure that runs in the browser. A missing man, a cursed house, and 33 rooms that each get their own hand-drawn ASCII scene.

Type `START` to begin, `HELP` for the verb list, and `EXAMINE` everything.

Next.js 16, React 19, TypeScript. No game engine, no libraries beyond the framework.

---

## What it looks like

![Title screen](docs/screenshots/01-title.png)

The play view. Room art on the left changes with every room, inventory tracks below it, health and move count across the top. Rooms report their own exits, and taking something updates the panel immediately.

![Gameplay: the Grand Foyer, a taken item, and the inventory panel](docs/screenshots/02-gameplay.png)

`HELP` at any time. This is the whole verb set.

![Command list](docs/screenshots/03-commands.png)

---

## The parser

The interesting part of a text adventure is that the player types whatever they want and the game has to cope.

`engine/parser.ts` normalizes input into a `{ verb, noun, preposition, target }` shape before any game logic runs. It strips articles (`the`, `a`, `an`, `some`), maps **75 verb aliases** down to a canonical set, and handles direction shorthand, so all of these do the same thing:

```
go north      north      n
look at the painting      examine painting      inspect painting
take the rusty key        grab rusty key        pick up rusty key
```

Prepositions are parsed rather than ignored, which is what makes two-object commands work:

```
use crowbar on floorboards
combine locket with chain
set dial to 1847
```

Unknown input fails in-character rather than crashing. `take lantern` in a room with no lantern answers `You don't see a "lantern" here to take.`

## How the world is described

Rooms, items and events are data, not code. `engine/types.ts` defines the shapes and `data/` holds the content, so adding a room means adding an object, never touching the engine.

An exit can be locked, can require a specific item, can require a flag to be set, or can be hidden until something reveals it:

```ts
{ direction: 'north', roomId: 'library', locked: true,
  requiredItem: 'brass-key', lockMessage: 'The door will not budge.' }
```

Items can act alone or on a target, set flags, consume themselves, hand you something else, teleport you, or hurt you. Rooms fire events on entry that can be conditional and can be marked `once` so they never repeat.

The current build has **33 rooms, 24 items, 19 world flags, 4 NPCs with conditional dialogue, 11 hidden objects and 3 dark rooms** you need a light source to survive.

## Layout

```
engine/
  parser.ts       text -> { verb, noun, preposition, target }
  commands.ts     one handler per verb, 580 lines
  gameState.ts    reducer over a GameAction union
  events.ts       room entry events, once-firing
  types.ts        the whole data model
data/
  rooms.ts        33 rooms, exits, items, NPCs
  items.ts        24 items and their interactions
  art.ts          33 ASCII scenes
components/       GameScreen, TextOutput, CommandInput, ArtPanel, Inventory, StatusBar
hooks/
  useGame.ts      dispatches parsed commands into the reducer
  useCommandHistory.ts   arrow-key recall
```

State is a single `GameState` object moved by a reducer over a typed `GameAction` union, which is what makes `save` and `load` two lines: serialize the state, restore the state.

## Running it

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## License

Source-available for reading and evaluation. See `LICENSE`. Not open source.
