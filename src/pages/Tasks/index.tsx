import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import Header from '../../shared/components/Header';
import starsWhiteIcon from '../../assets/stars-white.svg';
import pencilIcon from '../../assets/pencil.svg';
import attachIcon from '../../assets/attach.svg';
import locationIcon from '../../assets/location.svg';
import clockIcon from '../../assets/clock.svg';
import coinsIcon from '../../assets/coins.svg';
import plusActionBannerIcon from '../../assets/plus-action-banner.svg';
import searchActionBannerIcon from '../../assets/search-action-banner.svg';
import NavigationSkeleton from '../../shared/components/NavigationSkeleton';
import { useLocation } from 'react-router-dom';
import MapContainer from './MapContainer';
import { TasksList } from './tasks';
import ToggleProfileMode from '../../shared/components/ToggleProfileMode';
import MiniMapContainer from './MiniMapContainer';
import { TIME_LIMITS } from '../../constants';
import { useTranslation } from 'react-i18next';

interface UploadedImage {
  file: File;
  url: string;
}

const Tasks = () => {
  const location = useLocation();
  const locationState = location.state;
  const { t } = useTranslation();

  const [activeMode, setActiveMode] = useState<'customer' | 'performer'>(
    locationState?.mode === 'createTask' ? 'customer' : 'performer'
  );

  const [activeSection, setActiveSection] = useState<'list' | 'map'>('list');
  const handleClickOption = (val: 'list' | 'map') => {
    setActiveSection(val);
  };

  // Хранит id активной таски
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  // Создаём ref для каждой таски в списке и на карте
  const listTaskRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const mapTaskRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // const handleToggle = (val: 'list' | 'map') => {
  //   setActiveSection(val);
  // };

  // При выборе таски из списка
  const handleTaskClick = (taskId: string) => {
    setActiveTaskId(taskId); // отметить активную таску
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

  const [images, setImages] = useState<UploadedImage[]>([]);

  const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: UploadedImage[] = Array.from(files).map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...newImages]);
  };

  const handleRemove = (url: string) => {
    setImages((prev) => prev.filter((img) => img.url !== url));
  };

  const [timeLimit, setTimeLimit] = useState<string>('');
  const [isOpenDropdown, setIsOpenDropdown] = useState(false);

  const handleSelectDropdown = (val: number) => {
    setTimeLimit(val.toString());
    setIsOpenDropdown(false);
  };

  const [isUrgent, setIsUrgent] = useState(true);

  const [address, setAddress] = useState('');
  return (
    <div className="page tasks">
      <Header />

      <h1 className="tasks-page-title">
        {activeMode === 'customer'
          ? t('tasksPage.customerTitlePage')
          : t('tasksPage.performerTitlePage')}
      </h1>

      <ToggleProfileMode
        activeMode={activeMode}
        callback={(val: 'customer' | 'performer') => setActiveMode(val)}
      />

      {activeMode === 'customer' && (
        <>
          <div className="customer-banner">
            <div className="describe__content">
              <div className="customer-banner__title">
                <img src={pencilIcon} alt="Pencil Icon" />

                <span>{t('tasksPage.describeTask')}</span>
              </div>

              <textarea
                className="describe__input"
                placeholder={t('tasksPage.placeholderTask')}
              />
            </div>

            <div className="customer-banner__description-container">
              {/* Кнопка загрузки */}
              <label className="describe__upload-button">
                <img src={attachIcon} alt="Attach Icon" />

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleUpload}
                  style={{ display: 'none' }}
                />
              </label>

              {/* Превью изображений */}
              {images.length !== 0 && (
                <div className="describe__preview-container">
                  {images.map((img, idx) => (
                    <>
                      <div key={idx} className="preview-item">
                        <img src={img.url} alt={`preview-${idx}`} />

                        <button
                          className="btn-remove-img"
                          onClick={() => handleRemove(img.url)}
                        >
                          x
                        </button>
                      </div>
                    </>
                  ))}
                </div>
              )}

              {images.length === 0 && (
                <div className="customer-banner__description">
                  <div className="description__title">
                    {t('tasksPage.addFiles')}
                  </div>

                  <span>{t('tasksPage.filesDescription')}</span>
                </div>
              )}
            </div>
          </div>

          <div className="customer-banner">
            <div className="customer-banner__title">
              <img src={locationIcon} alt="Location Icon" />

              <span>{t('tasksPage.location')}</span>
            </div>

            <input
              type="text"
              className="input-location"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t('tasksPage.locationPlaceholder')}
            />

            <p className="customer-banner__paragraph">
              {t('tasksPage.orMarkMap')}
            </p>

            <MiniMapContainer address={address} />
          </div>

          <div className="customer-banner">
            <div className="customer-banner__title">
              <img src={clockIcon} alt="Location Icon" />

              <span>{t('tasksPage.timeLimit')}</span>
            </div>

            <div className="dropdown-wrapper">
              <input
                type="text"
                value={
                  timeLimit &&
                  `${timeLimit} ${timeLimit === '1' ? 'hour' : 'hours'}`
                }
                onClick={() => setIsOpenDropdown((val) => !val)}
                onBlur={() => setTimeout(() => setIsOpenDropdown(false), 100)}
                onChange={(e) => setTimeLimit(e.target.value)}
                placeholder={t('tasksPage.addDuration')}
                className="dropdown-input"
                readOnly // только выбор из списка, чтобы нельзя было писать вручную
              />

              {isOpenDropdown && (
                <ul className="dropdown-menu">
                  {TIME_LIMITS.map((num) => (
                    <li
                      key={num}
                      onMouseDown={() => handleSelectDropdown(num)}
                      className="dropdown-item"
                    >
                      {num === 1
                        ? `${num} ${t('tasksPage.hour')}`
                        : `${num} ${t('tasksPage.hours')}`}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="customer-banner__description-container">
              <div className="customer-banner__description">
                <span className="description__title">
                  {t('tasksPage.urgent')}
                </span>

                <span>{t('tasksPage.urgentDescription')}</span>
              </div>

              <div>
                <label className="toggle-switch-urgent">
                  <input
                    type="checkbox"
                    checked={isUrgent}
                    onChange={() => setIsUrgent((val) => !val)}
                  />
                  <span className="slider" />
                </label>
              </div>
            </div>
          </div>

          <div className="customer-banner">
            <div className="customer-banner__title">
              <img src={coinsIcon} alt="Location Icon" />

              <span>{t('tasksPage.budget')}</span>
            </div>

            <input
              type="number"
              inputMode="numeric" // открывает цифровую клавиатуру на мобилках
              placeholder={t('tasksPage.budgetPlaceholder')}
              className="budget-input"
            />
          </div>

          <button className="customer__btn green">
            <img
              src={plusActionBannerIcon}
              alt="Create Request Icon"
              className="action-banner__icon"
            />

            <span>{t('tasksPage.publishRequest')}</span>
          </button>

          <button className="customer__btn blue">
            <img
              src={searchActionBannerIcon}
              alt="Create Request Icon"
              className="action-banner__icon"
            />

            <div className="customer__btn__content">
              <span>{t('tasksPage.findPerformer')}</span>

              <p>{t('tasksPage.sendDirect')}</p>
            </div>
          </button>
        </>
      )}

      {activeMode === 'performer' && (
        <div className="performer__container">
          <div className="performer__options">
            <button
              className={`performer__option ${
                activeSection === 'list' ? 'active' : ''
              } `}
              onClick={() => handleClickOption('list')}
            >
              {t('tasksPage.list')}
            </button>

            <button
              className={`performer__option ${
                activeSection === 'map' ? 'active' : ''
              } `}
              onClick={() => handleClickOption('map')}
            >
              {t('tasksPage.map')}
            </button>
          </div>

          {activeSection === 'list' &&
            TasksList.map((task) => (
              <div
                key={task.id}
                className="tasks__task"
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
                            <div
                              key={index}
                              className={`tag badge ${tag.color}`}
                            >
                              {tag.label === 'Urgent'
                                ? t('tasksPage.urgent')
                                : ''}
                              {tag.label === 'Remote'
                                ? t('tasksPage.remote')
                                : ''}
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

                        if (tag.type === 'hLeft') {
                          return (
                            <div key={index} className="tag">
                              {t('tasksPage.hLeft', { count: tag.count })}
                            </div>
                          );
                        }

                        if (tag.type === 'km') {
                          return (
                            <div key={index} className="tag">
                              {t('tasksPage.km', { count: tag.count })}
                            </div>
                          );
                        }

                        return null;
                      })}
                    </div>

                    <span>{task.description}</span>
                  </div>

                  <button className="task__button">
                    {t('tasksPage.viewDetails')}
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
                      className="tasks__task"
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
                                    {tag.label === 'Urgent'
                                      ? t('tasksPage.urgent')
                                      : ''}
                                    {tag.label === 'Remote'
                                      ? t('tasksPage.remote')
                                      : ''}
                                  </div>
                                );
                              }

                              if (tag.type === 'stars') {
                                return (
                                  <div key={index} className="tag stars">
                                    {task.price}
                                    <span>
                                      <img
                                        src={starsWhiteIcon}
                                        alt="Stars Icon"
                                      />
                                    </span>
                                  </div>
                                );
                              }

                              if (tag.type === 'hLeft') {
                                return (
                                  <div key={index} className="tag">
                                    {t('tasksPage.hLeft', { count: tag.count })}
                                  </div>
                                );
                              }

                              if (tag.type === 'km') {
                                return (
                                  <div key={index} className="tag">
                                    {t('tasksPage.km', { count: tag.count })}
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
                {/* <NavigationSkeleton /> */}
              </div>
            </>
          )}
        </div>
      )}

      <NavigationSkeleton />
    </div>
  );
};

export default Tasks;
