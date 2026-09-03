/** Thrown by `Sound` construction and `SoundManager.register` on a malformed definition */
export class SoundValidationError extends Error {
  readonly errors: readonly string[]

  constructor(name: string, errors: readonly string[]) {
    super(`Invalid sound definition for "${name}":\n- ${errors.join('\n- ')}`)
    this.name = 'SoundValidationError'
    this.errors = errors
  }
}
