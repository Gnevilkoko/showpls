import arrowLeftIcon from '../../assets/arrow-left.svg';
import starOutlineIcon from '../../assets/star-outline.svg';
import searchChatsBlueIcon from '../../assets/search-chats-blue.svg';
import userIcon from '../../assets/user.svg';
import paperclipIcon from '../../assets/paperclip.svg';
import emojiIcon from '../../assets/emoji.svg';
import sendIcon from '../../assets/send.svg';
import cameraIcon from '../../assets/camera.svg';
import checkGreenIcon from '../../assets/check-green.svg';
import checkReadIcon from '../../assets/check-read.svg';
import checkReadWhiteIcon from '../../assets/check-read-white.svg';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ChatType, DataMessages, Message } from '../../shared/types';

// 1760643736238

const testMessages: Message[] = [
  {
    id: 1,
    type: 'message',
    sender_id: 100,
    receiver_id: 200,
    text: 'Please make sure the photo is clear.',
    attachments: [],
    created_at: 1760453955290,
    is_read: true,
  },
  {
    id: 2,
    type: 'message',
    sender_id: 200,
    receiver_id: 100,
    text: 'On the way now 🚶‍♂',
    attachments: [],
    created_at: 1760453955290,
    is_read: true,
  },
  {
    id: 3,
    type: 'message',
    sender_id: 200,
    receiver_id: 100,
    text: null,
    attachments: [
      'https://maisgrelos.com/wp-content/uploads/2024/08/playas-de-mallorca-baleares.jpeg',
    ],
    created_at: 1760453955290,
    is_read: true,
  },
  {
    id: 4,
    type: 'notification',
    variant: 'upload',
    sender_id: 200,
    receiver_id: 100,
    text: 'Executor have uploaded photo',
    attachments: [],
    created_at: 1760453955290,
    is_read: true,
  },
  {
    id: 5,
    type: 'message',
    sender_id: 200,
    receiver_id: 100,
    text: 'Look! Does it good?',
    attachments: [],
    created_at: 1760453955290,
    is_read: true,
  },
  {
    id: 6,
    type: 'message',
    sender_id: 100,
    receiver_id: 200,
    text: 'Looks great! One more close-up of the prices please.',
    attachments: [],
    created_at: 1760453955290,
    is_read: false,
  },
  {
    id: 7,
    type: 'notification',
    variant: 'newTask',
    sender_id: 100,
    receiver_id: 200,
    text: 'You have received a new task(s).',
    attachments: [],
    created_at: 1760453955290,
    is_read: true,
  },
];

const testDataChatCustomer: DataMessages = {
  chat_id: 1,
  customer: 100,
  executor: 200,
  messages: testMessages,
  has_more: true,
};

interface ChatProps {
  chat: ChatType;
  handleOpenChat: (chat: null) => void;
}

const Chat = ({ chat, handleOpenChat }: ChatProps) => {
  const { t } = useTranslation();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchValue, setSearchValue] = useState<string>('');

  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto'; // сброс перед вычислением
      textarea.style.height = textarea.scrollHeight + 'px'; // установка по содержимому
    }
  }, [value]);

  // здесь должна быть логика запроса к беку

  if (!chat) {
    alert(t('somethingWentWrong'));
    return null;
  }

  const date = new Date(chat.last_update);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const formattedTime = `${hours}:${minutes}`;

  return (
    <div className="chat">
      <div className="chat__header-wrapper">
        <div className="chat__header">
          <div className="chats-header__title">
            <button
              className="chat-header__back-arrow"
              onClick={() => handleOpenChat(null)}
            >
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
                {t('wasOnline')} {formattedTime}
              </span>
            </div>
          </div>

          <div className="chats__actions">
            <div className="chats__search-wrapper blue">
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

            <button className="chats__favorites-btn">
              <img src={starOutlineIcon} alt="Star Outline Icon" />
            </button>
          </div>
        </div>
      </div>

      <div className="chat__container">
        {testDataChatCustomer.messages.map((msg) => {
          const date = new Date(msg.created_at);
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          const formattedTime = `${hours}:${minutes}`;

          return (
            <div
              key={msg.id}
              className={`message__wrapper ${
                msg.sender_id === 100 ? 'right' : 'left'
              }`}
            >
              {msg.type === 'message' && (
                <div
                  className={`message ${msg.sender_id === 100 ? 'green' : ''} ${
                    !msg.text ? 'image' : ''
                  }`}
                >
                  {msg.attachments &&
                    msg.attachments.map((url) => (
                      <img key={url} src={url} alt="Attachments Image" />
                    ))}

                  {msg.text ? (
                    <div className="message__content">
                      <span>{msg.text}</span>

                      <div className="message__info">
                        <span>{formattedTime}</span>

                        {msg.is_read && (
                          <img src={checkReadIcon} alt="Check Read Icon" />
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="message__info-blur">
                      <span>{formattedTime}</span>

                      {msg.is_read && (
                        <img src={checkReadWhiteIcon} alt="Check Read Icon" />
                      )}
                    </div>
                  )}
                </div>
              )}

              {msg.type === 'notification' && (
                <div className="message-notification">
                  <img
                    src={msg.variant === 'upload' ? checkGreenIcon : cameraIcon}
                    alt="Camera Icon"
                  />

                  <span>{msg.text}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="message-input__container">
        <button className="added-attachments-btn">
          <img src={paperclipIcon} alt="Paperclip Icon" />
        </button>

        <div className="message-input__wrapper">
          <textarea
            className="message-input"
            rows={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            ref={textareaRef}
            placeholder={t('message')}
          />

          <button className="message-input__emoji-btn">
            <img src={emojiIcon} alt="Emoji Icon" />
          </button>
        </div>

        <button className="send-message-btn">
          <img src={sendIcon} alt="Send Icon" />
        </button>
      </div>
    </div>
  );
};

export default Chat;
