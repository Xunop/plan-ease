"use client";

import { createBoundStore, Store } from "@/stores/location-store";
import { createContext, ReactNode, useContext, useRef } from "react";
import { useStore } from "zustand";

export type StoreApi = ReturnType<typeof createBoundStore>;

// Create the store instance ONCE
const storeSingleton = createBoundStore();

// Export the instance for direct access outside React
export const getStore = () => storeSingleton;

export const StoreContext = createContext<StoreApi | undefined>(
  undefined,
);

export interface LocationStoreProviderProps {
  children: ReactNode;
}

export const StoreProvider = ({
  children,
}: LocationStoreProviderProps) => {

  return (
    <StoreContext.Provider value={storeSingleton}>
      {children}
    </StoreContext.Provider>
  );
};

export const useBoundStore = <T,>(
  selector: (store: Store) => T,
): T => {
    const storeContext = useContext(StoreContext)
    if (!storeContext) {
        throw new Error(`useBoundStore must be used within StoreProvider`)
    }

    return useStore(storeContext, selector)
};
