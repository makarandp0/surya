import { useContext } from 'react';
import { RenderingPreferencesContext } from '../contexts/renderingPreferencesTypes';

export const useRenderingPreferences = () => {
  const context = useContext(RenderingPreferencesContext);
  if (context === undefined) {
    throw new Error(
      'useRenderingPreferences must be used within a RenderingPreferencesProvider',
    );
  }
  return context;
};
