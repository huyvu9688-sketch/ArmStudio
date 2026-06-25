import { describe, expect, it } from 'vitest'
import { FK_AXIS_TO_SCENE, fkFromScene, sceneFromFk } from './sceneFrame'

describe('sceneFrame mapping', () => {
  it('fkFromScene inverts sceneFromFk (mm round-trip)', () => {
    const fk: [number, number, number] = [250, -120, 60]
    const scene = sceneFromFk(...fk)
    const back = fkFromScene(...scene)
    expect(back[0]).toBeCloseTo(fk[0], 9)
    expect(back[1]).toBeCloseTo(fk[1], 9)
    expect(back[2]).toBeCloseTo(fk[2], 9)
  })

  it('maps FK Z-up (mm) to scene Y-up (m): (x,y,z)→(x,z,-y)', () => {
    expect(sceneFromFk(1000, 2000, 3000)).toEqual([1, 3, -2])
  })

  it('FK_AXIS_TO_SCENE agrees with fkFromScene for a unit nudge along each scene axis', () => {
    const base: [number, number, number] = [0.5, 0.3, -0.2]
    for (const axis of ['x', 'y', 'z'] as const) {
      const { index, sign } = FK_AXIS_TO_SCENE[axis]
      const nudged = [...base] as [number, number, number]
      nudged[index] += 1 // +1 m along the scene axis this FK axis maps to

      const before = fkFromScene(...base)
      const after = fkFromScene(...nudged)
      const fkAxisIndex = { x: 0, y: 1, z: 2 }[axis]

      // Moving 1m along the mapped scene axis should change ONLY this FK axis,
      // by exactly `sign` meters worth of mm (sign accounts for the −90° flip).
      for (let i = 0; i < 3; i++) {
        const expectedDelta = i === fkAxisIndex ? sign * 1000 : 0
        expect(after[i] - before[i]).toBeCloseTo(expectedDelta, 6)
      }
    }
  })
})
