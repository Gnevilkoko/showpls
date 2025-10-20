import type { ChatType } from '../../../shared/types';
import userIcon from '../../../assets/user.svg';
import checkReadIcon from '../../../assets/check-read.svg';
import starBlankIcon from '../../../assets/star-blank.svg';
import starFilledIcon from '../../../assets/star-filled.svg';
import { formatTimeFromEpochMs } from '../../../shared/format';

interface ChatPrevItemProps {
  chat: ChatType;
  callbackOpenChat: (chat: ChatType) => void;
}

const ChatItem = ({ chat, callbackOpenChat }: ChatPrevItemProps) => {
  const time = formatTimeFromEpochMs(chat.last_update);

  return (
    <div
      className={`chats__prev-chat ${
        chat.is_active_order ? 'active-order' : ''
      }`}
      onClick={() => callbackOpenChat(chat)}
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
            {chat.is_read && <img src={checkReadIcon} alt="Check Read Icon" />}

            <span>{time}</span>

            <button className="prev-chat__favorite-btn">
              <img
                src={chat.is_favorite ? starFilledIcon : starBlankIcon}
                alt="Favorite Icon"
              />
            </button>
          </div>
        </div>

        <div className="prev-chat__content">
          <span className="prev-chat__message">{chat.last_message}</span>

          {chat.count_unread && (
            <div className="chats__count blue">
              <span>{chat.count_unread}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatItem;
