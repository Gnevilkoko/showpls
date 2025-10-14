import searchChatsIcon from '../../assets/search-chats.svg';
import searchChatsBlueIcon from '../../assets/search-chats-blue.svg';
import starOutlineIcon from '../../assets/star-outline.svg';
import showplsAgentIcon from '../../assets/logo-without-text.svg';
import { useRef, useState } from 'react';
import userIcon from '../../assets/user.svg';
import checkReadIcon from '../../assets/check-read.svg';
import starBlankIcon from '../../assets/star-blank.svg';
import starFilledIcon from '../../assets/star-filled.svg';
import arrowLeftIcon from '../../assets/arrow-left.svg';
import NavigationSkeleton from '../../shared/components/NavigationSkeleton';
import { useTranslation } from 'react-i18next';

type ChatType = {
  id: number;
  avatar?: string;
  first_name: string;
  last_name?: string;
  last_message: string;
  last_update: number;
  is_favorite: boolean;
  is_active_order: boolean;
  is_read: boolean;
  count_unread?: number;
};

type ChatsDataType = {
  count_unread: number;
  count_unread_favorite: number;
  chat_list: ChatType[];
};

const chatList: ChatType[] = [
  {
    id: 1,
    avatar: showplsAgentIcon,
    first_name: 'Showpls',
    last_name: 'Agent',
    last_message:
      'Lorem ipsum dolor sit amet consectetur adipiscing elit Ut et massa mi. Aliquam in hendrerit urna. Pellentesque sit amet sapien.',
    last_update: 1760453955290,
    is_favorite: false,
    is_active_order: false,
    is_read: true,
  },
  {
    id: 2,
    first_name: 'Name no surname',
    last_message: 'Lorem ipsum dolor sit amet consectetur',
    last_update: 1760453955290,
    is_favorite: true,
    is_active_order: true,
    count_unread: 1,
    is_read: false,
  },
  {
    id: 3,
    avatar:
      'https://t.me/i/userpic/320/q4sKbvOxAfs1GzG1BvCxGsS2dLs62WaTHYUrqguxs_M.svg',
    first_name: 'Name',
    last_name: 'Surname',
    last_message:
      'Lorem ipsum dolor sit amet consectetur adipiscing elit Ut et massa mi. Aliquam in hendrerit urna. Pellentesque sit amet sapien.',
    last_update: 1760453955290,
    is_favorite: false,
    is_active_order: false,
    is_read: true,
  },
  {
    id: 4,
    first_name: 'Name',
    last_name: 'Surname',
    last_message: 'Lorem ipsum dolor sit amet consectetur',
    last_update: 1760453955290,
    is_favorite: true,
    is_active_order: true,
    is_read: true,
  },
  {
    id: 5,
    first_name: 'Name',
    last_name: 'Surname',
    last_message:
      'Lorem ipsum dolor sit amet consectetur adipiscing elit Ut et massa mi. Aliquam in hendrerit urna. Pellentesque sit amet sapien.',
    last_update: 1760453955290,
    is_favorite: false,
    is_active_order: true,
    count_unread: 15,
    is_read: false,
  },
  {
    id: 6,
    first_name: 'Name',
    last_name: 'Surname',
    last_message:
      'Lorem ipsum dolor sit amet consectetur adipiscing elit Ut et massa mi. Aliquam in hendrerit urna. Pellentesque sit amet sapien.',
    last_update: 1760453955290,
    is_favorite: false,
    is_active_order: false,
    is_read: true,
  },
  {
    id: 7,
    first_name: 'Name',
    last_name: 'Surname',
    last_message:
      'Lorem ipsum dolor sit amet consectetur adipiscing elit Ut et massa mi. Aliquam in hendrerit urna. Pellentesque sit amet sapien.',
    last_update: 1760453955290,
    is_favorite: true,
    is_active_order: false,
    is_read: true,
  },
  {
    id: 8,
    first_name: 'Name',
    last_name: 'Surname',
    last_message:
      'Lorem ipsum dolor sit amet consectetur adipiscing elit Ut et massa mi. Aliquam in hendrerit urna. Pellentesque sit amet sapien.',
    last_update: 1760453955290,
    is_favorite: false,
    is_active_order: false,
    count_unread: 4,
    is_read: false,
  },
  {
    id: 9,
    first_name: 'Name',
    last_name: 'Surname',
    last_message:
      'Lorem ipsum dolor sit amet consectetur adipiscing elit Ut et massa mi. Aliquam in hendrerit urna. Pellentesque sit amet sapien.',
    last_update: 1760453955290,
    is_favorite: false,
    is_active_order: false,
    is_read: true,
  },
  {
    id: 10,
    first_name: 'Name',
    last_name: 'Surname',
    last_message:
      'Lorem ipsum dolor sit amet consectetur adipiscing elit Ut et massa mi. Aliquam in hendrerit urna. Pellentesque sit amet sapien.',
    last_update: 1760453955290,
    is_favorite: false,
    is_active_order: false,
    is_read: true,
  },
];

const chatsData: ChatsDataType = {
  count_unread: 3,
  count_unread_favorite: 1,
  chat_list: chatList,
};

const Chats = () => {
  const { t } = useTranslation();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isFavoriteList, setIsFavoriteList] = useState<boolean>(false);
  const [searchValue, setSearchValue] = useState<string>('');

  const handleSwitchFavorite = () => {
    setIsFavoriteList((prev) => !prev);
  };

  const handleSearchWrapperClick = () => {
    // при клике на обертку инпута - передаём фокус на инпут
    searchInputRef.current?.focus();
  };

  // фильтруем список на избранные, совпадения в поиске,
  // если фильтров нет - возвращает все значения
  const filteredChats =
    chatsData.chat_list?.filter((chat) => {
      if (isFavoriteList && !chat.is_favorite) return false;

      if (searchValue) {
        const normalized = searchValue.toLowerCase();
        const hasValue =
          chat.first_name.toLowerCase().includes(normalized) ||
          chat.last_name?.toLowerCase().includes(normalized) ||
          chat.last_message.toLowerCase().includes(normalized);
        return hasValue;
      }

      return true; // если searchValue пуст, оставляем всё
    }) || []; // гарантирует, что вернется всегда массив, даже если данных нет

  return (
    <div className="page chats">
      <div className="chats-header">
        <div className="chats-header__title">
          {isFavoriteList && (
            <button
              className="chats-header__back-arrow"
              onClick={handleSwitchFavorite}
            >
              <img src={arrowLeftIcon} alt="Arrow Left Icon" />
            </button>
          )}

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
            className={`chats__search-wrapper ${
              isFavoriteList ? 'gray' : 'blue'
            }`}
            onClick={handleSearchWrapperClick}
          >
            <img
              src={isFavoriteList ? searchChatsIcon : searchChatsBlueIcon}
              alt="Search Chat Icon"
            />

            <input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              ref={searchInputRef}
              type="text"
              placeholder={t('search')}
              className="chats__search-input"
            />
          </div>

          {!isFavoriteList && (
            <button
              className="chats__favorites-btn"
              onClick={handleSwitchFavorite}
            >
              <img src={starOutlineIcon} alt="Star Outline Icon" />
            </button>
          )}
        </div>
      </div>

      {!chatsData.chat_list && (
        <p className="zero-chats-paragraph">{t('zeroChats')}</p>
      )}

      {filteredChats.length > 0 ? (
        filteredChats.map((chat) => {
          const date = new Date(chat.last_update);
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          const formattedTime = `${hours}:${minutes}`;

          return (
            <div
              key={chat.id}
              className={`chats__prev-chat ${
                chat.is_active_order ? 'active-order' : ''
              }`}
            >
              <img
                src={chat.avatar ? chat.avatar : userIcon}
                alt="User Avatar"
                className="prev-chat__avatar"
              />

              <div className="prev-chat__wrapper">
                <div className="prev-chat__header">
                  <span className="prev-chat__name-user">
                    {chat.first_name} {chat.last_name ? chat.last_name : ''}
                  </span>

                  <div className="prev-chat__info">
                    {chat.is_read ? (
                      <img src={checkReadIcon} alt="Check Read Icon" />
                    ) : (
                      ''
                    )}

                    <span>{formattedTime}</span>

                    <button className="prev-chat__favorite-btn">
                      <img
                        src={chat.is_favorite ? starFilledIcon : starBlankIcon}
                        alt="Favorite Icon"
                      />
                    </button>
                  </div>
                </div>

                <div className="prev-chat__content">
                  <span className="prev-chat__message">
                    {chat.last_message}
                  </span>

                  {chat.count_unread ? (
                    <div className="chats__count blue">
                      <span>{chat.count_unread}</span>
                    </div>
                  ) : (
                    ''
                  )}
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <p className="zero-chats-paragraph">{t('noChatsFound')}</p>
      )}

      <NavigationSkeleton />
    </div>
  );
};

export default Chats;
