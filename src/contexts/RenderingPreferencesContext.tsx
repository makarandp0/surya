import React, { useState, ReactNode } from 'react';
import {
  RenderingPreferencesContext,
  type CardRenderingMode,
} from './renderingPreferencesTypes';

interface RenderingPreferencesProviderProps {
  children: ReactNode;
  defaultMode?: CardRenderingMode;
}

export const RenderingPreferencesProvider: React.FC<
  RenderingPreferencesProviderProps
> = ({ children, defaultMode = 'flip' }) => {
  const [cardRenderingMode, setCardRenderingMode] =
    useState<CardRenderingMode>(defaultMode);

  return (
    <RenderingPreferencesContext.Provider
      value={{
        cardRenderingMode,
        setCardRenderingMode,
      }}
    >
      {children}
    </RenderingPreferencesContext.Provider>
  );
};
