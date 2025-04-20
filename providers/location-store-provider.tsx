"use client";

import { createBoundStore, Store } from "@/stores/location-store";
import { createContext, ReactNode, useContext, useRef } from "react";
import { useStore } from "zustand";

export type StoreApi = ReturnType<typeof createBoundStore>;

export const StoreContext = createContext<StoreApi | undefined>(
  undefined,
);

export interface LocationStoreProviderProps {
  children: ReactNode;
}

export const StoreProvider = ({
  children,
}: LocationStoreProviderProps) => {
  const storeRef = useRef<StoreApi | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createBoundStore();
  }

  return (
    <StoreContext.Provider value={storeRef.current}>
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
