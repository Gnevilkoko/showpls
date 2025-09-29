import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import type { CSSProperties } from 'react';
import { useCallback } from 'react';
import { API_KEY_MAPS, MAP_ID } from '../../constants';

const containerStyle: CSSProperties = {
  flex: 1,
  width: '90%',
  height: '100%',
  borderRadius: '16px',
};

interface MarkerLibrary {
  AdvancedMarkerElement: typeof google.maps.marker.AdvancedMarkerElement;
}

const center = { lat: 37.75296, lng: -122.467844 }; // Москва для примера
const firstMarker = { lat: 37.758749, lng: -122.461771 };
const secondaryMarker = { lat: 37.75254, lng: -122.472629 };
const lastMarker = { lat: 37.749859, lng: -122.465076 };

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  mapId: MAP_ID,
};

const Map = () => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: API_KEY_MAPS as string,
  });

  const handleLoad = useCallback(async (map: google.maps.Map) => {
    const markerLib = (await google.maps.importLibrary(
      'marker'
    )) as MarkerLibrary;
    const { AdvancedMarkerElement } = markerLib;

    // Создание метки на координатах
    new AdvancedMarkerElement({
      map,
      position: firstMarker,
      title: 'test1',
    });

    new AdvancedMarkerElement({
      map,
      position: secondaryMarker,
      title: 'test2',
    });

    new AdvancedMarkerElement({
      map,
      position: lastMarker,
      title: 'test3',
    });
  }, []);

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={14}
      onLoad={handleLoad}
      options={mapOptions}
    />
  ) : (
    <p>Загрузка карты…</p>
  );
};

export default Map;
