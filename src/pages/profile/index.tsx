import profileBg from '../../assets/profile-bg.webp';
import useUserTg from '../../shared/hooks/useUserTg';
import userIcon from '../../assets/user.svg';
import locationGreenIcon from '../../assets/location-green.svg';
import statsStarWhiteIcon from '../../assets/stats-star-white.svg';
import penIcon from '../../assets/pen.svg';
import forwardIcon from '../../assets/forward.svg';
import likeTagIcon from '../../assets/like-tag.svg';
import walletIcon from '../../assets/wallet-new.svg';
import boxIcon from '../../assets/box.svg';
import securitySafeIcon from '../../assets/security-safe.svg';
import notificationIcon from '../../assets/notification.svg';
import globalLangIcon from '../../assets/global-lang.svg';
import supportIcon from '../../assets/support.svg';
import documentTextIcon from '../../assets/document-text.svg';
import messageQuestionIcon from '../../assets/message-question.svg';
import arrowRightIcon from '../../assets/arrow-right-white.svg';
// import type { TgUser } from '../../types/telegram';
import { useState } from 'react';
import MiniWallet from '../../shared/components/MiniWallet';
import ToggleProfileMode from '../../shared/components/ToggleProfileMode';
import NavigationSkeleton from '../../shared/components/NavigationSkeleton';
import { useNavigate } from 'react-router-dom';

// const userTest: TgUser = {
//   id: 1111111,
//   first_name: 'Alexandra',
//   last_name: 'Johnson',
//   username: '@test123',
//   language_code: 'ru',
//   photo_url:
//     'https://t.me/i/userpic/320/q4sKbvOxAfs1GzG1BvCxGsS2dLs62WaTHYUrqguxs_M.svg',
// };

const Profile = () => {
  const navigate = useNavigate();
  const user = useUserTg();
  // const userFromTg = useUserTg();
  // const [user, setUser] = useState(userFromTg || userTest);

  const [isReady, setIsReady] = useState(true);

  const [activeMode, setActiveMode] = useState<'customer' | 'performer'>(
    'performer'
  );

  if (!user) {
    return <div>Вы не авторизованы</div>;
  }

  return (
    <div className="page profile">
      <img src={profileBg} alt="Background Profile" className="profile-bg" />

      <div className="profile-data_container">
        <div className="profile__avatar-container">
          <img
            src={user.photo_url || userIcon}
            alt="Profile Avatar"
            className="profile__avatar"
          />

          <div className="stats-star">
            <span>4.8</span>

            <img src={statsStarWhiteIcon} alt="Stats Star Icon" />
          </div>
        </div>

        <div className="profile__info-container">
          <span className="profile__name">
            {user.first_name} {user.last_name ? user.last_name : ''}
          </span>

          <div className="profile__location">
            <img src={locationGreenIcon} alt="Location Icon" />

            <span>Istanbul, Turkey</span>
          </div>

          <span className="profile__status-profession">
            freelancer photographer
          </span>
        </div>
      </div>

      <div className="profile-actions">
        <button className="profile-actions__button">
          <img src={penIcon} alt="Pen Icon" />

          <span>Edit</span>
        </button>

        <button className="profile-actions__button">
          <img src={forwardIcon} alt="Forward Icon" />

          <span>Share</span>
        </button>
      </div>

      <button className="profile-actions__button">
        <img src={likeTagIcon} alt="Like Tag Icon" />

        <span>Reviews</span>
      </button>

      <MiniWallet />

      <div className="profile__menu">
        <ToggleProfileMode
          activeMode={activeMode}
          callback={setActiveMode}
          isProfile={true}
        />

        {activeMode === 'performer' && (
          <div className="profile-mode__description-container">
            <div className="profile-mode__description">
              <div className="description__title">Ready to work</div>

              <span>
                When enabled, your profile appears on the global map of
                available performers near your location.
              </span>
            </div>

            <div>
              <label className="toggle-switch-urgent">
                <input
                  type="checkbox"
                  checked={isReady}
                  onChange={() => setIsReady((val) => !val)}
                />
                <span className="slider" />
              </label>
            </div>
          </div>
        )}

        <div className="profile__options-wrapper">
          <div className="dash" />

          <div className="profile__option" onClick={() => navigate('/wallet')}>
            <div className="profile__option-content">
              <img src={walletIcon} alt="Wallet Icon" />

              <span>Wallet</span>
            </div>

            <img src={arrowRightIcon} alt="Arrow Right Icon" />
          </div>

          <div className="profile__option">
            <div className="profile__option-content">
              <img src={boxIcon} alt="Box Icon" />

              <span>My orders</span>
            </div>

            <img src={arrowRightIcon} alt="Arrow Right Icon" />
          </div>

          <div className="profile__option">
            <div className="profile__option-content">
              <img src={securitySafeIcon} alt="Security Safe Icon" />

              <span>Verification</span>
            </div>

            <img src={arrowRightIcon} alt="Arrow Right Icon" />
          </div>

          <div className="profile__option">
            <div className="profile__option-content">
              <img src={notificationIcon} alt="Security Safe Icon" />

              <span>Notitfications</span>
            </div>

            <div className="profile__option-count">2</div>

            <img src={arrowRightIcon} alt="Arrow Right Icon" />
          </div>

          <div className="dash" />

          <div className="profile__option">
            <div className="profile__option-content">
              <img src={globalLangIcon} alt="Global Lang Icon" />

              <span>Language</span>
            </div>

            <div className="profile__option-value">en</div>

            <img src={arrowRightIcon} alt="Arrow Right Icon" />
          </div>

          <div className="profile__option">
            <div className="profile__option-content">
              <img src={supportIcon} alt="Support Icon" />

              <span>Support</span>
            </div>

            <img src={arrowRightIcon} alt="Arrow Right Icon" />
          </div>

          <div className="profile__option">
            <div className="profile__option-content">
              <img src={messageQuestionIcon} alt="Support Icon" />

              <span>About</span>
            </div>

            <img src={arrowRightIcon} alt="Arrow Right Icon" />
          </div>

          <div className="dash" />

          <div className="profile__option">
            <div className="profile__option-content">
              <img src={documentTextIcon} alt="Support Icon" />

              <span>Privacy & Security</span>
            </div>

            <img src={arrowRightIcon} alt="Arrow Right Icon" />
          </div>
        </div>
      </div>

      <button className="specials_button">Log out</button>

      <NavigationSkeleton />
    </div>
  );
};

export default Profile;
