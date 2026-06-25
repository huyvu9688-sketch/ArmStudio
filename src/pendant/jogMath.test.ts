import { describe, expect, it } from 'vitest'
import { clampToLimit } from './jogMath'

describe('clampToLimit', () => {
  it('passes values within range unchanged', () => {
    expect(clampToLimit(10, -170, 170)).toBe(10)
  })
  it('clamps below min and above max', () => {
    expect(clampToLimit(-200, -170, 170)).toBe(-170)
    expect(clampToLimit(200, -170, 170)).toBe(170)
  })
})
