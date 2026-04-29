import { Address } from "@ton/core"

export class TONUtilities {
  public static standardizeAddress(address: string | Address): string {
    let a: Address | string = address
    if (typeof address === "string") {
      a = Address.parse(address)
    }

    return a.toString({ bounceable: false, urlSafe: true, testOnly: false })
  }
}
