

class InsufficientFunds extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options)
    this.name = "InsufficientFunds"
  }
}

class CanReleaseOnlyHoldTransaction extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options)
    this.name = "CanReleaseOnlyHoldTransaction"
  }
}


export default {
  InsufficientFunds,
  CanReleaseOnlyHoldTransaction,
}
