import { AmapPlace } from "@/lib/api/gaode/types";
import { create, StateCreator } from "zustand";
import Fuse from "fuse.js";
import { pinyin } from "pinyin-pro";
import { locationOptions } from "./fuseOptions";
import { isEqual } from "lodash";

export type Location = {
  id: string;
  name: string;
  location: string;
  namePinyin: string;
  namePinyinInitials: string;
};

export type Date = {
  id: string;
  date: string;
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

export type PLHeightLight = {
  routeId: string;
  heightLight: boolean;
  color: string;
};

interface LocationSlice {
  locations: Location[];
  AddLocation: (location: string, name: string, id: string) => void;
  RemoveLocation: (id: string) => void;
  SearchLocationsByName: (searchTerm: string) => Location[];
  GetLocationById: (id: string) => Location | undefined;
}

interface DateSlice {
  dates: Date[];
  AddDate: (id: string, date: string) => void;
  RemoveDate: (id: string) => void;
  GetDateById: (id: string) => Date | undefined;
}

interface PlaceSlice {
  places: AmapPlace[];
  AddPlace: (place: AmapPlace) => void;
  RemovePlace: (id: string) => void;
  GetPlaceById: (id: string) => void;
  GetPlaceByLoc: (loc: string) => AmapPlace | undefined;
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

interface CurPLHeightLight {
  curPLHeiLine: PLHeightLight | undefined; // If no heiline, value is undefined
  ChangePLHeiLien: (id: string, isHeiLight: boolean, color: string) => void;
}

// interface PLHeightLightSlice {
//   plHeightLights: PLHeightLight[];
//   GetPLHeightLight: (id: string) => PLHeightLight | undefined;
//   AddPLHeightLight: (id: string, isHeiLight: boolean, color: string) => void;
// }

export type Store = LocationSlice &
  PlaceSlice &
  RouteSlice &
  DateSlice &
  // PLHeightLightSlice &
  CurPLHeightLight &
  EditorButtonList;

export const defaultInitState = {
  locations: [] as Location[],
  places: [] as AmapPlace[],
  dates: [] as Date[],
  routes: [] as Route[],
  buttonListOpen: false,
  buttonListPos: {
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    lineHeight: 0,
  } as ButtonPosition,
  heiLine: undefined,
};

const createLocationSlice: StateCreator<Store, [], [], LocationSlice> = (
  set,
  get,
) => ({
  locations: defaultInitState.locations,
  AddLocation: (location: string, name: string, id: string) =>
    set((state) => {
      // const locationId = location.split(",")[0] + "-" + location.split(",")[1];
      const locationId = id;
      const exists = state.locations.some(
        (loc) => loc.location === location && loc.name === name,
      );
      if (exists) {
        console.warn("Location exists", { name, location });
        return {};
      }

      let namePinyin = "";
      let namePinyinInitials = "";

      const chineseChars = name.match(/[\u4e00-\u9fa5]/g);

      // Only consider Chinese? Not considering a mix of Chinese and English?
      if (chineseChars && chineseChars.length > 0) {
        const chinesePart = chineseChars.join("");
        namePinyin = pinyin(chinesePart, {
          pattern: "pinyin",
          toneType: "none",
          // nonZh: "consecutive",
        }).replace(/\s/g, "");
        namePinyinInitials = pinyin(chinesePart, {
          pattern: "first",
          toneType: "none",
          // nonZh: "consecutive",
        }).replace(/\s/g, "");
      }
      // If there are no Chinese characters, `namePinyin` and `namePinyinInitials` remain as empty string
      const newLocation: Location = {
        id: locationId,
        name: name,
        location: location,
        namePinyin: namePinyin,
        namePinyinInitials: namePinyinInitials,
      };
      return {
        locations: [...state.locations, newLocation],
      };
    }),
  RemoveLocation: (id: string) =>
    set((state) => ({
      locations: state.locations.filter((loc) => {
        // const locationId =
        //   location.location.split(",")[0] +
        //   "-" +
        //   location.location.split(",")[1];
        return loc.id !== id;
      }),
      // routes: state.routes.map((route) => ({
      //   ...route,
      //   locations: route.locations.filter((locId) => locId !== id),
      // })),
    })),
  SearchLocationsByName: (searchTerm: string): Location[] => {
    const currentLocations = get().locations;

    if (!searchTerm || searchTerm.trim() === "") {
      return currentLocations;
    }

    // Each search creates a new instance of Fuse, no need to implement caching for the time being
    const fuse = new Fuse(currentLocations, locationOptions);
    const results = fuse.search(searchTerm);

    return results.map((result) => result.item);
  },
  GetLocationById: (id: string): Location | undefined => {
    const state = get();

    return state.locations.find((loc) => {
      const locId = loc.id;
      return id === locId;
    });
  },
});

const createDateslice: StateCreator<Store, [], [], DateSlice> = (set, get) => ({
  dates: defaultInitState.dates,
  AddDate: (id: string, date: string) =>
    set((state) => {
      const newDate: Date = {
        id: id,
        date: date,
      };

      return {
        dates: [...state.dates, newDate],
      };
    }),
  RemoveDate: (id: string) =>
    set((state) => ({
      dates: state.dates.filter((d) => {
        return d.id !== id;
      }),
    })),
  GetDateById: (id: string): Date | undefined => {
    const state = get();

    return state.dates.find((d) => {
      const dateId = d.id;
      return dateId === id;
    });
  },
});

const createPlaceSlice: StateCreator<Store, [], [], PlaceSlice> = (
  set,
  get,
) => ({
  places: defaultInitState.places,
  AddPlace: (place: AmapPlace) =>
    set((state) => ({
      places: [...state.places, place],
    })),
  RemovePlace: (id: string) =>
    set((state) => ({
      places: state.places.filter((place) => {
        // const placeId = place.location.split(",")[0] + "-" + place.location.split(",")[1];
        const placeId = place.id;
        return placeId !== id;
      }),
      routes: state.routes.map((route) => ({
        ...route,
        locations: route.locations.filter((locId) => locId !== id),
      })),
    })),
  GetPlaceById: (id: string): AmapPlace | undefined => {
    const state = get();

    return state.places.find((place) => {
      // const placeId = place.location.split(",")[0] + "-" + place.location.split(",")[1];
      const placeId = place.id;
      return id === placeId;
    });
  },
  GetPlaceByLoc: (loc: string): AmapPlace | undefined => {
    const state = get();

    return state.places.find((place) => {
      // const placeId = place.location.split(",")[0] + "-" + place.location.split(",")[1];
      const placeId = place.location;
      return loc === placeId;
    });
  },
});

const createRouteSlice: StateCreator<Store, [], [], RouteSlice> = (
  set,
  get,
) => ({
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

// const createPLHeightLightSlice: StateCreator<
//   Store,
//   [],
//   [],
//   PLHeightLightSlice
// > = (set, get) => ({
//   plHeightLights: defaultInitState.heiLines,
//   GetPLHeightLight: (id: string): PLHeightLight | undefined => {
//     const state = get(); // Get the current state
//     return state.plHeightLights.find((line) => line.routeId === id); // Return the route or undefined
//   },
//   AddPLHeightLight: (id: string, isHeiLight: boolean, color: string) =>
//     set((state) => {
//       const exists = state.plHeightLights.find((line) => line.routeId === id);
//       const newLine: PLHeightLight = {
//         routeId: id,
//         color: color,
//         heightLight: isHeiLight,
//       };
//       if (exists !== undefined) {
//         console.warn("PLHeightLight exists, check to update");
//         if (isEqual(newLine, exists)) {
//           return {};
//         }
//       }
//
//       return { plHeightLights: [...state.plHeightLights], newLine };
//     }),
// });

const createCurPLHeightLight: StateCreator<Store, [], [], CurPLHeightLight> = (
  set,
) => ({
  curPLHeiLine: defaultInitState.heiLine,
  ChangePLHeiLien: (id: string, isHeiLight: boolean, color: string) => {
    set((state) => {
      const exists = state.curPLHeiLine;
      const newLine: PLHeightLight = {
        routeId: id,
        color: color,
        heightLight: isHeiLight,
      };
      if (exists !== undefined) {
        console.warn("PLHeightLight exists, check to update");
        if (isEqual(newLine, exists)) {
          return {}; // No need change
        }
      }

      return { curPLHeiLine: newLine };
    });
  },
});

export const createBoundStore = () => {
  return create<Store>()((...a) => ({
    ...createRouteSlice(...a),
    ...createEditorButtonList(...a),
    ...createLocationSlice(...a),
    ...createDateslice(...a),
    ...createPlaceSlice(...a),
    ...createCurPLHeightLight(...a),
  }));
};
