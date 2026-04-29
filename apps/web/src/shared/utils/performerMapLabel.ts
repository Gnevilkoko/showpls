/** Текст ника на пине карты (как в PerformerMapPin). */
export function performerMapDisplayNick(
  username: string | null,
  firstName: string,
  lastName: string | null,
): string {
  const u = username?.trim()
  if (u) {
    const clean = u.replace(/^@+/, "")
    return clean ? `@${clean}` : firstName
  }
  return [firstName, lastName].filter(Boolean).join(" ").trim() || firstName
}
