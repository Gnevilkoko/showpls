import type { ChatType } from "../types"

const SUPPORT_AGENT_NAME = "showpls agent"

export function isSupportAgentChatItem(chat: ChatType): boolean {
  if (String(chat.chat_id) === "support") return true
  const fullName = `${chat.first_name} ${chat.last_name ?? ""}`.trim().toLowerCase()
  return fullName === SUPPORT_AGENT_NAME
}
