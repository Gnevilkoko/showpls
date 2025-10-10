import './App.scss';
import './i18n';
import AccessGate from './pages/AccessGate';
import { Navigate, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Navigation from './shared/components/Navigation';
import DevPage from './pages/DevPage';
import Tasks from './pages/Tasks';
import MapProvider from './shared/providers/MapProvider';
import Wallet from './pages/Wallet';
import Profile from './pages/Profile';
import { useAppDispatch, useAppSelector } from './store';
import { useEffect } from 'react';
import { initUserTg } from './store/userSlice';
import { initLanguageFromTg } from './store/languageSlice';

function App() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user.tgData);

  // инициализируем данные юзера
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      dispatch(initUserTg());
    }
  }, [dispatch]);

  // Подхватываем язык из tgData если localStorage пуст
  useEffect(() => {
    dispatch(initLanguageFromTg(user || null));
  }, [user, dispatch]);

  return (
    <MapProvider>
      <div className="app">
        {/* если нет юзера - навигацию не отрисовываем */}
        {user && <Navigation />}

        <Routes>
          {/* Если user нет → открываем AccessGate,
        иначе редиректим на /home */}
          <Route
            path="/"
            element={user ? <Navigate to="/home" replace /> : <AccessGate />}
          />

          {/* Закрытый роут: если user нет – редирект на "/" */}
          <Route
            path="/home"
            element={user ? <Home /> : <Navigate to="/" replace />}
          />
          <Route
            path="/tasks"
            element={user ? <Tasks /> : <Navigate to="/" replace />}
          />
          <Route
            path="/chats"
            element={user ? <DevPage /> : <Navigate to="/" replace />}
          />
          <Route
            path="/wallet"
            element={user ? <Wallet /> : <Navigate to="/" replace />}
          />
          <Route
            path="/profile"
            element={user ? <Profile /> : <Navigate to="/" replace />}
          />
        </Routes>

        {/* dev mode */}
        {/* <Navigation />

        <Routes>
          <Route path="/" element={<AccessGate />} />
          <Route path="/home" element={<Home />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/chats" element={<DevPage />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/profile" element={<Profile />} />
        </Routes> */}
      </div>
    </MapProvider>
  );
}

export default App;
