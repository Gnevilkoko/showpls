import { createContext, useContext } from 'react';

export const MapContext = createContext(false);

export const useMapLoaded = (): boolean => {
  return useContext(MapContext);
};
