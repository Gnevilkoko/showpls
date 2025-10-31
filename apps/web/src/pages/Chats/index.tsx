import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import Navigation from "../../shared/components/Navigation"
import ChatsHeader from "./components/ChatsHeader"
import ChatsList from "./screens/ChatsList"
import { chatsData } from "./data/chatsData"

const Chats = () => {
  const { t } = useTranslation()
  const [searchValue, setSearchValue] = useState<string>("")
  const [isFavoriteList, setIsFavoriteList] = useState<boolean>(false)

  const handleSwitchFavorite = useCallback(() => {
    setIsFavoriteList((prev) => !prev)
  }, [])

  const counters = useMemo(
    () => ({
      total: chatsData.count_unread,
      favorites: chatsData.count_unread_favorite,
    }),
    []
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

      {chatsData.chat_list ? (
        <ChatsList list={chatsData.chat_list} isFavoriteList={isFavoriteList} searchValue={searchValue} />
      ) : (
        <p className="zero-chats-paragraph">{t("zeroChats")}</p>
      )}

      <Navigation />
    </div>
  )
}

export default Chats
