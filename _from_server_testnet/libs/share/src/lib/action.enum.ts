import { InferSubjects } from "@casl/ability"
import { StarsTopUp, TONTopUp, User } from "./entities"

export enum Action {
  Create = "create",
  Read = "read",
  Update = "update",
  Delete = "delete",
}

export type Subjects = InferSubjects<typeof User | typeof StarsTopUp | typeof TONTopUp> | "all"
