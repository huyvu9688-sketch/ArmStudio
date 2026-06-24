import { Component, Suspense, type ReactNode } from 'react'
import { RobotArm } from './RobotArm'
import { PrimitiveArm } from './PrimitiveArm'

/**
 * Arm selector — chooses the GLB arm or the primitive fallback.
 *
 * `VITE_ARM_MODEL` = 'glb' (default) | 'primitive' (architecture.md).
 * When set to 'glb', the GLB loads under Suspense; if it fails (missing file,
 * decode error) the error boundary surfaces it to the console and renders the
 * primitive arm instead — a failed load must never crash the scene silently
 * (code-standards.md).
 */
const mode = (import.meta.env.VITE_ARM_MODEL as string | undefined) ?? 'glb'

export function Arm() {
  if (mode === 'primitive') return <PrimitiveArm />

  return (
    <ArmErrorBoundary fallback={<PrimitiveArm />}>
      <Suspense fallback={null}>
        <RobotArm />
      </Suspense>
    </ArmErrorBoundary>
  )
}

class ArmErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.error('[ArmStudio] GLB arm failed to load; using primitive fallback.', error)
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
