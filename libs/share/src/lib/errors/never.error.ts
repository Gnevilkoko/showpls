export class NeverError extends Error {
  constructor(v: never) {
    super(`Unreachable statement: ${v}`)
  }
}