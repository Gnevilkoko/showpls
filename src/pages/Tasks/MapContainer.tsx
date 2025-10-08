import { GoogleMap } from '@react-google-maps/api';
import { memo, useCallback, useState } from 'react';
// import { MAP_ID } from '../../constants';
import MarkersLayer from './MarkersLayer';
import { TasksList } from './tasks';
import { useMapLoaded } from '../../shared/providers/MapContext';

interface MapContainerProps {
  activeTaskId: string | null;
  setActiveTaskId: (id: string | null) => void;
}

const centerMap = { lat: 37.75296, lng: -122.467844 };

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  // поставил случайную строку, ибо что то с mapID в гугл клауде
  // если не надо кастомизировать карту - то оставляем как есть
  mapId: 'MAP_ID',
  gestureHandling: 'greedy',
};

const MapContainer = memo(
  ({ activeTaskId, setActiveTaskId }: MapContainerProps) => {
    const isLoaded = useMapLoaded();

    // ищем позицию активной таски
    const activeTask = activeTaskId
      ? TasksList.find((task) => task.id === activeTaskId)
      : null;

    const [map, setMap] = useState<google.maps.Map | null>(null);

    const handleLoad = useCallback((mapInstance: google.maps.Map) => {
      setMap(mapInstance);
    }, []);

    if (!isLoaded) return <p>Loading map…</p>;

    return (
      <div className="map-wrapper">
        <GoogleMap
          mapContainerClassName="map"
          center={activeTask ? activeTask.position : centerMap}
          zoom={14}
          onLoad={handleLoad}
          options={mapOptions}
        />
        {map && (
          <MarkersLayer
            map={map}
            activeTaskId={activeTaskId}
            setActiveTaskId={setActiveTaskId}
          />
        )}
      </div>
    );
  }
);

export default MapContainer;
