import { useEffect, useMemo, useState } from "react"
import type { ChatType } from "../../../shared/types"
import { useInView } from "react-intersection-observer"
import { useTranslation } from "react-i18next"
import ChatItem from "../components/ChatItem"

interface ChatsListProps {
  list: ChatType[]
  isFavoriteList: boolean
  searchValue: string
}

const ChatsList = ({ list, isFavoriteList, searchValue }: ChatsListProps) => {
  const { t } = useTranslation()
  const countVisibleChats = 10
  const [visibleCount, setVisibleCount] = useState(countVisibleChats)
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

  // Сброс видимого количества при изменении фильтра или поиска
  useEffect(() => {
    setVisibleCount(countVisibleChats)
  }, [searchValue, isFavoriteList])

  const visibleChats = useMemo(() => filteredChats.slice(0, visibleCount), [filteredChats, visibleCount])

  // Подгрузка новых чатов при достижении низа
  useEffect(() => {
    if (inView) {
      setVisibleCount((prev) =>
        // позволяет не подгружать более чем вообще существует в списке
        Math.min(prev + countVisibleChats, filteredChats.length)
      )
    }
  }, [inView, filteredChats.length])

  return (
    <div className="chats-list">
      {visibleChats.length > 0 ? (
        visibleChats.map((chat: ChatType) => <ChatItem key={chat.chat_id} chat={chat} />)
      ) : (
        <p className="zero-chats-paragraph">{t("noChatsFound")}</p>
      )}

      <p ref={ref} className={`loading-chats-paragraph ${visibleCount < filteredChats.length ? "visible" : ""}`}>
        {t("loadingChats")}
      </p>
    </div>
  )
}

export default ChatsList
