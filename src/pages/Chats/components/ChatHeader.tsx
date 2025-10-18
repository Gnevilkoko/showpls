import arrowLeftIcon from '../../../assets/arrow-left.svg';
import starOutlineIcon from '../../../assets/star-outline.svg';
import searchChatsBlueIcon from '../../../assets/search-chats-blue.svg';
import userIcon from '../../../assets/user.svg';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { ChatType } from '../../../shared/types';
import { formatTimeFromEpochMs } from '../../../shared/format';

type ChatHeaderProps = {
  chat: ChatType;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onBack: () => void;
};

const ChatHeader = ({
  chat,
  searchValue,
  onSearchChange,
  onBack,
}: ChatHeaderProps) => {
  const { t } = useTranslation();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const lastOnline = formatTimeFromEpochMs(chat.last_update);

  return (
    <div className="chat__header">
      <div className="chats-header__title">
        <button className="chat-header__back-arrow" onClick={onBack}>
          <img src={arrowLeftIcon} alt="Arrow Left Icon" />
        </button>

        <img
          src={chat.avatar ? chat.avatar : userIcon}
          alt="User Avatar"
          className="chat__avatar"
        />

        <div className="chat-header__user-info">
          <span className="chat-header__name-user">
            {chat.first_name} {chat.last_name && chat.last_name}
          </span>

          <span className="chat-header__online-status">
            {t('wasOnline')} {lastOnline}
          </span>
        </div>
      </div>

      <div className="chats__actions">
        <div className="chats__search-wrapper blue">
          <img src={searchChatsBlueIcon} alt="Search Chat Icon" />

          <input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            ref={searchInputRef}
            type="text"
            placeholder={t('search')}
            className="chats__search-input"
          />
        </div>

        <button className="chats__favorites-btn">
          <img src={starOutlineIcon} alt="Star Outline Icon" />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
