import { Token } from "./token.enum"
import { z } from "zod"

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
}
