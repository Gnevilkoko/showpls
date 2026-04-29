export class DeleteFailed extends Error {}
export class UpdateFailed extends Error {}
export class RetrieveFailed extends Error {}

export const CRUDExceptions = {
  DeleteFailed,
  UpdateFailed,
  RetrieveFailed,
}
