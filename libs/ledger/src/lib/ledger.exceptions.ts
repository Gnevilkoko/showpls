class InvalidProvidedData extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options)
    this.name = "InvalidProvidedData"
  }
}

class CurrencyNotFound extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options)
    this.name = "CurrencyNotFound"
  }
}

class AssociatedTransactionNotFound extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options)
    this.name = "AssociatedTransactionNotFound"
  }
}



export default {
  InvalidProvidedData,
  CurrencyNotFound,
  AssociatedTransactionNotFound
}
