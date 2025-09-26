import { useEffect, useState } from 'react';
import './App.scss';
import type { TgUser } from './types/telegram';
import AccessGate from './pages/AccessGate';

function App() {
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

  return (
    <div className="app">
      {!user ? (
        <AccessGate />
      ) : (
        <>
          <h1>Привет, {user.first_name}!</h1>
          <p>ID: {user.id}</p>
          {user.username && <p>@{user.username}</p>}
        </>
      )}
    </div>
  );
}

export default App;
