import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // The suite covers the pure game engine (parser, reducer, events,
    // command handlers) and the world data, none of which touch the DOM.
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
  },
});
