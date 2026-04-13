import { Item } from '../engine/types';

export const items: Record<string, Item> = {
  'flashlight': {
    id: 'flashlight',
    name: 'Heavy-Duty Flashlight',
    description: 'A heavy-duty flashlight. The beam cuts through the darkness.',
    useAlone: {
      message: 'You click the flashlight on. Its beam pierces the shadows.',
      setsFlag: 'has-light',
    },
  },

  'notebook': {
    id: 'notebook',
    name: "Investigator's Notebook",
    description: "Your investigator's notebook. You've been jotting down observations.",
    readText:
      "Your notes so far: 'Called to Blackwood Manor. Owner Edmund Blackwood - vanished. Family history of occult interests. Local legend says the house is cursed.'",
  },

  'torn-diary-page-1': {
    id: 'torn-diary-page-1',
    name: 'Torn Diary Page (March)',
    description: 'A torn page from a diary, dated March. The ink is faded but legible.',
    readText: '"March 3rd - The children say they hear singing from the walls at night. I have dismissed the staff. We are alone now. -E.B."',
    useAlone: {
      message: 'You study the diary page carefully. Perhaps if you had all the pages, the full story would become clear...',
    },
  },

  'torn-diary-page-2': {
    id: 'torn-diary-page-2',
    name: 'Torn Diary Page (June)',
    description: 'A torn page from a diary, dated June. The handwriting grows more erratic toward the bottom.',
    readText: '"June 15th - I found the book in the cellar. The rituals described within are beyond comprehension. Eleanor begs me to stop but I am so close to understanding. -E.B."',
    useAlone: {
      message: 'You study the diary page carefully. Perhaps if you had all the pages, the full story would become clear...',
    },
  },

  'torn-diary-page-3': {
    id: 'torn-diary-page-3',
    name: 'Torn Diary Page (October)',
    description: 'A torn page from a diary, dated October. Several words are crossed out violently.',
    readText: '"October 31st - Tonight I complete the ritual. The entity promises eternal life. The children must not know. Eleanor has locked herself in the chapel, praying. Foolish woman. -E.B."',
    useAlone: {
      message: 'You study the diary page carefully. Perhaps if you had all the pages, the full story would become clear...',
    },
  },

  'torn-diary-page-4': {
    id: 'torn-diary-page-4',
    name: 'Final Diary Page',
    description: 'The final page of what appears to be Edmund Blackwood\'s diary. The last entry trails off mid-sentence.',
    readText: '"I was wrong. The entity cannot be controlled. It consumed Eleanor first, then the children fled upstairs. I am sealing myself in the crypt. If you find this, do not open the Final Chamber. Let it sleep. God forgive me. -Edmund Blackwood"',
  },

  'silver-key': {
    id: 'silver-key',
    name: 'Silver Key',
    description: 'A small silver key with an ornate bow. Engraved with a tiny rose.',
    useWith: {
      'jewelry box': {
        message: 'The silver key fits! Inside the jewelry box you find a locket containing a tiny portrait of Eleanor Blackwood and an inscription: "Pray for us in the chapel."',
        setsFlag: 'jewelry-box-opened',
        removesItem: true,
      },
      safe: {
        message: "The silver key doesn't fit the safe. You need a combination, not a key.",
      },
    },
  },

  'rusty-knife': {
    id: 'rusty-knife',
    name: 'Rusty Knife',
    description: 'An old kitchen knife, badly rusted but still sharp enough to cut through soft material.',
    useWith: {
      cobwebs: {
        message: 'You slash through the thick cobwebs with the rusty knife, clearing the way forward.',
        setsFlag: 'cobwebs-cleared',
      },
      curtains: {
        message: 'You cut through the dusty bed curtains with the knife.',
      },
    },
  },

  'ritual-candle': {
    id: 'ritual-candle',
    name: 'Black Candle',
    description: 'A tall black ritual candle. It seems to absorb the light around it rather than emit any.',
    useAlone: {
      message: 'The ritual candle flickers to life with an unnatural blue flame.',
      setsFlag: 'candle-lit',
    },
  },

  'ritual-bell': {
    id: 'ritual-bell',
    name: 'Silver Bell',
    description: 'A small silver bell engraved with arcane symbols. It hums faintly even when still.',
    useAlone: {
      message: 'The bell produces a deep, resonant tone that seems to come from everywhere at once.',
      setsFlag: 'bell-rung',
    },
  },

  'ritual-book': {
    id: 'ritual-book',
    name: 'Ritual Book',
    description: 'A leather-bound tome filled with dense, archaic script. The cover bears a symbol you do not recognize.',
    readText:
      "Two rituals are described within. THE UNBINDING: 'To free a trapped spirit, kneel and pray in the crypt where the dead rest, with candle lit, bell rung, and this book in hand.' THE BANISHMENT: 'To unmake the entity, one must use this book against it directly. Read the incantation aloud in its presence: Vox tenebris, vox lucis — revertere ad abyssum!'",
    useAlone: {
      message: 'You read aloud from the ritual book. The words feel heavy and ancient on your tongue.',
    },
    useWith: {
      'entity': {
        message:
          'You read the banishment incantation! Light erupts from the book, the bell rings of its own accord, the candle burns white-hot. The Entity screams as reality tears open and pulls it back to the void from whence it came! The manor shudders, then falls silent. Dawn breaks through the windows. You have banished the darkness from Blackwood Manor!',
        setsFlag: 'entity-banished',
      },
    },
  },

  'music-box': {
    id: 'music-box',
    name: 'Music Box',
    description: 'An ornate rosewood music box. The mechanism is wound down and produces no sound.',
    combinable: ['music-box-key'],
    combineResult: 'music-box-wound',
    useAlone: {
      message: 'The music box needs to be wound first. You\'d need a small key.',
    },
    useWith: {
      key: {
        message: 'You insert the tiny brass key and wind the music box. The spring tightens with a satisfying click.',
        setsFlag: 'music-box-combined',
        removesItem: true,
        givesItem: 'music-box-wound',
      },
    },
  },

  'music-box-key': {
    id: 'music-box-key',
    name: 'Tiny Brass Key',
    description: 'A tiny brass winding key. It looks like it belongs to a music box.',
    combinable: ['music-box'],
    combineResult: 'music-box-wound',
    useWith: {
      'music box': {
        message: 'You insert the tiny brass key and wind the music box. The spring tightens with a satisfying click.',
        setsFlag: 'music-box-combined',
        removesItem: true,
        givesItem: 'music-box-wound',
      },
    },
  },

  'music-box-wound': {
    id: 'music-box-wound',
    name: 'Wound Music Box',
    description: 'The music box, wound and ready to play. You can hear the tension in the spring.',
    useAlone: {
      message: 'The music box plays a haunting lullaby. Three notes repeat, over and over, growing slower until silence reclaims the room.',
      setsFlag: 'has-music-box-wound',
    },
  },

  'black-rose': {
    id: 'black-rose',
    name: 'Black Rose',
    description: 'A perfectly preserved black rose. It is unnaturally cold to the touch and smells faintly of midnight air.',
    useWith: {
      angel: {
        message:
          "You place the black rose at the angel's feet. The tears flow faster, then stop. The angel smiles. Crystallized tears form at its base. A voice whispers: 'The three instruments must sound together in the crypt. Only then can the binding be broken.'",
        setsFlag: 'angel-appeased',
        removesItem: true,
      },
    },
  },

  'wine-bottle': {
    id: 'wine-bottle',
    name: 'Old Wine Bottle (1889)',
    description: 'A dusty bottle of Blackwood Estate red, vintage 1889. The cork has dried but held.',
    useAlone: {
      message: 'You take a long drink. It tastes like vinegar and regret. But it warms you from the inside, steadying your nerves.',
      setsFlag: 'drank-wine',
      removesItem: true,
    },
  },

  'old-journal': {
    id: 'old-journal',
    name: "Eleanor's Journal",
    description: "A worn leather journal. The initials 'E.B.' are embossed on the cover — Eleanor Blackwood.",
    readText: '"Edmund has changed. The book he found in the cellar has consumed him. He speaks of an entity that promises immortality. I have hidden the bell upstairs and the candle in the pantry. He must not complete the ritual. I will pray in the chapel for our deliverance."',
  },

  'star-chart': {
    id: 'star-chart',
    name: 'Star Chart',
    description: 'A detailed celestial map, hand-drawn with obsessive precision.',
    readText:
      "A detailed star chart. October 31st is circled in red ink. Next to it: 'The alignment is perfect. Tonight.'",
  },

  'old-photograph': {
    id: 'old-photograph',
    name: 'Old Photograph',
    description: 'A faded photograph of the Blackwood family. They are posed stiffly before the manor. No one is smiling.',
  },

  'mirror-shard': {
    id: 'mirror-shard',
    name: 'Mirror Shard',
    description: 'A jagged piece of silvered glass from the shattered mirror. Handle with care.',
    useAlone: {
      message:
        'You look into the shard. For a moment, you see the truth — the entity is weakening. The ritual can work.',
      setsFlag: 'seen-truth',
    },
    useWith: {
      'entity': {
        message:
          'You hold up the mirror shard. The Entity recoils from its own reflection, its form flickering. It fears itself!',
        setsFlag: 'entity-weakened',
      },
    },
  },

  'angel-tears': {
    id: 'angel-tears',
    name: 'Angel Tears',
    description: 'Crystallized tears gathered from the weeping garden statue. They glow with a faint, warm light.',
    useAlone: {
      message: 'The crystallized tears warm in your hand, healing your spirit. You feel restored.',
      setsFlag: 'blessed',
    },
  },

  'crypt-key': {
    id: 'crypt-key',
    name: 'Crypt Key',
    description:
      'A heavy iron key, ice-cold to the touch. Given to you by the freed spirit of Edmund Blackwood.',
  },

  'holy-water': {
    id: 'holy-water',
    name: 'Vial of Holy Water',
    description: 'A small glass vial of blessed water. It glows faintly and is warm to the touch.',
    useAlone: {
      message: 'You sprinkle holy water on yourself. A protective warmth fills you, pushing back the darkness.',
      setsFlag: 'blessed-water',
      removesItem: true,
    },
    useWith: {
      entity: {
        message: 'You hurl the holy water at the Entity! It shrieks as the blessed liquid burns through its form, weakening it significantly!',
        setsFlag: 'entity-weakened',
        removesItem: true,
      },
    },
  },

  'combination-note': {
    id: 'combination-note',
    name: 'Scrawled Note',
    description: 'A note scratched into the stone wall. It reads: "The clock knows the hour of the ritual."',
    readText:
      'Numbers scratched in a shaky hand: "The combination is found in the hour the ritual was to begin — look to the clock face in the parlour, count the strikes at midnight."',
  },
};
