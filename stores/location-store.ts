import { create, StateCreator } from "zustand";

export type Location = {
    id: string;
    name: string;
    location: string;
};

export type Route = {
    id: string;
    name?: string;
    locations: string[];
};

export type ButtonPosition = {
    left: number;
    top: number;
    bottom: number;
    right: number;
    lineHeight: number;
    nodePos: number;
};

interface LocationSlice {
    locations: Location[];
    AddLocation: (location: Location) => void;
    RemoveLocation: (id: string) => void;
}

interface RouteSlice {
    routes: Route[];
    AddRoute: (route: Route) => void;
    GetRoute: (id: string) => Route | undefined;
    RemoveRoute: (id: string) => void;
    UpdateRoute: (id: string, updates: Partial<Route>) => void;
    AddLocationToRoute: (routeId: string, locationId: string) => void;
    RemoveLocationFromRoute: (routeId: string, locationId: string) => void;
}

interface EditorButtonList {
    buttonListOpen: boolean;
    buttonListPos: ButtonPosition;
    SetButtonListOpen: (open: boolean) => void;
    SetButtonListPos: ({
        left,
        right,
        top,
        bottom,
        lineHeight,
        nodePos,
    }: ButtonPosition) => void;
}

export type Store = LocationSlice & RouteSlice & EditorButtonList;

export const defaultInitState = {
    locations: [] as Location[],
    routes: [] as Route[],
    buttonListOpen: false,
    buttonListPos: {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        lineHeight: 0,
    } as ButtonPosition,
};

const createLocationSlice: StateCreator<Store, [], [], LocationSlice> = (
    set,
) => ({
    locations: defaultInitState.locations,
    AddLocation: (location: Location) =>
        set((state) => ({
            locations: [...state.locations, location],
        })),
    RemoveLocation: (id: string) =>
        set((state) => ({
            locations: state.locations.filter((location) => location.id !== id),
            routes: state.routes.map((route) => ({
                ...route,
                locations: route.locations.filter((locId) => locId !== id),
            })),
        })),
});

const createRouteSlice: StateCreator<Store, [], [], RouteSlice> = (set, get) => ({
    routes: defaultInitState.routes,
    GetRoute: (id: string): Route | undefined => {
        const state = get(); // Get the current state
        return state.routes.find((route) => route.id === id); // Return the route or undefined
    },
    AddRoute: (route: Route) =>
        set((state) => ({
            routes: [...state.routes, route],
        })),

    RemoveRoute: (id: string) =>
        set((state) => ({
            routes: state.routes.filter((route) => route.id !== id),
        })),
    UpdateRoute: (id: string, updates: Partial<Route>) =>
        set((state) => ({
            routes: state.routes.map((route) =>
                route.id === id ? { ...route, ...updates } : route,
            ),
        })),
    AddLocationToRoute: (routeId: string, location: string) =>
        set((state) => {
            const routeExists = state.routes.some((route) => route.id === routeId);
            if (!routeExists) {
                return {
                    routes: [
                        ...state.routes,
                        { id: routeId, name: "", locations: [location] },
                    ],
                };
            }

            return {
                routes: state.routes.map((route) =>
                    route.id === routeId
                        ? {
                            ...route,
                            locations: route.locations.includes(location)
                                ? route.locations
                                : [...route.locations, location],
                        }
                        : route,
                ),
            };
        }),
    RemoveLocationFromRoute: (routeId: string, location: string) =>
        set((state) => {
            // const routeExists = state.routes.some((route) => route.id === routeId);
            // if (!routeExists) throw new Error(`Route with id ${routeId} not found`);
            return {
                routes: state.routes.map((route) =>
                    route.id === routeId
                        ? {
                            ...route,
                            locations: route.locations.filter((loc) => loc !== location),
                        }
                        : route,
                ),
            };
        }),
});

const createEditorButtonList: StateCreator<Store, [], [], EditorButtonList> = (
    set,
) => ({
    buttonListOpen: defaultInitState.buttonListOpen,
    buttonListPos: defaultInitState.buttonListPos,
    SetButtonListOpen: (open: boolean) => set(() => ({ buttonListOpen: open })),
    SetButtonListPos: (pos: ButtonPosition) =>
        set(() => ({ buttonListPos: pos })),
});

export const createBoundStore = () => {
    return create<Store>()((...a) => ({
        ...createLocationSlice(...a),
        ...createRouteSlice(...a),
        ...createEditorButtonList(...a),
    }));
};
