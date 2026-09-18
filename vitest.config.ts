import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Unit tests for the pure, framework-free code under src/lib (indicator math,
 * session boundaries, candle roll-ups). No DOM environment is needed.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/lib/**/*.test.ts"],
  },
});
