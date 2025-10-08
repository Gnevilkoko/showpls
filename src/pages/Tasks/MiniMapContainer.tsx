import { GoogleMap } from '@react-google-maps/api';
import { memo } from 'react';
// import { MAP_ID } from '../../constants';
import pinIcon from '../../assets/pin.svg'; // своя иконка
import { useMapLoaded } from '../../shared/providers/MapContext';

const centerMap = { lat: 37.75296, lng: -122.467844 };

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  // поставил случайную строку, ибо что то с mapID в гугл клауде
  // если не надо кастомизировать карту - то оставляем как есть
  mapId: 'MAP_ID',
  gestureHandling: 'greedy',
};

const MiniMapContainer = memo(() => {
  const isLoaded = useMapLoaded();

  if (!isLoaded) return <p>Loading map…</p>;

  // const [map, setMap] = useState<google.maps.Map | null>(null);

  // const handleLoad = useCallback((mapInstance: google.maps.Map) => {
  //   setMap(mapInstance);
  // }, []);

  // функция для получения адреса под центром карты
  // const handleGetAddress = async () => {
  //   if (!map) return;

  //   const center = map.getCenter();
  //   if (!center) return;

  //   const geocoder = new google.maps.Geocoder();
  //   try {
  //     const res = await geocoder.geocode({ location: center });
  //     if (res.results[0]) {
  //       console.log('Address:', res.results[0].formatted_address);
  //     }
  //   } catch (error) {
  //     console.error('Geocoding error:', error);
  //   }
  // };

  return (
    <div className="mini-map-wrapper">
      <GoogleMap
        mapContainerClassName="mini-map"
        center={centerMap}
        zoom={14}
        // onLoad={handleLoad}
        options={mapOptions}
      />

      {/* фиксированная иконка по центру карты */}
      <div className="mini-map__center-marker">
        <img src={pinIcon} alt="Pin Icon" />
      </div>

      {/* Пример кнопки для получения адреса */}
      {/* <button onClick={handleGetAddress} className="get-address-btn">
        Get Address
      </button> */}
    </div>
  );
});

export default MiniMapContainer;
