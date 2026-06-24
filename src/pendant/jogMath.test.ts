import { describe, expect, it } from 'vitest'
import { clampToLimit, jogRateDegPerSec, jogStep } from './jogMath'

describe('clampToLimit', () => {
  it('passes values within range unchanged', () => {
    expect(clampToLimit(10, -170, 170)).toBe(10)
  })
  it('clamps below min and above max', () => {
    expect(clampToLimit(-200, -170, 170)).toBe(-170)
    expect(clampToLimit(200, -170, 170)).toBe(170)
  })
})

describe('jogStep', () => {
  const lim = { min: -90, max: 90 }
  it('adds a signed delta within range', () => {
    expect(jogStep(0, 5, lim)).toBe(5)
    expect(jogStep(0, -5, lim)).toBe(-5)
  })
  it('clamps at the upper limit', () => {
    expect(jogStep(88, 10, lim)).toBe(90)
  })
  it('clamps at the lower limit', () => {
    expect(jogStep(-88, -10, lim)).toBe(-90)
  })
})

describe('jogRateDegPerSec', () => {
  const MAX = 60
  it('scales linearly with speed override', () => {
    expect(jogRateDegPerSec(100, MAX)).toBe(60)
    expect(jogRateDegPerSec(50, MAX)).toBe(30)
    expect(jogRateDegPerSec(0, MAX)).toBe(0)
  })
  it('clamps out-of-range percentages to 0..100', () => {
    expect(jogRateDegPerSec(150, MAX)).toBe(60)
    expect(jogRateDegPerSec(-20, MAX)).toBe(0)
  })
})
