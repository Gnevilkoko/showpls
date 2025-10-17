import { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import starsWhiteIcon from '../../assets/stars-white.svg';
import { TasksList } from './tasks';
import { useTranslation } from 'react-i18next';
import type { TaskType } from '../../shared/types';

interface MarkerContentProps {
  task: TaskType;
  isActive: boolean;
}

const MarkerContent = ({ task, isActive }: MarkerContentProps) => {
  const { t } = useTranslation();

  return (
    <div className="custom-marker__content">
      {isActive ? (
        <span>{t(`tasksPage.${task.variant}`)}</span>
      ) : (
        <>
          {task.price}
          <span>
            <img src={starsWhiteIcon} alt="Stars Icon" />
          </span>
        </>
      )}
    </div>
  );
};

interface MarkersLayerProps {
  map: google.maps.Map;
  activeTaskId: string | null;
  setActiveTaskId: (id: string | null) => void;
}

const MarkersLayer = ({
  map,
  activeTaskId,
  setActiveTaskId,
}: MarkersLayerProps) => {
  const markersRef = useRef<
    Map<string, google.maps.marker.AdvancedMarkerElement>
  >(new Map());
  const rootsRef = useRef<Map<string, Root>>(new Map());

  useEffect(() => {
    const initMarkers = async () => {
      const markerLib = (await google.maps.importLibrary(
        'marker'
      )) as unknown as {
        AdvancedMarkerElement: typeof google.maps.marker.AdvancedMarkerElement;
      };
      const { AdvancedMarkerElement } = markerLib;

      TasksList.forEach((task) => {
        if (markersRef.current.has(task.id)) return;

        const content = document.createElement('div');
        content.className = `custom-marker ${task.variant} ${
          activeTaskId === task.id ? 'active' : ''
        }`;

        const root = createRoot(content);
        root.render(
          <MarkerContent task={task} isActive={activeTaskId === task.id} />
        );

        const marker = new AdvancedMarkerElement({
          map,
          position: task.position,
          content,
        });

        marker.addListener('click', () => setActiveTaskId(task.id));

        markersRef.current.set(task.id, marker);
        rootsRef.current.set(task.id, root);
      });
    };

    initMarkers();
  }, [map]); // eslint-disable-line react-hooks/exhaustive-deps

  // Обновление активного маркера
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const root = rootsRef.current.get(id);
      if (!root) return;

      const task = TasksList.find((t) => t.id === id);
      if (!task) return;

      const content = marker.content as HTMLElement;
      content.className = `custom-marker ${task.variant} ${
        activeTaskId === id ? 'active' : ''
      }`;
      root.render(<MarkerContent task={task} isActive={activeTaskId === id} />);

      // Если маркер активен, центрируем карту на нём
      if (activeTaskId === id) {
        map.panTo(task.position);
      }
    });
  }, [activeTaskId, map]);

  return null;
};

export default MarkersLayer;
