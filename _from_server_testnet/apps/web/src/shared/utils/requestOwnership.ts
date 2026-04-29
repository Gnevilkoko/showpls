type IdLike = string | number | null | undefined

type RequestLike = {
  customer?: {
    id?: IdLike
  } | null
}

function normalizeId(value: IdLike): string | null {
  if (value === null || value === undefined) return null
  const normalized = String(value).trim()
  return normalized.length > 0 ? normalized : null
}

export function isRequestOwnedByUser(request: RequestLike | null | undefined, userId: IdLike): boolean {
  const ownerId = normalizeId(request?.customer?.id)
  const normalizedUserId = normalizeId(userId)
  if (!ownerId || !normalizedUserId) return false
  return ownerId === normalizedUserId
}
