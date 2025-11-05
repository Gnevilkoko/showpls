class NotFound extends Error {
  constructor(message: string) {
    super(message)
    this.constructor.name
  }
}

export default {
  NotFound,
}
