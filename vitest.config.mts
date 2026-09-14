import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    // The engine suite (parser, reducer, events, commands, world data) is pure
    // logic and runs fastest with no DOM. Files that need one opt in with a
    // `// @vitest-environment jsdom` docblock.
    environment: 'node',
    include: ['__tests__/**/*.test.{ts,tsx}'],
  },
});
