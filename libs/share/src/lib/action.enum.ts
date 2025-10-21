import { InferSubjects } from "@casl/ability"
import {
  User,
} from "./entities"

export enum Action {
  Create = "create",
  Read = "read",
  Update = "update",
  Delete = "delete",
}

export type Subjects =
  | InferSubjects<
      | typeof User
    >
  | "all"
