import { beforeEach, describe, expect, it } from 'vitest'
import { deriveStatus, useMachineStore } from './machineStore'

beforeEach(() => {
  useMachineStore.setState({ estop: false, hold: false, moving: false })
})

describe('machineStore transitions', () => {
  it('starts ready', () => {
    const s = useMachineStore.getState()
    expect(s.estop).toBe(false)
    expect(s.hold).toBe(false)
    expect(s.moving).toBe(false)
  })

  it('engageEstop latches and kills motion + hold', () => {
    useMachineStore.setState({ moving: true, hold: true })
    useMachineStore.getState().engageEstop()
    const s = useMachineStore.getState()
    expect(s.estop).toBe(true)
    expect(s.moving).toBe(false)
    expect(s.hold).toBe(false)
  })

  it('resetEstop clears the latch', () => {
    useMachineStore.getState().engageEstop()
    useMachineStore.getState().resetEstop()
    expect(useMachineStore.getState().estop).toBe(false)
  })

  it('setHold engages hold and stops motion', () => {
    useMachineStore.setState({ moving: true })
    useMachineStore.getState().setHold(true)
    const s = useMachineStore.getState()
    expect(s.hold).toBe(true)
    expect(s.moving).toBe(false)
  })

  it('toggleHold flips the hold flag', () => {
    useMachineStore.getState().toggleHold()
    expect(useMachineStore.getState().hold).toBe(true)
    useMachineStore.getState().toggleHold()
    expect(useMachineStore.getState().hold).toBe(false)
  })
})

describe('deriveStatus priority', () => {
  it('E-STOP outranks everything', () => {
    expect(deriveStatus({ estop: true, hold: true, moving: true })).toBe('estop')
  })
  it('Hold outranks moving', () => {
    expect(deriveStatus({ estop: false, hold: true, moving: true })).toBe('hold')
  })
  it('Moving when not held', () => {
    expect(deriveStatus({ estop: false, hold: false, moving: true })).toBe('moving')
  })
  it('Ready otherwise', () => {
    expect(deriveStatus({ estop: false, hold: false, moving: false })).toBe('ready')
  })
})
