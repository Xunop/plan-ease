import { createContext } from 'react';

interface HoverContextType {
  parentEffectiveHovered: boolean;
}

export const HoverContext = createContext<HoverContextType>({ parentEffectiveHovered: false });
