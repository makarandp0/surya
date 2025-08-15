import { createContext } from 'react';

export type CardRenderingMode = 'flip' | 'openai';

export interface RenderingPreferencesContextType {
  cardRenderingMode: CardRenderingMode;
  setCardRenderingMode: (mode: CardRenderingMode) => void;
}

export const RenderingPreferencesContext = createContext<
  RenderingPreferencesContextType | undefined
>(undefined);
