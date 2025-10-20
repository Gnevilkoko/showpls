import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ChatType, Message } from '../../../shared/types';
import ChatHeader from '../components/ChatHeader';
import MessageItem from '../components/MessageItem';
import MessageInput from '../components/MessageInput';
import arrowDownGreenIcon from '../../../assets/arrow-down-green.svg';
import { chatData } from '../data/chatData';
import MiniMapContainer from '../../Tasks/MiniMapContainer';
import checkWhiteIcon from '../../../assets/check-white.svg';
import cameraWhiteIcon from '../../../assets/camera-white.svg';
import menuDotsIcon from '../../../assets/menu-dots.svg';
import starsWhiteIcon from '../../../assets/stars-white.svg';

interface ChatProps {
  chat: ChatType;
  handleOpenChat: (chat: null) => void;
}

const Chat = ({ chat, handleOpenChat }: ChatProps) => {
  // здесь нужно брать свой айдишник из user
  const userId = 100;

  const { t } = useTranslation();
  const [searchValue, setSearchValue] = useState<string>('');
  const [value, setValue] = useState('');

  const [isOpenTask, setIsOpenTask] = useState<boolean>(false);
  const handleClickTaskShow = () => {
    setIsOpenTask((prev) => !prev);
  };

  const chatdataItem = chatData.find((i) => i.chat_id === chat.chat_id);

  if (!chat) {
    alert(t('somethingWentWrong'));
    return null;
  }

  return (
    <div className="chat">
      <ChatHeader
        chat={chat}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onBack={() => handleOpenChat(null)}
      />

      {chat.order && (
        <div className="chat__task-wrapper">
          <div className="chat__task-heder">
            <span>{t('taskDetails')}</span>

            <button
              className={`chat__task-show-btn ${isOpenTask ? 'rotated' : ''}`}
              onClick={handleClickTaskShow}
            >
              <span>{isOpenTask ? t('hide') : t('show')}</span>

              <img src={arrowDownGreenIcon} alt="Arrow Down Icon" />
            </button>
          </div>

          {isOpenTask && (
            <div className="chat__task-container">
              <div className="chat__task-info__wrapper">
                <div className="chat__task-info">
                  <span className="chat__task-info__title">
                    {chat.order?.title}
                  </span>

                  <span className="chat__task-info__description">
                    {chat.order?.description}
                  </span>
                </div>

                <div className="chat__task-tags">
                  {chat.order.tags.map((tag, index) => {
                    if (tag.type === 'stars') {
                      return (
                        <div key={index} className="tag stars">
                          {chat.order?.price}

                          <span>
                            <img src={starsWhiteIcon} alt="Stars Icon" />
                          </span>
                        </div>
                      );
                    }

                    if (tag.type === 'hLeft') {
                      return (
                        <div key={index} className="tag">
                          {t('tasksPage.hLeft', { count: tag.count })}
                        </div>
                      );
                    }
                  })}
                </div>
              </div>

              <MiniMapContainer address={''} />

              <div className="chat__task__actions">
                <button className="chat__task__first-action-btn">
                  <img
                    src={
                      chat.order.customer_id === userId
                        ? checkWhiteIcon
                        : cameraWhiteIcon
                    }
                    alt="Check Icon"
                  />

                  <span>
                    {chat.order.customer_id === userId
                      ? t('acceptJob')
                      : t('upload')}
                  </span>
                </button>

                <button className="chat__task__second-action-btn">
                  <img src={menuDotsIcon} alt="Menu Dots Icon" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="chat__container">
        {chatdataItem?.messages.map((msg: Message) => (
          <MessageItem key={msg.id} message={msg} />
        ))}
      </div>

      <MessageInput value={value} onChange={setValue} />
    </div>
  );
};

export default Chat;
