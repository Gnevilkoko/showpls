import { Role } from "@share"


export class UserPayload {
  id: string
  role: Role
  iat: number
  exp: number
}
