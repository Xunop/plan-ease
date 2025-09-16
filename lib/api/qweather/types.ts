"use server";

// Generic response types that might be shared across different API calls
export interface Refer {
  sources: string[];
  license: string[];
}

/**
 * Type of POI (Point of Interest).
 * 'scenic': Scenic spots
 * 'CSTA': Tidal current stations
 * 'TSTA': Tidal stations
 */
export type PoiType = 'scenic' | 'CSTA' | 'TSTA';

/**
 * Parameters for the POI Lookup API request.
 */
export interface PoiLookupParams {
  /**
   * The name of the area to be queried, supports text, longitude and latitude coordinates
   * (decimal, up to two decimal places), LocationID or Adcode (China only).
   * e.g., location=北京 or location=116.41,39.92
   */
  location: string;

  /**
   * The type of POI to search for.
   */
  type: PoiType;

  /**
   * The city where the POI is located. Can be the city name or LocationID.
   * By default, it is not limited to a specific city.
   */
  city?: string;

  /**
   * The number of results to return, value range 1-20, default is 10.
   */
  number?: number;

  /**
   * Language setting.
   */
  lang?: string;
}

/**
 * Represents a single POI (Point of Interest) location in the response.
 */
export interface PoiLocation {
  name: string;
  id: string;
  lat: string;
  lon: string;
  adm2: string;
  adm1: string;
  country: string;
  tz: string;
  utcOffset: string;
  isDst: string; // "1" for DST, "0" for not.
  type: string;
  rank: string;
  fxLink: string;
}

/**
 * The full response structure for a POI Lookup API call.
 */
export interface PoiLookupResponse {
  code: string;
  poi: PoiLocation[];
  refer: Refer;
}

// See: https://dev.qweather.com/docs/api/weather/weather-daily-forecast/
export interface DailyForecast {
  fxDate: string;
  sunrise: string;
  sunset: string;
  moonrise: string;
  moonset: string;
  moonPhase: string;
  moonPhaseIcon: string;
  tempMax: string;
  tempMin: string;
  iconDay: string;
  textDay: string;
  iconNight: string;
  textNight: string;
  wind360Day: string;
  windDirDay: string;
  windScaleDay: string;
  windSpeedDay: string;
  wind360Night: string;
  windDirNight: string;
  windScaleNight: string;
  windSpeedNight: string;
  humidity: string;
  precip: string;
  pressure: string;
  vis: string;
  cloud?: string;
  uvIndex: string;
}

export interface WeatherRefer {
  sources: string[];
  license: string[];
}

export interface WeatherAPIResponse {
  code: string;
  updateTime: string;
  fxLink: string;
  daily: DailyForecast[];
  refer: WeatherRefer;
}
