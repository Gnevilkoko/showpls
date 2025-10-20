import { useJsApiLoader } from '@react-google-maps/api';
import { API_KEY_MAPS } from '../../constants';
import { MapContext } from './MapContext';
import type { ReactNode } from 'react';

interface MapProviderProps {
  children: ReactNode;
}

const MapProvider: React.FC<MapProviderProps> = ({ children }) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: API_KEY_MAPS as string,
  });

  return <MapContext.Provider value={isLoaded}>{children}</MapContext.Provider>;
};

export default MapProvider;
