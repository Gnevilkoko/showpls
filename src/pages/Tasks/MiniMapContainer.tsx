import { GoogleMap } from '@react-google-maps/api';
import { memo, useCallback, useEffect, useState } from 'react';
// import { MAP_ID } from '../../constants';
import pinIcon from '../../assets/pin.svg'; // своя иконка
import { useMapLoaded } from '../../shared/providers/MapContext';

// лишь демонстрация, сюда возможно пойдет реальная геолокация пользователя
const centerMap = { lat: 37.75296, lng: -122.467844 };

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  // поставил случайную строку, ибо что то с mapID в гугл клауде
  // если не надо кастомизировать карту - то оставляем как есть
  mapId: 'MAP_ID',
  gestureHandling: 'greedy',
};

interface MiniMapContainerProps {
  address: string; // строка из инпута
}

const MiniMapContainer = memo(({ address }: MiniMapContainerProps) => {
  const isLoaded = useMapLoaded();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [center, setCenter] = useState<{ lat: number; lng: number }>(centerMap);

  const handleLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  const handleGetCoords = () => {
    if (!map) return;

    const center = map.getCenter();
    if (!center) return;

    const coords = { lat: center.lat(), lng: center.lng() };
    console.log('Center coords:', coords);
  };

  // Когда изменился адрес — геокодируем и двигаем карту
  useEffect(() => {
    if (!map || !address) return;
    const geocoder = new google.maps.Geocoder();

    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        const loc = results[0].geometry.location;
        const coords = { lat: loc.lat(), lng: loc.lng() };
        setCenter(coords);
      }
    });
  }, [address, map]);

  if (!isLoaded) return <p>Loading map…</p>;

  return (
    <div className="mini-map-wrapper">
      <GoogleMap
        mapContainerClassName="mini-map"
        center={center}
        zoom={14}
        onLoad={handleLoad}
        onIdle={handleGetCoords}
        options={mapOptions}
      />

      {/* фиксированная иконка по центру карты */}
      <div className="mini-map__center-marker">
        <img src={pinIcon} alt="Pin Icon" />
      </div>
    </div>
  );
});

export default MiniMapContainer;
