export class DeleteFailed extends Error {}
export class UpdateFailed extends Error {}

export const CRUDExceptions = {
  DeleteFailed,
  UpdateFailed,
}
