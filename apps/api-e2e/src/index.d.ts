import { User } from "@share/entities"
import "express-session"
import {Request} from "express"

declare module "express-session" {
  interface SessionData {
    refreshToken: {
      expireAt: string
    }
    user: Pick<User, "id" | "role">
  }
}

declare global {
  namespace Express {
    interface Request {
       id: string
      payload: User
      start: bigint
    }
  }
}
