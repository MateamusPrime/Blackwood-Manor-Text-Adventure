import { test, expect, type Page } from '@playwright/test';

// A full playthrough of the game, START to the banishment ending.
//
// The unit suite tests the engine in isolation: the parser, the reducer, the
// command handlers against a fixture world. None of it can tell you whether
// the real world data still threads together into a winnable game, or whether
// the assembled app still responds to a typed command at all. This can.
//
// Every step below is a command a player types. If one of them stops doing
// what it did, the game is no longer completable and this fails.

async function send(page: Page, command: string) {
  const input = page.getByPlaceholder('Enter command...');
  await input.fill(command);
  await input.press('Enter');
}

/** Type a run of commands that need no assertion between them. */
async function walk(page: Page, ...commands: string[]) {
  for (const command of commands) await send(page, command);
}

/** The game's most recent output, which is what sits at the bottom of the log. */
function output(page: Page, pattern: RegExp) {
  return expect(page.getByText(pattern).last()).toBeVisible();
}

test('the manor can be escaped', async ({ page }) => {
  test.slow(); // ~70 commands against a real browser

  await page.goto('/');
  await send(page, 'start');
  await output(page, /FRONT PORCH/);

  // --- Ground floor: the first diary page, and the silver key under the plates
  await walk(page, 'north', 'take torn diary page', 'west');
  await send(page, 'look at plates');
  await output(page, /something metallic glints/i);

  await send(page, 'take silver key');
  await output(page, /Taken: Silver Key/);

  await walk(page, 'east', 'east');
  await send(page, 'use silver key on jewelry box');
  await output(page, /Pray for us in the chapel/);

  // --- Knife, candle, music box; the maid points below
  await walk(page, 'west', 'west', 'south', 'take rusty knife', 'east', 'take black candle');
  await walk(page, 'west', 'south', 'take music box');
  await send(page, 'talk to maid');
  await output(page, /He went below and never returned/);

  // --- The witching hour opens the clock passage, which holds the safe code
  await walk(page, 'north', 'north', 'east', 'north');
  await send(page, 'set clock to midnight');
  await output(page, /clock face swings open/i);

  await walk(page, 'northeast');
  await send(page, 'read scrawled note');
  await output(page, /10-31-89/);

  // --- The black rose buys the angel's tears, and the ritual hint
  await walk(page, 'southwest', 'west', 'take black rose', 'south');
  await send(page, 'use black rose on angel');
  await output(page, /three instruments must sound together in the crypt/);

  await walk(page, 'take angel tears', 'north', 'north', 'south');

  // --- Upstairs: winding key under the pillow, page two, the bell, the safe
  await walk(page, 'up', 'east');
  await send(page, 'look at bed');
  await output(page, /something small and metallic/i);

  await walk(page, 'take tiny brass key');
  await send(page, 'use tiny brass key on music box');
  await output(page, /wind the music box/i);

  await walk(page, 'north', 'take torn diary page', 'south', 'west', 'north', 'take silver bell', 'west');
  await send(page, 'set safe to 10-31-89');
  await output(page, /safe swings open/i);

  // --- The child must be spoken to before the third page is there to take
  await walk(page, 'east', 'east');
  await send(page, 'talk to child');
  await output(page, /Will you play with me/);

  await send(page, 'play music box');
  await output(page, /hidden passage leading down/i);

  await walk(page, 'take torn diary page');
  await send(page, 'use diary');
  await output(page, /assembled all three diary pages/);

  // --- Only now is the ritual book in the library
  await walk(page, 'south', 'south', 'west', 'pull bookshelf');
  await send(page, 'take ritual book');
  await output(page, /Taken: Ritual Book/);

  // --- Down to the crypt: the Unbinding frees the former owner
  await walk(page, 'east', 'down', 'north', 'north', 'down', 'north', 'north', 'north');
  await walk(page, 'light candle', 'ring bell');
  await send(page, 'pray');
  await output(page, /A spectral figure appears/);

  await send(page, 'talk to ghost');
  await output(page, /gives you something/);

  // --- The Final Chamber: the Banishment
  await send(page, 'north');
  await output(page, /FINAL CHAMBER/);

  await send(page, 'use ritual book on entity');
  await output(page, /You have survived Blackwood Manor/);

  // The ending overlay, which only a finished game draws. Nothing shorter than
  // a full playthrough can reach it, so this is the only place it is checked.
  await expect(page.getByText('YOU ESCAPED THE MANOR')).toBeVisible();

  // Won without taking a hit: the ending is reachable without losing health,
  // so a change that starts damaging the player on this route shows up here.
  await expect(page.getByText('♥♥♥♥♥')).toBeVisible();
});
