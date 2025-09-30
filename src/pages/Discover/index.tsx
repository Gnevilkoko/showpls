import { useEffect, useRef, useState } from 'react';
import Header from '../../shared/components/Header';
import starsWhiteIcon from '../../assets/stars-white.svg';
import NavigationSkeleton from '../../shared/components/NavigationSkeleton';
import { useLocation } from 'react-router-dom';
import MapContainer from './MapContainer';
import { TasksList } from './tasks';

const Discover = () => {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState<'list' | 'map'>(
    location.hash === '#map' ? 'map' : 'list'
  );

  // Хранит id активной таски
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  // Создаём ref для каждой таски в списке и на карте
  const listTaskRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const mapTaskRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleToggle = (val: 'list' | 'map') => {
    setActiveSection(val);
  };

  // При выборе таски из списка
  const handleTaskClick = (taskId: string) => {
    setActiveTaskId(taskId); // отметить активную таску
    setActiveSection('map'); // переключить вкладку на карту
  };

  // Прокрутка к активной таске в горизонтальном списке под картой
  useEffect(() => {
    if (activeSection === 'map' && activeTaskId) {
      const ref = mapTaskRefs.current[activeTaskId];
      if (ref) {
        ref.scrollIntoView({ behavior: 'smooth', inline: 'center' });
      }
    }
  }, [activeSection, activeTaskId]);

  // Прокрутка к активной таске при возврате в список
  useEffect(() => {
    if (activeSection === 'list' && activeTaskId) {
      const ref = listTaskRefs.current[activeTaskId];
      if (ref) {
        ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeSection, activeTaskId]);

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

      {activeSection === 'list' &&
        TasksList.map((task) => (
          <div
            key={task.id}
            className="discover__task"
            ref={(el) => {
              listTaskRefs.current[task.id] = el;
            }}
          >
            <div className="task__header">
              <img src={task.icon} alt="Task Icon" />
              <span>{task.title}</span>
            </div>

            <div className="task__container">
              <div className="task__content">
                <div className="task__tags-container">
                  {task.tags.map((tag, index) => {
                    if (tag.type === 'badge') {
                      return (
                        <div key={index} className={`tag badge ${tag.color}`}>
                          {tag.label}
                        </div>
                      );
                    }

                    if (tag.type === 'stars') {
                      return (
                        <div key={index} className="tag stars">
                          {task.price}
                          <span>
                            <img src={starsWhiteIcon} alt="Stars Icon" />
                          </span>
                        </div>
                      );
                    }

                    if (tag.type === 'text') {
                      return (
                        <div key={index} className="tag">
                          {tag.label}
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>

                <span>{task.description}</span>
              </div>

              <button
                className="task__button"
                onClick={() => handleTaskClick(task.id)}
              >
                View details
              </button>
            </div>
          </div>
        ))}

      {activeSection === 'map' && (
        <>
          <MapContainer
            activeTaskId={activeTaskId} // id активной таски
            setActiveTaskId={setActiveTaskId} // при клике на маркер
          />

          <div className="map-tasks-wrapper">
            <div className="map-tasks-container">
              {TasksList.map((task) => (
                <div
                  key={task.id}
                  className="discover__task"
                  ref={(el) => {
                    mapTaskRefs.current[task.id] = el;
                  }}
                  onClick={() => handleTaskClick(task.id)}
                >
                  <div className="task__header">
                    <img src={task.icon} alt="Task Icon" />
                    <span>{task.title}</span>
                  </div>
                  <div className="task__container">
                    <div className="task__content">
                      <div className="task__tags-container">
                        {task.tags.map((tag, index) => {
                          if (tag.type === 'badge') {
                            return (
                              <div
                                key={index}
                                className={`tag badge ${tag.color}`}
                              >
                                {tag.label}
                              </div>
                            );
                          }
                          if (tag.type === 'stars') {
                            return (
                              <div key={index} className="tag stars">
                                {task.price}
                                <span>
                                  <img src={starsWhiteIcon} alt="Stars Icon" />
                                </span>
                              </div>
                            );
                          }
                          if (tag.type === 'text') {
                            return (
                              <div key={index} className="tag">
                                {tag.label}
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <NavigationSkeleton />
          </div>
        </>
      )}

      <NavigationSkeleton />
    </div>
  );
};

export default Discover;
