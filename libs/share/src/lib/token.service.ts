import { Token } from "./token.enum"
import { z } from "zod"
import { ethers } from "ethers"

export class TokenService {
  public static getDecimals(token: Token) {
    if (!z.enum(Token).safeParse(token).success) {
      throw new Error(`Provided incorrect [token]: ${token}`)
    }

    const decimals: Record<Token, number> = {
      TON: 9,
      USDT: 6,
      STARS: 6,
    }
    return decimals[token]
  }

  public static format(value: bigint | string, { token }: { token: Token }) {
    const decimals = TokenService.getDecimals(token)
    return +ethers.formatUnits(BigInt(value), decimals)
  }

  public static parse(value: number | string, { token }: { token: Token }) {
    const decimals = TokenService.getDecimals(token)
    return ethers.parseUnits(typeof value === "number" ? value.toFixed(decimals) : value, decimals)
  }
}
