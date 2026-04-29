import type { User } from "@share/entities"
import type { Role } from "@share"

function toIso(d: Date | string | undefined | null): string {
  if (d == null) return ""
  if (d instanceof Date) return d.toISOString()
  if (typeof d === "string") return d
  return String(d)
}

/** Минимальный JWT payload: только то, что читает middleware / gateway (без geometry и пр.). */
export function toAccessTokenPayload(user: User): { id: string; role: Role } {
  return {
    id: String(user.id),
    role: user.role,
  }
}

/**
 * Публичный объект пользователя для JSON (sign-in / refresh / phone).
 * Не кладём PostGIS geometry и прочие несериализуемые поля — они ломали jwt.sign и ответ на проде.
 */
export function toPublicUser(user: User): Record<string, unknown> {
  return {
    id: String(user.id),
    role: user.role,
    tgId: user.tgId != null ? String(user.tgId) : null,
    username: user.username,
    phone: user.phone ?? null,
    firstName: user.firstName,
    lastName: user.lastName ?? null,
    avatar: user.avatar ?? null,
    languageCode: user.languageCode,
    banned: user.banned,
    about: user.about ?? null,
    city: user.city ?? null,
    isAvailable: user.isAvailable,
    performerVerification: user.performerVerification ?? null,
    lastSeenAt: toIso(user.lastSeenAt),
    createdAt: toIso(user.createdAt),
    locationUpdatedAt: user.locationUpdatedAt ? toIso(user.locationUpdatedAt) : null,
  }
}
