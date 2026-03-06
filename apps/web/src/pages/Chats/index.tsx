import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import Navigation from "../../shared/components/Navigation"
import ChatsHeader from "./components/ChatsHeader"
import ChatsList from "./screens/ChatsList"
import { useGetChatListQuery } from "../../store/api/chatApi"
import { adaptChatListItemToChat, type ChatType } from "../../shared/types/adapters"

const Chats = () => {
  const { t } = useTranslation()
  const [searchValue, setSearchValue] = useState<string>("")
  const [isFavoriteList, setIsFavoriteList] = useState<boolean>(false)
  const [page, setPage] = useState<number>(1)

  const handleSwitchFavorite = useCallback(() => {
    setIsFavoriteList((prev) => !prev)
    setPage(1)
  }, [])

  // Получаем данные с сервера
  const { data: chatListData, isLoading, isFetching } = useGetChatListQuery({
    search: searchValue || undefined,
    isFavorite: isFavoriteList ? true : undefined,
    limit: 15,
    page,
  })

  // Сброс страницы при поиске
  useEffect(() => {
    setPage(1)
  }, [searchValue])

  const hasMore = chatListData ? chatListData.items.length < chatListData.total : false

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isFetching) {
      setPage((prev) => prev + 1)
    }
  }, [hasMore, isFetching])

  // Адаптируем бекенд данные (ChatListItem[]) к интерфейсу фронтенда (ChatType[])
  const adaptedChats: ChatType[] = useMemo(() => {
    if (!chatListData?.items) return []
    return chatListData.items.map((item) => adaptChatListItemToChat(item))
  }, [chatListData])

  const counters = useMemo(
    () => ({
      total: chatListData?.countUnread || 0,
      favorites: chatListData?.countUnreadFavorite || 0,
    }),
    [chatListData]
  )

  return (
    <div className="page chats">
      <ChatsHeader
        isFavoriteList={isFavoriteList}
        searchValue={searchValue}
        onToggleFavorite={handleSwitchFavorite}
        onSearchChange={setSearchValue}
        count={isFavoriteList ? counters.favorites : counters.total}
      />

      {isLoading && page === 1 ? (
        <p className="loading-chats-paragraph visible">{t("loadingChats")}</p>
      ) : adaptedChats.length > 0 ? (
        <ChatsList
          list={adaptedChats}
          isFavoriteList={isFavoriteList}
          searchValue={searchValue}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          isFetching={isFetching}
        />
      ) : (
        <p className="zero-chats-paragraph">{t("zeroChats")}</p>
      )}

      <Navigation />
    </div>
  )
}

export default Chats
