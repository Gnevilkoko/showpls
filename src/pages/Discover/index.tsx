import { useState } from 'react';
import Header from '../../shared/components/Header';
import cameraIcon from '../../assets/camera.svg';
import starsWhiteIcon from '../../assets/stars-white.svg';
import verifiedCheckIcon from '../../assets/verified-check.svg';
import NavigationSkeleton from '../../shared/components/NavigationSkeleton';
import Map from './Map';
import { useLocation } from 'react-router-dom';

const Discover = () => {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState<'list' | 'map'>(
    location.hash === '#map' ? 'map' : 'list'
  );

  const handleToggle = (val: 'list' | 'map') => {
    setActiveSection(val);
  };

  return (
    <div className="page discover">
      <Header />

      <div className="discover__toggle-bar">
        <button
          className={`toggle-bar__toggle ${
            activeSection === 'list' ? 'active' : ''
          }`}
          onClick={() => handleToggle('list')}
        >
          List
        </button>

        <button
          className={`toggle-bar__toggle ${
            activeSection === 'map' ? 'active' : ''
          }`}
          onClick={() => handleToggle('map')}
        >
          Map
        </button>
      </div>

      {activeSection === 'list' && (
        <>
          <div className="discover__task">
            <div className="task__header">
              <img src={cameraIcon} alt="Camera Icon" />

              <span>Take photo of coffee shop menu board</span>
            </div>

            <div className="task__container">
              <div className="task__content">
                <div className="task__tags-container">
                  <div className="tag badge green">Urgent</div>

                  <div className="tag stars">
                    20
                    <span>
                      <img src={starsWhiteIcon} alt="Stars Icon" />
                    </span>
                  </div>

                  <div className="tag">2h left</div>

                  <div className="tag">1.2 km</div>
                </div>

                <span>
                  Go to BeanCraft and show the full menu board clearly. Payment
                  in escrow.
                </span>
              </div>

              <button className="task__button">Viev details</button>
            </div>
          </div>

          <div className="discover__task">
            <div className="task__header">
              <img src={verifiedCheckIcon} alt="Camera Icon" />

              <span>Verify store opening hours</span>
            </div>

            <div className="task__container">
              <div className="task__content">
                <div className="task__tags-container">
                  <div className="tag badge green">Urgent</div>

                  <div className="tag stars">
                    20
                    <span>
                      <img src={starsWhiteIcon} alt="Stars Icon" />
                    </span>
                  </div>

                  <div className="tag">1.2 km</div>
                </div>

                <span>
                  Check and capture the posted hours at "Daily Mart". Confirm if
                  holiday hours apply.
                </span>
              </div>

              <button className="task__button">Viev details</button>
            </div>
          </div>

          <div className="discover__task">
            <div className="task__header">
              <img src={verifiedCheckIcon} alt="Camera Icon" />

              <span>Translate menu from photo</span>
            </div>

            <div className="task__container">
              <div className="task__content">
                <div className="task__tags-container">
                  <div className="tag badge blue">Remote</div>

                  <div className="tag stars">
                    20
                    <span>
                      <img src={starsWhiteIcon} alt="Stars Icon" />
                    </span>
                  </div>

                  <div className="tag">1.2 km</div>
                </div>

                <span>
                  Lorem ipsum dolor sit amet, consectetur adipisicing elit.
                  Alias cumque natus minima excepturi. Veritatis, soluta aperiam
                  necessitatibus iure consequatur doloribus! Officiis
                  consequuntur et aliquam assumenda possimus natus praesentium
                  omnis iste.
                </span>
              </div>

              <button className="task__button">Viev details</button>
            </div>
          </div>
        </>
      )}

      {activeSection === 'map' && <Map />}

      <NavigationSkeleton />
    </div>
  );
};

export default Discover;
