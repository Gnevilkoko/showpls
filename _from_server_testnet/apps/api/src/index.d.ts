import { User } from "@share/entities"
import "express-session"

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
      payload: User | null
      start: bigint
    }
    namespace Multer {
      interface File {
        fieldname: string
        originalname: string
        encoding: string
        mimetype: string
        size: number
        destination: string
        filename: string
        path: string
        buffer: Buffer
        stream: NodeJS.ReadableStream
      }
    }
  }
}
