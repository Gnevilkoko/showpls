import { useNavigate } from 'react-router-dom';
import useUserTg from '../hooks/useUserTg';
import logo from '../../assets/logo.svg';
import checkIcon from '../../assets/check-icon.svg';
import userIcon from '../../assets/user.svg';

const Header = () => {
  const user = useUserTg();

  const navigate = useNavigate();

  const handleClickAvatar = () => {
    navigate('/profile');
  };

  return (
    <div className="main-header">
      <img src={logo} alt="Showpls Logo" className="default-logo" />

      <div className="avatar-container" onClick={handleClickAvatar}>
        <img src={user?.photo_url || userIcon} alt="" className="avatar" />

        <img src={checkIcon} alt="Check Icon" className="avatar__check" />
      </div>
    </div>
  );
};

export default Header;
