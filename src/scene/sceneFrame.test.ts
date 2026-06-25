import { describe, expect, it } from 'vitest'
import { fkFromScene, sceneFromFk } from './sceneFrame'

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
})
