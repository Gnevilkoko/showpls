import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import Header from "../../../shared/components/Header"
import Navigation from "../../../shared/components/Navigation"
import { useAppSelector } from "../../../store"
import type { RootState } from "../../../store"
import { useGetChatListQuery } from "../../../store/api/chatApi"
import userIcon from "../../../assets/icons/navigation/user.svg"

export default function ChatsManage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const userData = useAppSelector((state: RootState) => state.user.userData)
  const isAdmin = userData?.role === "admin"

  const { data, isLoading } = useGetChatListQuery(
    { scope: "support", limit: 100, page: 1 },
    { skip: !isAdmin }
  )

  useEffect(() => {
    if (userData && !isAdmin) {
      navigate("/home", { replace: true })
    }
  }, [userData, isAdmin, navigate])

  if (!userData || !isAdmin) return null

  const listItems = (data?.items ?? []).filter((c: any) => !c.isArbitration)

  const handleOpenChat = (chatId: string) => {
    navigate(`/chat/${chatId}`, { state: { openAsSupportOperator: true } })
  }

  return (
    <div className="page admin-chats-page">
      <Header />
      <div className="admin-chats-page__content">
        <h1>{t("adminChats.title")}</h1>
        {isLoading ? (
          <p>{t("loading")}</p>
        ) : !listItems.length ? (
          <p className="admin-chats-page__empty">{t("adminChats.empty")}</p>
        ) : (
          <ul className="admin-chats-list">
            {listItems.map((chat: any) => {
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
                  onClick={() => handleOpenChat(chat.chatId)}
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
        )}
      </div>
      <Navigation />
    </div>
  )
}
