/**
 * CAD import validation — Phase 5 · Unit 2.
 *
 * Imported files are untrusted input (code-standards.md: "validate all
 * external input at boundaries"). Checked before any loader touches the file:
 * extension allow-list and a size cap. STEP/IGES are explicitly out of scope
 * (architecture.md) and get a clear rejection rather than a confusing loader
 * error.
 */
export const ALLOWED_EXTENSIONS = ['stl', 'obj', 'gltf', 'glb'] as const
export type AllowedExtension = (typeof ALLOWED_EXTENSIONS)[number]

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024 // 50 MB

const STEP_IGES_EXTENSIONS = ['step', 'stp', 'iges', 'igs']

export type CadValidationResult = { ok: true; extension: AllowedExtension } | { ok: false; reason: string }

function extensionOf(filename: string): string {
  return filename.slice(filename.lastIndexOf('.') + 1).toLowerCase()
}

export function validateCadFile(file: File): CadValidationResult {
  const ext = extensionOf(file.name)

  if (STEP_IGES_EXTENSIONS.includes(ext)) {
    return { ok: false, reason: `${ext.toUpperCase()} (STEP/IGES) is not supported — mesh formats only (STL, OBJ, GLTF/GLB)` }
  }
  if (!ALLOWED_EXTENSIONS.includes(ext as AllowedExtension)) {
    return { ok: false, reason: `Unsupported file type ".${ext}" — use STL, OBJ, GLTF, or GLB` }
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { ok: false, reason: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB) — 50 MB max` }
  }
  return { ok: true, extension: ext as AllowedExtension }
}
