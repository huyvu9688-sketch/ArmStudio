/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    // Kinematics + protocol unit tests are pure TS; jsdom not needed yet.
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    // No tests until Phase 1 Unit 8 (FK known-value tests); don't fail the gate.
    passWithNoTests: true,
  },
})
