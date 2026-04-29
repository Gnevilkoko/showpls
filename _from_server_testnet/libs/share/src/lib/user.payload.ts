import { Role } from "./role.enum"


export class UserPayload {
  id: string
  role: Role
  iat: number
  exp: number
}
