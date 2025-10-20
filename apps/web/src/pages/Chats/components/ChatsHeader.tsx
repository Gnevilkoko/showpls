import searchChatsBlueIcon from "../../../assets/icons/actions/search-chats-blue.svg"
import starOutlineIcon from "../../../assets/icons/status/star-outline.svg"
import starFilledIcon from "../../../assets/icons/status/star-filled.svg"
import { useRef } from "react"
import { useTranslation } from "react-i18next"

type ChatsHeaderProps = {
  isFavoriteList: boolean
  searchValue: string
  onToggleFavorite: () => void
  onSearchChange: (value: string) => void
  count: number
}

const ChatsHeader = ({ isFavoriteList, searchValue, onToggleFavorite, onSearchChange, count }: ChatsHeaderProps) => {
  const { t } = useTranslation()
  const searchInputRef = useRef<HTMLInputElement>(null)

  const handleSearchWrapperClick = () => {
    searchInputRef.current?.focus()
  }

  return (
    <div className="chats-header">
      <div className="chats-header__title">
        <span>{isFavoriteList ? t("favorites") : t("chats")}</span>

        <div className="chats__count green">
          <span>{count}</span>
        </div>
      </div>

      <div className="chats__actions">
        <div className="chats__search-wrapper blue" onClick={handleSearchWrapperClick}>
          <img src={searchChatsBlueIcon} alt="Search Chat Icon" />
          <input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            ref={searchInputRef}
            type="text"
            placeholder={t("search")}
            className="chats__search-input"
          />
        </div>

        <button className="chats__favorites-btn" onClick={onToggleFavorite}>
          <img src={isFavoriteList ? starFilledIcon : starOutlineIcon} alt="Star Icon" />
        </button>
      </div>
    </div>
  )
}

export default ChatsHeader
