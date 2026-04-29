export enum PushNotificationType {
  NEW_MESSAGE = "new_message",
  NEW_RESPONSE = "new_response",
  RESPONSE_ACCEPTED = "response_accepted",
  RESPONSE_REJECTED = "response_rejected",
  TASK_CANCELLED = "task_cancelled",
  TASK_COMPLETED = "task_completed",
  WORK_SUBMITTED = "work_submitted",
  WORK_ACCEPTED = "work_accepted",
  WORK_REJECTED = "work_rejected",
  ARBITRATION_OPENED = "arbitration_opened",
  ARBITRATION_RESOLVED = "arbitration_resolved",
  BALANCE_UPDATED = "balance_updated",
  SYSTEM = "system",
}

export interface PushPayload {
  title: string
  body: string
  type: PushNotificationType
  entityId?: string | null
  deeplink?: string | null
  imageUrl?: string | null
  badge?: number
  sound?: string
  data?: Record<string, string>
}

function sanitizeEntityId(id: string): string {
  return id.replace(/[^a-zA-Z0-9\-_]/g, "")
}

export function buildDeeplink(type: PushNotificationType, entityId?: string | null): string | null {
  if (!entityId) return null

  const safeId = sanitizeEntityId(entityId)
  if (!safeId) return null

  switch (type) {
    case PushNotificationType.NEW_MESSAGE:
      return `showpls://chat/${safeId}`
    case PushNotificationType.NEW_RESPONSE:
    case PushNotificationType.RESPONSE_ACCEPTED:
    case PushNotificationType.RESPONSE_REJECTED:
    case PushNotificationType.TASK_CANCELLED:
    case PushNotificationType.TASK_COMPLETED:
    case PushNotificationType.WORK_SUBMITTED:
    case PushNotificationType.WORK_ACCEPTED:
    case PushNotificationType.WORK_REJECTED:
      return `showpls://task/${safeId}`
    case PushNotificationType.ARBITRATION_OPENED:
    case PushNotificationType.ARBITRATION_RESOLVED:
      return `showpls://arbitration/${safeId}`
    case PushNotificationType.BALANCE_UPDATED:
      return `showpls://wallet`
    default:
      return null
  }
}

export function buildPushPayload(params: {
  title: string
  body: string
  type: PushNotificationType
  entityId?: string | null
  imageUrl?: string | null
  badge?: number
  extraData?: Record<string, string>
}): PushPayload {
  const deeplink = buildDeeplink(params.type, params.entityId)

  return {
    title: params.title,
    body: params.body,
    type: params.type,
    entityId: params.entityId || null,
    deeplink,
    imageUrl: params.imageUrl || null,
    badge: params.badge,
    sound: "default",
    data: {
      type: params.type,
      ...(params.entityId ? { entityId: params.entityId } : {}),
      ...(deeplink ? { deeplink } : {}),
      ...params.extraData,
    },
  }
}
