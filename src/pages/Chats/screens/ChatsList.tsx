import { useEffect, useMemo, useState } from 'react';
import type { ChatType } from '../../../shared/types';
import { useInView } from 'react-intersection-observer';
import { useTranslation } from 'react-i18next';
import ChatItem from '../components/ChatItem';
import showplsAgentIcon from '../../../assets/logo-without-text.svg';

interface ChatsListProps {
  list: ChatType[];
  isFavoriteList: boolean;
  searchValue: string;
  callbackOpenChat: (chat: ChatType) => void;
}

const showplsAgentChat = {
  chat_id: 1,
  avatar: showplsAgentIcon,
  first_name: 'Showpls',
  last_name: 'Agent',
  last_message:
    'Lorem ipsum dolor sit amet consectetur adipiscing elit Ut et massa mi. Aliquam in hendrerit urna. Pellentesque sit amet sapien.',
  last_update: 1760453955290,
  is_favorite: false,
  is_active_order: false,
  order: null,
  is_read: true,
  count_unread: null,
};

const ChatsList = ({
  list,
  isFavoriteList,
  searchValue,
  callbackOpenChat,
}: ChatsListProps) => {
  const { t } = useTranslation();
  const countVisibleChats = 10;
  const [visibleCount, setVisibleCount] = useState(countVisibleChats);
  const { ref, inView } = useInView({
    threshold: 0,
  });

  // фильтруем список на избранные, совпадения в поиске,
  // если фильтров нет - возвращает все значения
  const filteredChats = useMemo(() => {
    return (
      list
        .filter((chat) => {
          if (isFavoriteList && !chat.is_favorite) return false;

          if (searchValue) {
            const normalized = searchValue.toLowerCase();
            const hasValue =
              chat.first_name.toLowerCase().includes(normalized) ||
              chat.last_name?.toLowerCase().includes(normalized) ||
              chat.last_message.toLowerCase().includes(normalized);
            return hasValue;
          }

          return true;
        })
        // сортировка: сначала активные ордеры, потом остальные
        .sort((a, b) => Number(b.is_active_order) - Number(a.is_active_order))
    );
  }, [list, isFavoriteList, searchValue]);

  // Сброс видимого количества при изменении фильтра или поиска
  useEffect(() => {
    setVisibleCount(countVisibleChats);
  }, [searchValue, isFavoriteList]);

  const visibleChats = useMemo(
    () => filteredChats.slice(0, visibleCount),
    [filteredChats, visibleCount]
  );

  // Подгрузка новых чатов при достижении низа
  useEffect(() => {
    if (inView) {
      setVisibleCount((prev) =>
        // позволяет не подгружать более чем вообще существует в списке
        Math.min(prev + countVisibleChats, filteredChats.length)
      );
    }
  }, [inView, filteredChats.length]);

  return (
    <div className="chats-list">
      <ChatItem chat={showplsAgentChat} callbackOpenChat={callbackOpenChat} />

      {visibleChats.length > 0 ? (
        visibleChats.map((chat: ChatType) => (
          <ChatItem
            key={chat.chat_id}
            chat={chat}
            callbackOpenChat={callbackOpenChat}
          />
        ))
      ) : (
        <p className="zero-chats-paragraph">{t('noChatsFound')}</p>
      )}

      <p
        ref={ref}
        className={`loading-chats-paragraph ${
          visibleCount < filteredChats.length ? 'visible' : ''
        }`}
      >
        {t('loadingChats')}
      </p>
    </div>
  );
};

export default ChatsList;
