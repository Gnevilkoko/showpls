import searchChatsBlueIcon from '../../assets/search-chats-blue.svg';
import starOutlineIcon from '../../assets/star-outline.svg';
import { useRef, useState } from 'react';
import NavigationSkeleton from '../../shared/components/NavigationSkeleton';
import { useTranslation } from 'react-i18next';
import { chatsData } from './chatsData';
import ChatsList from './ChatsList';
import Chat from './Chat';
import starFilledIcon from '../../assets/star-filled.svg';
import type { ChatType } from '../../shared/types';

const Chats = () => {
  const { t } = useTranslation();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchValue, setSearchValue] = useState<string>('');
  const [isFavoriteList, setIsFavoriteList] = useState<boolean>(false);
  const [openChat, setOpenChat] = useState<ChatType | null>(null);

  const handleOpenChat = (chat: ChatType | null) => {
    setOpenChat(chat);
  };

  const handleSwitchFavorite = () => {
    setIsFavoriteList((prev) => !prev);
  };

  const handleSearchWrapperClick = () => {
    // при клике на обертку инпута - передаём фокус на инпут
    searchInputRef.current?.focus();
  };

  return (
    <div className="page chats">
      <div className="chats-header">
        <div className="chats-header__title">
          <span>{isFavoriteList ? t('favorites') : t('chats')}</span>

          <div className="chats__count green">
            <span>
              {isFavoriteList
                ? chatsData.count_unread_favorite
                : chatsData.count_unread}
            </span>
          </div>
        </div>

        <div className="chats__actions">
          <div
            className="chats__search-wrapper blue"
            onClick={handleSearchWrapperClick}
          >
            <img src={searchChatsBlueIcon} alt="Search Chat Icon" />

            <input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              ref={searchInputRef}
              type="text"
              placeholder={t('search')}
              className="chats__search-input"
            />
          </div>

          <button
            className="chats__favorites-btn"
            onClick={handleSwitchFavorite}
          >
            <img
              src={isFavoriteList ? starFilledIcon : starOutlineIcon}
              alt="Star Outline Icon"
            />
          </button>
        </div>
      </div>

      {chatsData.chat_list ? (
        <ChatsList
          list={chatsData.chat_list}
          isFavoriteList={isFavoriteList}
          searchValue={searchValue}
          callbackOpenChat={handleOpenChat}
        />
      ) : (
        <p className="zero-chats-paragraph">{t('zeroChats')}</p>
      )}

      {openChat && <Chat chat={openChat} handleOpenChat={handleOpenChat} />}

      <NavigationSkeleton />
    </div>
  );
};

export default Chats;
