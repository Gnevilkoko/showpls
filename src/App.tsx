import './App.scss';
import AccessGate from './pages/AccessGate';
import { Navigate, Route, Routes } from 'react-router-dom';
import useUserTg from './shared/hooks/useUserTg';
import Home from './pages/Home';
import Navigation from './shared/components/Navigation';
import DevPage from './pages/DevPage';
import Tasks from './pages/Tasks';
import MapProvider from './shared/providers/MapProvider';
import Wallet from './pages/Wallet';
import Profile from './pages/profile';

function App() {
  const user = useUserTg();

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
