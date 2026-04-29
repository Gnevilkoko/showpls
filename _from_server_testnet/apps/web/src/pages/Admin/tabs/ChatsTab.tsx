import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useAppSelector } from "../../../store"
import type { RootState } from "../../../store"
import { useGetChatListQuery } from "../../../store/api/chatApi"
import userIcon from "../../../assets/icons/navigation/user.svg"

export default function ChatsTab() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const userData = useAppSelector((state: RootState) => state.user.userData)
  const isAdmin = userData?.role === "admin"

  const { data, isLoading } = useGetChatListQuery(
    { scope: "support", limit: 100, page: 1 },
    { skip: !isAdmin }
  )

  const filteredItems = (data?.items ?? []).filter((chat: any) => !chat.isArbitration)

  if (isLoading) return <p className="admin-panel__loading">{t("loading")}</p>
  if (!filteredItems.length) return <p className="admin-panel__empty">{t("adminChats.empty")}</p>

  return (
    <ul className="admin-chats-list">
      {filteredItems.map((chat: any) => {
        const isSupportChat = chat.isSupportChat
        const userAvatar = isSupportChat ? chat.supportUserAvatar : chat.avatar
        const userName = isSupportChat
          ? chat.supportUserName
          : `${chat.firstName} ${chat.lastName || ""}`.trim()
        const u1 = chat.user1
        const u2 = chat.user2

        return (
          <li
            key={chat.chatId}
            className={`admin-chats-list__item ${isSupportChat ? "admin-chats-list__item--support" : ""}`}
            onClick={() =>
              navigate(`/chat/${chat.chatId}`, {
                state: { openAsSupportOperator: true },
              })
            }
          >
            <div className="admin-chats-list__row">
              <img
                src={userAvatar || userIcon}
                alt=""
                className="admin-chats-list__avatar"
              />
              <div className="admin-chats-list__info">
                <div className="admin-chats-list__header">
                  <span className="admin-chats-list__name">
                    {isSupportChat && (
                      <span className="admin-chats-list__badge">Support</span>
                    )}
                    {userName || "User"}
                  </span>
                  <span className="admin-chats-list__time">
                    {chat.lastUpdate ? new Date(chat.lastUpdate).toLocaleString() : ""}
                  </span>
                </div>
                {u1 && u2 && (
                  <span className="admin-chats-list__participants">
                    {u1.firstName} {u1.lastName || ""} ↔ {u2.firstName} {u2.lastName || ""}
                  </span>
                )}
                <span className="admin-chats-list__last-msg">
                  {chat.lastMessage || t("message")}
                </span>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
