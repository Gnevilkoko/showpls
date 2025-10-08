import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { memo, useCallback, useState } from 'react';
import { API_KEY_MAPS, MAP_ID } from '../../constants';
import MarkersLayer from './MarkersLayer';
import { TasksList } from './tasks';

interface MapContainerProps {
  activeTaskId: string | null;
  setActiveTaskId: (id: string | null) => void;
}

const centerMap = { lat: 37.75296, lng: -122.467844 };

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  mapId: MAP_ID,
  gestureHandling: 'greedy',
};

const MapContainer = memo(
  ({ activeTaskId, setActiveTaskId }: MapContainerProps) => {
    const { isLoaded } = useJsApiLoader({
      id: 'google-map-script',
      googleMapsApiKey: API_KEY_MAPS as string,
    });

    // ищем позицию активной таски
    const activeTask = activeTaskId
      ? TasksList.find((task) => task.id === activeTaskId)
      : null;

    const [map, setMap] = useState<google.maps.Map | null>(null);

    const handleLoad = useCallback((mapInstance: google.maps.Map) => {
      setMap(mapInstance);
    }, []);

    return isLoaded ? (
      <>
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
      </>
    ) : (
      <p>Loading map…</p>
    );
  }
);

export default MapContainer;
