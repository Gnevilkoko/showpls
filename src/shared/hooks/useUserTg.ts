import { useEffect, useState } from 'react';
import type { TgUser } from '../../types/telegram';

const useUserTg = () => {
  const [user, setUser] = useState<TgUser | null>(null);

  // TODO: оязательно сделать проверку данных с помощью Bot API на беке
  useEffect(() => {
    // Telegram SDK доступен только внутри Telegram
    const tg = window.Telegram?.WebApp;

    if (!tg) return;

    // Гарантируем что Mini App развёрнута
    tg.expand();
    const u = tg.initDataUnsafe?.user;

    if (u) {
      setUser(u);
    }
  }, []);

  return user;
};

export default useUserTg;
