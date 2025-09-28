/**
 * An enum to identify the data provider.
 */
export enum LocationProvider {
  AMAP = "amap",
  QWEATHER = "qweather",
  // Add other providers here in the future
}

/**
 * A generic, standardized representation of a suggestion tip.
 */
export interface Suggestion {
  provider: LocationProvider;
  id: string; // The original ID from the provider
  name: string;
  address: string;
  district?: string; // Optional district info
  location: string; // "lng,lat" format
}

/**
 * A generic, standardized representation of a detailed place.
 * This can be expanded with more fields as needed.
 */
export interface Place {
  provider: LocationProvider;
  id: string; // The unique ID generate and use internally
  originalId: string; // The ID from the provider
  name: string;
  location: string; // "lng,lat" format
  address: string;
  adcode: string;
  pname?: string;
  cityname?: string;
  adname?: string;
  business?: {
    [key: string]: string; // Keep business details flexible
  };
  photos?: {
    title: string;
    url: string;
  }[];
}
