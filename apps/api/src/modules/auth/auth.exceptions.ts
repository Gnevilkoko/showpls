class IsBanned extends Error {}
class NotFound extends Error {}
class CredentialsAreInvalid extends Error {}
class CredentialsAreExpired extends Error {}

export default {
  IsBanned,
  NotFound,
  CredentialsAreInvalid,
  CredentialsAreExpired,
}
