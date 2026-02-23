import { useEffect, useMemo } from "react"
import type { ChatType } from "../../../shared/types"
import { useInView } from "react-intersection-observer"
import { useTranslation } from "react-i18next"
import ChatItem from "../components/ChatItem"

interface ChatsListProps {
  list: ChatType[]
  isFavoriteList: boolean
  searchValue: string
  hasMore: boolean
  isFetching: boolean
  onLoadMore: () => void
}

const ChatsList = ({ list, isFavoriteList, searchValue, hasMore, isFetching, onLoadMore }: ChatsListProps) => {
  const { t } = useTranslation()
  const { ref, inView } = useInView({
    threshold: 0,
  })

  // фильтруем список на избранные, совпадения в поиске,
  // если фильтров нет - возвращает все значения
  const filteredChats = useMemo(() => {
    const normalized = searchValue?.toLowerCase() ?? ""

    let result = list
      .filter((chat) => {
        if (isFavoriteList && !chat.is_favorite) return false

        if (normalized) {
          const hasValue =
            chat.first_name.toLowerCase().includes(normalized) ||
            chat.last_name?.toLowerCase().includes(normalized) ||
            chat.last_message.toLowerCase().includes(normalized)
          if (!hasValue) return false
        }

        return true
      })
      // сортировка: сначала активные ордеры, потом остальные
      .sort((a, b) => Number(b.is_active_order) - Number(a.is_active_order))

    // Поднимаем чат Showpls Agent (id = 0) в самый верх, без дубликатов
    const agent = list.find((chat) => chat.chat_id === 0)
    if (agent) {
      result = result.filter((chat) => chat.chat_id !== agent.chat_id)
      result.unshift(agent)
    }

    return result
  }, [list, isFavoriteList, searchValue])



  // Подгрузка новых чатов при достижении низа
  useEffect(() => {
    if (inView && hasMore && !isFetching) {
      onLoadMore()
    }
  }, [inView, hasMore, isFetching, onLoadMore])

  return (
    <div className="chats-list">
      {filteredChats.length > 0 ? (
        filteredChats.map((chat: ChatType) => <ChatItem key={chat.chat_id} chat={chat} />)
      ) : (
        <p className="zero-chats-paragraph">{t("noChatsFound")}</p>
      )}

      <p ref={ref} className={`loading-chats-paragraph ${hasMore ? "visible" : ""}`}>
        {isFetching ? t("loadingChats") : ""}
      </p>
    </div>
  )
}

export default ChatsList
