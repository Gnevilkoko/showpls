import './App.scss';
import AccessGate from './pages/AccessGate';
import { Navigate, Route, Routes } from 'react-router-dom';
import useUserTg from './shared/hooks/useUserTg';
import Home from './pages/Home';
import Navigation from './shared/components/Navigation';
import DevPage from './pages/DevPage';

function App() {
  const user = useUserTg();

  return (
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
          path="/discover"
          element={user ? <DevPage /> : <Navigate to="/" replace />}
        />
        <Route
          path="/wallet"
          element={user ? <DevPage /> : <Navigate to="/" replace />}
        />
        <Route
          path="/profile"
          element={user ? <DevPage /> : <Navigate to="/" replace />}
        />
      </Routes>

      {/* <AccessGate /> */}
      {/* <Navigation /> */}
      {/* <Home /> */}
    </div>
  );
}

export default App;
