import { useAppSelector } from '../store';

const DevPage = () => {
  const user = useAppSelector((state) => state.user.tgData);

  if (!user) {
    return <div>Вы не авторизованы</div>;
  }

  return (
    <div>
      <h1>
        Привет, {user.first_name} {user.last_name}!
      </h1>
      <h2>Эта страница еще не готова</h2>
      <p>Ваш username: {user.username}</p>
      <p>Ваш ID: {user.id}</p>
      <p>Ваш язык: {user.language_code}</p>
    </div>
  );
};

export default DevPage;
