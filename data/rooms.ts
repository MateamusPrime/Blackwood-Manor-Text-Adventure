import { Room } from '../engine/types';

export const rooms: Record<string, Room> = {
  'front-porch': {
    id: 'front-porch',
    name: 'Front Porch',
    description:
      'You stand before the decaying entrance of Blackwood Manor. Iron gates hang askew behind you, and the front door looms ahead, slightly ajar. The air carries the scent of rot and forgotten years.',
    shortDescription: 'The decaying front porch of Blackwood Manor. The door looms ahead.',
    exits: [
      { direction: 'north', roomId: 'grand-foyer' },
    ],
    items: [],
    npcs: [],
    artKey: 'front-porch',
  },

  'grand-foyer': {
    id: 'grand-foyer',
    name: 'Grand Foyer',
    description:
      'A grand foyer with a cracked marble floor. A crystal chandelier hangs overhead, swaying gently despite no breeze. Dust motes dance in pale moonlight streaming through broken windows.',
    shortDescription: 'The grand foyer with its swaying chandelier and cracked marble floor.',
    exits: [
      { direction: 'south', roomId: 'front-porch' },
      { direction: 'north', roomId: 'ground-hallway' },
      { direction: 'east', roomId: 'parlor' },
      { direction: 'west', roomId: 'dining-room' },
      { direction: 'up', roomId: 'staircase-landing' },
    ],
    items: [
      {
        id: 'torn-diary-page-1',
        name: 'Torn Diary Page',
        description: 'A yellowed page torn from a diary, with faded handwriting.',
        takeable: true,
        readText:
          '"March 3rd - The children say they hear singing from the walls at night. I have dismissed the staff. We are alone now. -E.B."',
      },
    ],
    npcs: [],
    artKey: 'grand-foyer',
  },

  'parlor': {
    id: 'parlor',
    name: 'Parlor',
    description:
      'A dusty parlor with sheet-covered furniture. A fireplace dominates one wall, cold ashes spilling onto the hearth. Family portraits line the walls, their eyes seeming to follow you.',
    shortDescription: 'A dusty parlor with a cold fireplace and watchful family portraits.',
    exits: [
      { direction: 'west', roomId: 'grand-foyer' },
    ],
    items: [
      {
        id: 'jewelry-box',
        name: 'Jewelry Box',
        description: 'A small ornate jewelry box on the mantelpiece. It has a silver lock.',
        takeable: false,
        examineText: 'A delicate wooden box inlaid with silver filigree. The lock is shaped like a tiny skull. It needs a silver key.',
      },
    ],
    npcs: [],
    artKey: 'parlor',
    onExamine: {
      fireplace:
        'The fireplace is cold and dead. Soot stains climb the mantle. You notice scratch marks on the inside, as if something tried to climb out.',
      portraits:
        'The portraits show generations of the Blackwood family. The last portrait is slashed across the face.',
      'jewelry box':
        'A delicate wooden box inlaid with silver filigree. The lock is shaped like a tiny skull. It needs a silver key.',
    },
  },

  'dining-room': {
    id: 'dining-room',
    name: 'Dining Room',
    description:
      'A long dining table set for twelve. Plates of rotting food still sit undisturbed, silverware corroded green. Candelabras stand like skeletal sentries.',
    shortDescription: 'The long dining table still set for twelve, plates of rot untouched.',
    exits: [
      { direction: 'east', roomId: 'grand-foyer' },
      { direction: 'south', roomId: 'kitchen' },
    ],
    items: [
      {
        id: 'silver-key',
        name: 'Silver Key',
        description: 'An ornate silver key with a skull motif.',
        takeable: true,
        hidden: true,
        revealedByFlag: 'checked-plates',
        examineText:
          'A small silver key, cold to the touch. A tiny skull is engraved on the bow.',
      },
    ],
    npcs: [],
    artKey: 'dining-room',
    onExamine: {
      plates:
        'You examine the plates more closely. Under one of the rotting place settings, something metallic glints.',
      table:
        'The mahogany table is scarred with deep gouges, as if clawed by something inhuman.',
    },
  },

  'kitchen': {
    id: 'kitchen',
    name: 'Kitchen',
    description:
      'An industrial-era kitchen. Copper pots hang from ceiling racks, swinging slightly. The wood-burning stove is cold, but the air smells faintly of something burning.',
    shortDescription: 'The cold industrial kitchen with swinging copper pots.',
    exits: [
      { direction: 'north', roomId: 'dining-room' },
      { direction: 'east', roomId: 'pantry' },
      { direction: 'south', roomId: 'servants-quarters' },
    ],
    items: [
      {
        id: 'rusty-knife',
        name: 'Rusty Knife',
        description: 'A kitchen knife, its blade spotted with rust... or is that rust?',
        takeable: true,
      },
    ],
    npcs: [],
    artKey: 'kitchen',
  },

  'pantry': {
    id: 'pantry',
    name: 'Pantry',
    description:
      'Shelves lined with jars of preserved things you\'d rather not identify. Something squirms in one of them.',
    shortDescription: 'Shelves of unidentifiable jars. Something moves inside one.',
    exits: [
      { direction: 'west', roomId: 'kitchen' },
    ],
    items: [
      {
        id: 'ritual-candle',
        name: 'Black Candle',
        description: 'A thick black candle with strange symbols carved into the wax.',
        takeable: true,
        examineText:
          'The candle is made of black wax, carved with symbols that seem to shift when you look away. It smells of grave dirt.',
      },
    ],
    npcs: [],
    artKey: 'pantry',
  },

  'servants-quarters': {
    id: 'servants-quarters',
    name: 'Servants\' Quarters',
    description:
      'Cramped and spartan. Narrow beds line the walls, sheets still rumpled as if the occupants just left. A small music box sits on a bedside table.',
    shortDescription: 'Cramped servants\' quarters with rumpled beds and a music box.',
    exits: [
      { direction: 'north', roomId: 'kitchen' },
    ],
    items: [
      {
        id: 'music-box',
        name: 'Music Box',
        description: 'A delicate music box with a tiny ballerina inside. It needs winding.',
        takeable: true,
      },
    ],
    npcs: [
      {
        id: 'maid-ghost',
        name: 'The Maid',
        description:
          'The ghost of a maid in a grey uniform hovers near the beds, wringing her spectral hands.',
        dialogue: [
          {
            text: 'Please... find the master. He went below and never returned. The children... the children are still playing upstairs.',
            setsFlag: 'maid-talked',
          },
          {
            text: 'The ritual book is in the library. The old master used it for terrible things. And beware the clock in the hallway... at midnight, it reveals its secrets.',
            condition: 'maid-talked',
          },
          {
            text: 'You freed the spirit! Thank you... the manor may yet find peace.',
            condition: 'spirit-freed',
          },
        ],
      },
    ],
    artKey: 'servants-quarters',
  },

  'conservatory': {
    id: 'conservatory',
    name: 'Conservatory',
    description:
      'Glass walls reveal an overgrown garden outside. Dead plants fill cracked pots, but one black rose blooms impossibly in the moonlight.',
    shortDescription: 'A glass conservatory with a single impossible black rose blooming.',
    exits: [
      { direction: 'north', roomId: 'ground-hallway' },
      { direction: 'south', roomId: 'garden' },
    ],
    items: [
      {
        id: 'black-rose',
        name: 'Black Rose',
        description: 'A perfect black rose that seems to absorb light. Its petals are cold as ice.',
        takeable: true,
      },
    ],
    npcs: [],
    artKey: 'conservatory',
    onExamine: {
      garden:
        'Through the glass, you see a wild, overgrown garden bathed in moonlight. A stone path leads outside.',
      rose: 'The rose is impossibly black, as if made of shadow itself. It has no thorns.',
    },
  },

  'ballroom': {
    id: 'ballroom',
    name: 'Ballroom',
    description:
      'A vast ballroom with a checkered floor. Mirrors line the walls, but your reflection seems... delayed. A grand piano sits in the corner.',
    shortDescription: 'The vast ballroom where your reflection moves a heartbeat too slow.',
    exits: [
      { direction: 'south', roomId: 'ground-hallway' },
    ],
    items: [],
    npcs: [],
    artKey: 'ballroom',
    onExamine: {
      mirrors:
        'You look into the mirrors. Your reflection moves a heartbeat after you do. When you turn away, you could swear it stayed watching.',
      piano:
        'A dusty grand piano. Some keys are missing. The ones remaining are yellowed like old teeth.',
      floor:
        'The black and white tiles form a pattern. Some tiles are cracked, revealing darkness beneath.',
    },
  },

  'ground-hallway': {
    id: 'ground-hallway',
    name: 'Ground Floor Hallway',
    description:
      'A long corridor connecting the ground floor. A grandfather clock stands against one wall, its pendulum still. Portraits of Blackwood ancestors watch from both walls.',
    shortDescription: 'The long ground floor corridor with a stopped grandfather clock.',
    exits: [
      { direction: 'south', roomId: 'grand-foyer' },
      { direction: 'east', roomId: 'ballroom' },
      { direction: 'west', roomId: 'conservatory' },
      { direction: 'north', roomId: 'cellar-stairs' },
      { direction: 'northeast', roomId: 'clock-passage', hidden: true, requiredFlag: 'clock-opened' },
    ],
    items: [],
    npcs: [],
    artKey: 'ground-hallway',
    onExamine: {
      clock:
        'The grandfather clock shows 3:47. Its pendulum hangs motionless. The clock face looks like it could be adjusted. Scratched into the wood below the face, barely visible: "When the witching hour strikes, the way opens."',
      portraits:
        'The Blackwood ancestors stare down at you with hollow eyes. The paintings grow older as you walk north, the oldest nearly black with age.',
    },
  },

  'staircase-landing': {
    id: 'staircase-landing',
    name: 'Staircase Landing',
    description:
      'The grand staircase opens to a wide landing. The banister is carved with intertwined serpents. Moonlight pools through a stained glass window depicting an angel falling.',
    shortDescription: 'The wide landing with serpent-carved banister and fallen-angel window.',
    exits: [
      { direction: 'down', roomId: 'grand-foyer' },
      { direction: 'north', roomId: 'upper-hallway' },
      { direction: 'east', roomId: 'master-bedroom' },
      { direction: 'west', roomId: 'library' },
    ],
    items: [],
    npcs: [],
    artKey: 'staircase-landing',
  },

  'master-bedroom': {
    id: 'master-bedroom',
    name: 'Master Bedroom',
    description:
      'An opulent bedroom now draped in cobwebs. A four-poster bed dominates the room, its curtains drawn. The vanity mirror is cracked in a spider-web pattern.',
    shortDescription: 'The cobweb-draped master bedroom with its curtained four-poster bed.',
    exits: [
      { direction: 'west', roomId: 'staircase-landing' },
      { direction: 'north', roomId: 'master-bathroom' },
    ],
    items: [
      {
        id: 'music-box-key',
        name: 'Tiny Brass Key',
        description: 'A tiny brass key that might fit a small mechanism.',
        takeable: true,
        hidden: true,
        revealedByFlag: 'searched-bed',
        examineText:
          'A small brass key, delicate and old. It looks like it might wind something.',
      },
    ],
    npcs: [],
    artKey: 'master-bedroom',
    onExamine: {
      bed: 'You pull back the dusty curtains. The sheets are stained dark. Under the pillow, you find something small and metallic.',
      mirror:
        'Your reflection in the cracked mirror is distorted. For a moment, another face overlaps yours - gaunt, hollow-eyed.',
      vanity:
        'Perfume bottles and a silver brush sit on the vanity, untouched for decades. A layer of dust covers everything.',
    },
  },

  'master-bathroom': {
    id: 'master-bathroom',
    name: 'Master Bathroom',
    description:
      'Black and white tile, a clawfoot tub stained with something dark. The medicine cabinet mirror is intact, unlike the bedroom\'s.',
    shortDescription: 'The black and white tiled bathroom with its stained clawfoot tub.',
    exits: [
      { direction: 'south', roomId: 'master-bedroom' },
    ],
    items: [
      {
        id: 'torn-diary-page-2',
        name: 'Torn Diary Page',
        description: 'Another torn diary page, water-stained but legible.',
        takeable: true,
        readText:
          '"June 15th - I found the book in the cellar. The rituals described within are beyond comprehension. Eleanor begs me to stop but I am so close to understanding. -E.B."',
      },
    ],
    npcs: [],
    artKey: 'master-bathroom',
    onExamine: {
      tub: 'The dark stains in the tub look disturbingly like dried blood. You prefer not to look too closely.',
      cabinet:
        'The medicine cabinet contains empty pill bottles and a razor. Nothing useful.',
    },
  },

  'childrens-room': {
    id: 'childrens-room',
    name: 'Children\'s Room',
    description:
      'Twin beds with faded quilts. Wooden toys litter the floor - blocks, a rocking horse, tin soldiers. The wallpaper shows nursery rhymes, but the figures in them have been scratched out.',
    shortDescription: 'The children\'s room with scattered toys and scratched-out nursery figures.',
    exits: [
      { direction: 'south', roomId: 'upper-hallway' },
      { direction: 'down', roomId: 'hidden-chapel', hidden: true, requiredFlag: 'chapel-revealed' },
    ],
    items: [
      {
        id: 'torn-diary-page-3',
        name: 'Torn Diary Page',
        description: 'A diary page stuffed inside a toy chest.',
        takeable: true,
        hidden: true,
        revealedByFlag: 'child-talked',
        readText:
          '"October 31st - Tonight I complete the ritual. The entity promises eternal life. The children must not know. Eleanor has locked herself in the chapel, praying. Foolish woman. -E.B."',
      },
    ],
    npcs: [
      {
        id: 'child-ghost',
        name: 'The Child',
        description:
          'The ghost of a child sits on the floor, playing with phantom blocks. It looks up at you with curious, empty eyes.',
        dialogue: [
          {
            text: 'Will you play with me? Nobody plays with me anymore. The man in the basement took Father away.',
            setsFlag: 'child-talked',
          },
          {
            text: 'The music box plays our song! Wind it up with the little key and play it in our room, and I will show you a secret!',
            condition: 'has-music-box-wound',
          },
          {
            text: 'You found the secret! The chapel is where the bad things happened. Be careful...',
            condition: 'chapel-revealed',
          },
        ],
      },
    ],
    artKey: 'childrens-room',
  },

  'guest-bedroom': {
    id: 'guest-bedroom',
    name: 'Guest Bedroom',
    description:
      'A modest guest room. The bed is untouched, perfectly made. A fine layer of dust suggests no one has stayed here in years. The window offers a view of the overgrown garden below.',
    shortDescription: 'An untouched guest bedroom overlooking the overgrown garden.',
    exits: [
      { direction: 'south', roomId: 'upper-hallway' },
    ],
    items: [
      {
        id: 'old-photograph',
        name: 'Old Photograph',
        description:
          'A faded photograph of the Blackwood family - parents and twin children - standing in front of the manor. Everyone is smiling except the father, whose eyes seem to stare right through the camera.',
        takeable: true,
      },
    ],
    npcs: [],
    artKey: 'guest-bedroom',
  },

  'study': {
    id: 'study',
    name: 'Study',
    description:
      'A private study with a leather-topped desk. Papers are scattered everywhere - equations, star charts, occult diagrams. A safe sits in the corner, locked.',
    shortDescription: 'The private study scattered with occult papers and a locked safe.',
    exits: [
      { direction: 'east', roomId: 'upper-hallway' },
    ],
    items: [
      {
        id: 'star-chart',
        name: 'Star Chart',
        description:
          'A hand-drawn chart of constellations with dates marked. October 31st is circled in red.',
        takeable: true,
      },
    ],
    npcs: [],
    artKey: 'study',
    onExamine: {
      desk: 'The desk is covered in frantic scribbling - mathematical formulas mixed with occult symbols. The handwriting grows more erratic toward the edges.',
      safe: 'A small iron safe with a combination lock. You would need to know the combination.',
      papers:
        'Among the papers you find references to "The Binding" and "The Entity Beyond". Whoever wrote these was obsessed.',
    },
  },

  'library': {
    id: 'library',
    name: 'Library',
    description:
      'Floor-to-ceiling bookshelves stuffed with ancient tomes. A reading desk sits by the window. The smell of old paper and leather fills the air. A section of bookshelf looks oddly different from the rest.',
    shortDescription: 'The library crammed with ancient tomes and one suspicious bookshelf section.',
    exits: [
      { direction: 'east', roomId: 'staircase-landing' },
      { direction: 'north', roomId: 'secret-passage', hidden: true, requiredFlag: 'bookshelf-moved' },
    ],
    items: [
      {
        id: 'ritual-book',
        name: 'Ritual Book',
        description:
          'A heavy tome bound in dark leather with no title. Its pages are filled with incantations and diagrams.',
        takeable: true,
        hidden: true,
        revealedByFlag: 'diary-assembled',
        readText:
          '"The Binding of Azaroth - To banish the entity, one must perform the counter-ritual in the place of summoning with the three sacred instruments: the Bell of Clarity, the Candle of Truth, and this Book of Binding. Speak the words while all three are present."',
      },
    ],
    npcs: [],
    artKey: 'library',
    onExamine: {
      bookshelf:
        'Most books are mundane - history, fiction, philosophy. One section of the shelf seems newer than the rest, the wood a slightly different shade. It might move...',
      desk: 'A reading desk with a magnifying glass. There are indentations where a large book once sat.',
    },
  },

  'upper-hallway': {
    id: 'upper-hallway',
    name: 'Upper Hallway',
    description:
      'A long upper corridor with doors on both sides. The carpet runner is worn thin. Gas lamps flicker with impossible blue flame.',
    shortDescription: 'The upper corridor with blue-flamed gas lamps flickering eerily.',
    exits: [
      { direction: 'south', roomId: 'staircase-landing' },
      { direction: 'east', roomId: 'childrens-room' },
      { direction: 'west', roomId: 'study' },
      { direction: 'north', roomId: 'guest-bedroom' },
      { direction: 'up', roomId: 'attic-stairs' },
      { direction: 'northeast', roomId: 'balcony' },
      { direction: 'northwest', roomId: 'mirror-room', hidden: true, requiredFlag: 'portrait-order' },
    ],
    items: [
      {
        id: 'ritual-bell',
        name: 'Silver Bell',
        description: 'A small silver bell engraved with protective symbols.',
        takeable: true,
        examineText:
          'The bell is surprisingly heavy for its size. The symbols engraved on it seem to glow faintly in dim light.',
      },
    ],
    npcs: [],
    artKey: 'upper-hallway',
    onExamine: {
      portraits:
        'Three portraits hang here: a woman in white, a man in black, and twin children. The woman seems to be looking at the man, but as you watch, her gaze shifts to the children...',
      woman:
        'The woman in white has kind eyes but a sorrowful expression. She seems to be looking toward the children\'s portrait...',
      children:
        'Twin children with matching curls and matching smiles. Their eyes seem to follow you, but they gaze most intently at the man in black...',
      man:
        'The man in black has hollow cheeks and feverish eyes. His hand rests on an open book. Something about his stare makes you deeply uneasy.',
    },
  },

  'balcony': {
    id: 'balcony',
    name: 'Balcony',
    description:
      'A stone balcony overlooking the grounds. The iron railing is rusted through in places. Below, the garden is a maze of overgrown hedges. The moon seems unnaturally large.',
    shortDescription: 'The crumbling stone balcony under an unnaturally large moon.',
    exits: [
      { direction: 'southwest', roomId: 'upper-hallway' },
    ],
    items: [],
    npcs: [],
    artKey: 'balcony',
    onExamine: {
      garden:
        'From up here you can see the garden is actually laid out in a strange pattern - is that a pentagram?',
      moon: 'The moon is full and seems to pulse with a sickly yellow light. You feel watched.',
      railing: 'The railing is barely holding together. Not safe to lean on.',
    },
  },

  'secret-passage': {
    id: 'secret-passage',
    name: 'Secret Passage',
    description:
      'A narrow passage between walls, thick with cobwebs. The air is stale and suffocating. You can hear the house breathing around you.',
    shortDescription: 'A narrow cobwebbed passage between walls. The house seems to breathe.',
    exits: [
      { direction: 'south', roomId: 'library' },
      { direction: 'north', roomId: 'hidden-chapel' },
    ],
    items: [],
    npcs: [],
    artKey: 'secret-passage',
    dark: true,
  },

  'cellar-stairs': {
    id: 'cellar-stairs',
    name: 'Cellar Stairs',
    description:
      'Stone steps descend into darkness. The air grows cold and damp. Water drips somewhere below.',
    shortDescription: 'Stone steps descending into cold, dripping darkness.',
    exits: [
      { direction: 'south', roomId: 'ground-hallway' },
      { direction: 'down', roomId: 'wine-cellar' },
    ],
    items: [],
    npcs: [],
    artKey: 'cellar-stairs',
    dark: true,
  },

  'wine-cellar': {
    id: 'wine-cellar',
    name: 'Wine Cellar',
    description:
      'Rows of dusty wine bottles in wooden racks. Many are broken, their contents staining the stone floor dark red. Or is that wine?',
    shortDescription: 'Wine racks and dark stains that may not be wine on the stone floor.',
    exits: [
      { direction: 'up', roomId: 'cellar-stairs' },
      { direction: 'north', roomId: 'dungeon' },
    ],
    items: [
      {
        id: 'wine-bottle',
        name: 'Old Wine Bottle',
        description: 'A bottle of wine from 1889. Still sealed.',
        takeable: true,
      },
    ],
    npcs: [],
    artKey: 'wine-cellar',
  },

  'dungeon': {
    id: 'dungeon',
    name: 'Dungeon',
    description:
      'What was once a storage room has been converted into something else entirely. Iron rings are set into the walls. The floor has a large circle painted on it.',
    shortDescription: 'A converted dungeon with iron wall rings and a painted ritual circle.',
    exits: [
      { direction: 'south', roomId: 'wine-cellar' },
      { direction: 'north', roomId: 'underground-tunnel' },
    ],
    items: [],
    npcs: [],
    artKey: 'dungeon',
    onExamine: {
      circle:
        'A ritual circle painted in what you hope is red paint. Symbols are drawn at cardinal points. This is where it happened.',
      rings:
        'Iron rings bolted to the stone walls. Chains dangle from some of them. You shudder to think of their purpose.',
    },
  },

  'underground-tunnel': {
    id: 'underground-tunnel',
    name: 'Underground Tunnel',
    description:
      'A rough-hewn tunnel carved through rock. It slopes downward. Strange phosphorescent moss provides faint, sickly green light.',
    shortDescription: 'A rough tunnel lit by sickly phosphorescent moss, sloping downward.',
    exits: [
      { direction: 'south', roomId: 'dungeon' },
      { direction: 'north', roomId: 'crypt' },
    ],
    items: [],
    npcs: [],
    artKey: 'underground-tunnel',
    dark: true,
  },

  'crypt': {
    id: 'crypt',
    name: 'Crypt',
    description:
      'A stone crypt beneath the manor. Stone coffins line the walls, each bearing a Blackwood name. At the center, a raised platform holds a larger sarcophagus.',
    shortDescription: 'The Blackwood family crypt with stone coffins and a central sarcophagus.',
    exits: [
      { direction: 'south', roomId: 'underground-tunnel' },
      { direction: 'north', roomId: 'final-chamber', hidden: true, locked: true, requiredFlag: 'has-crypt-key', requiredItem: 'crypt-key', lockMessage: 'A massive stone door blocks the way north. It has an ancient iron lock.' },
    ],
    items: [
      {
        id: 'torn-diary-page-4',
        name: 'Final Diary Page',
        description: 'The last diary page, crumpled and stained.',
        takeable: true,
        hidden: true,
        revealedByFlag: 'ritual-complete',
        readText:
          '"I was wrong. The entity cannot be controlled. It consumed Eleanor first, then the children fled upstairs. I am sealing myself in the crypt. If you find this, do not open the Final Chamber. Let it sleep. God forgive me. -Edmund Blackwood"',
      },
    ],
    npcs: [
      {
        id: 'former-owner',
        name: 'The Former Owner',
        description:
          'The ghost of the former owner hovers before the northern wall, radiating malice and despair.',
        blocksExit: 'north',
        appeaseFlag: 'spirit-freed',
        dialogue: [
          {
            text: 'LEAVE THIS PLACE! You know not what sleeps beyond!',
            setsFlag: 'owner-warned',
          },
          {
            text: 'You... you freed me from the binding? The entity... it is in the Final Chamber. You must banish it, or it will consume everything. Take the key...',
            condition: 'spirit-freed',
            givesItem: 'crypt-key',
            setsFlag: 'has-crypt-key',
          },
        ],
      },
    ],
    artKey: 'crypt',
  },

  'attic-stairs': {
    id: 'attic-stairs',
    name: 'Attic Stairs',
    description:
      'Narrow, creaking stairs lead up into the attic. Each step groans under your weight. Cobwebs thick as curtains bar the way upward.',
    shortDescription: 'Narrow, groaning stairs leading up through curtains of cobwebs.',
    exits: [
      { direction: 'down', roomId: 'upper-hallway' },
      { direction: 'up', roomId: 'attic' },
    ],
    items: [],
    npcs: [],
    artKey: 'attic-stairs',
    onExamine: {
      cobwebs:
        'Thick, grey cobwebs stretch across the stairway like a curtain. You could cut through them with something sharp.',
    },
  },

  'attic': {
    id: 'attic',
    name: 'Attic',
    description:
      'A cluttered attic full of forgotten things - steamer trunks, dress forms, old furniture. Dust swirls in shafts of moonlight from a cracked skylight.',
    shortDescription: 'A cluttered attic with dust-swirling moonlight from a cracked skylight.',
    exits: [
      { direction: 'down', roomId: 'attic-stairs' },
      { direction: 'north', roomId: 'tower-room' },
    ],
    items: [
      {
        id: 'old-journal',
        name: 'Old Journal',
        description: 'A leather-bound journal belonging to Eleanor Blackwood.',
        takeable: true,
        readText:
          '"Edmund has changed. The book he found in the cellar has consumed him. He speaks of an entity that promises immortality. I have hidden the bell upstairs and the candle in the pantry. He must not complete the ritual. I will pray in the chapel for our deliverance."',
      },
    ],
    npcs: [],
    artKey: 'attic',
  },

  'tower-room': {
    id: 'tower-room',
    name: 'Tower Room',
    description:
      'A circular room at the top of a tower. Windows on all sides offer a panoramic view of the moonlit grounds. An old telescope points at the sky.',
    shortDescription: 'A circular tower room with panoramic views and an old telescope.',
    exits: [
      { direction: 'south', roomId: 'attic' },
    ],
    items: [],
    npcs: [],
    artKey: 'tower-room',
    onExamine: {
      telescope:
        'Through the telescope, you see the garden from above - it is definitely a pentagram shape. Beyond the grounds, the road you came on has... vanished.',
      window:
        'From here you can see for miles. Or you should be able to. Beyond the manor grounds, there is only fog. Dense, impenetrable fog.',
    },
  },

  'hidden-chapel': {
    id: 'hidden-chapel',
    name: 'Hidden Chapel',
    description:
      'A small chapel hidden between the walls. Pews face a simple altar with a cross. Despite the decay elsewhere, this room feels... peaceful. Holy.',
    shortDescription: 'A small hidden chapel that feels peaceful despite the manor\'s decay.',
    exits: [
      { direction: 'south', roomId: 'secret-passage' },
      { direction: 'up', roomId: 'childrens-room' },
    ],
    items: [],
    npcs: [],
    artKey: 'hidden-chapel',
    onEnter: [
      {
        type: 'message',
        message: 'A warm light seems to emanate from the altar. You feel safer here.',
        once: true,
        eventId: 'chapel-peace',
      },
    ],
    onExamine: {
      altar: 'The altar holds a simple wooden cross and dried flowers. Someone prayed here often.',
      pews: 'Worn pews for perhaps a dozen people. Hymnals sit in the racks, their pages yellowed but intact.',
    },
  },

  'final-chamber': {
    id: 'final-chamber',
    name: 'Final Chamber',
    description:
      'A vast underground chamber carved from living rock. At its center, a stone platform pulses with dark energy. The air crackles with otherworldly power. Something waits here...',
    shortDescription: 'A vast chamber of dark power. The entity stirs at the center.',
    exits: [
      { direction: 'south', roomId: 'crypt' },
    ],
    items: [],
    npcs: [
      {
        id: 'entity',
        name: 'The Entity',
        description:
          'A shapeless darkness coils above the stone platform. Eyes that are not eyes regard you from within the void. This is what Edmund Blackwood summoned. This is what must be banished.',
        dialogue: [
          {
            text: 'YOU DARE FACE ME? I HAVE DEVOURED THE BLACKWOODS. I WILL DEVOUR YOU.',
            setsFlag: 'entity-encountered',
          },
          {
            text: 'NO! THE BINDING... THE WORDS... IMPOSSIBLE!',
            condition: 'ritual-complete',
          },
        ],
      },
    ],
    artKey: 'final-chamber',
    onEnter: [
      {
        type: 'message',
        message: 'The temperature plummets. Reality itself seems to bend around the dark presence in this chamber.',
        once: true,
        eventId: 'final-chamber-enter',
      },
      {
        type: 'damage',
        amount: 1,
        message: 'The entity\'s presence tears at your sanity...',
        notCondition: 'ritual-complete',
        eventId: 'entity-damage',
      },
    ],
  },

  'mirror-room': {
    id: 'mirror-room',
    name: 'Mirror Room',
    description:
      'You step through the mirror into a reversed version of the upper hallway. Everything is backwards - text, paintings, even gravity feels slightly wrong.',
    shortDescription: 'A mirror-reversed hallway where everything is subtly, wrongly backwards.',
    exits: [
      { direction: 'southeast', roomId: 'upper-hallway' },
    ],
    items: [
      {
        id: 'mirror-shard',
        name: 'Mirror Shard',
        description: 'A shard of enchanted mirror that shows things as they truly are.',
        takeable: true,
        examineText:
          'Looking into the shard, you see the manor as it once was - beautiful, alive, full of light. Then the vision darkens.',
      },
    ],
    npcs: [],
    artKey: 'mirror-room',
  },

  'clock-passage': {
    id: 'clock-passage',
    name: 'Clock Passage',
    description:
      'Behind the grandfather clock, a narrow passage leads to a hidden room. Old brick walls are covered in scratched tally marks - someone was counting days.',
    shortDescription: 'A hidden passage behind the clock, walls scratched with desperate tally marks.',
    exits: [
      { direction: 'southwest', roomId: 'ground-hallway' },
    ],
    items: [
      {
        id: 'combination-note',
        name: 'Scrawled Note',
        description: 'A note scratched into the wall.',
        takeable: false,
        readText: '"The safe combination is the date it all began - 10-31-89"',
        examineText: 'Numbers scratched desperately into brick: 10-31-89',
      },
    ],
    npcs: [],
    artKey: 'clock-passage',
  },

  'garden': {
    id: 'garden',
    name: 'Garden',
    description:
      'An overgrown garden under the moonlight. Stone paths wind between dead hedges. At the center stands a stone angel, weeping. From above, this garden forms a pentagram.',
    shortDescription: 'The overgrown garden with its weeping stone angel at the pentagram\'s heart.',
    exits: [
      { direction: 'north', roomId: 'conservatory' },
    ],
    items: [
      {
        id: 'angel-tears',
        name: 'Angel Tears',
        description: 'Crystallized drops from the weeping angel statue. They glow with faint warmth.',
        takeable: true,
        hidden: true,
        revealedByFlag: 'angel-appeased',
      },
    ],
    npcs: [],
    artKey: 'garden',
    onExamine: {
      angel:
        'The stone angel weeps real tears that crystallize as they fall. Its expression is one of profound sorrow.',
      hedges:
        'The hedges form a pattern. From ground level you can barely tell, but the paths between them feel purposeful.',
    },
  },
};
