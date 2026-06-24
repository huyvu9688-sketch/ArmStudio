/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // GitHub Pages project page serves from /ArmStudio/, so production asset
  // URLs must be repo-relative. Dev/preview stay at '/' so `npm run dev`
  // keeps working at localhost root.
  base: command === 'build' ? '/ArmStudio/' : '/',
  plugins: [react(), tailwindcss()],
  test: {
    // Kinematics + protocol unit tests are pure TS; jsdom not needed yet.
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    // No tests until Phase 1 Unit 8 (FK known-value tests); don't fail the gate.
    passWithNoTests: true,
  },
}))
