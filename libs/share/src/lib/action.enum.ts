import { InferSubjects } from "@casl/ability"
import { StarsTopUp, User } from "./entities"

export enum Action {
  Create = "create",
  Read = "read",
  Update = "update",
  Delete = "delete",
}

export type Subjects = InferSubjects<typeof User | typeof StarsTopUp> | "all"
