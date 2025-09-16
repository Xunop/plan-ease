"use server";

import axiosInstance from "./axiosInstance";
import {
  PoiLookupParams,
  PoiLookupResponse
} from './types';

/**
 * POI Search API
 * Searches for POI (Points of Interest) information using keywords and coordinates.
 * @param params - The parameters for the POI lookup, including location and type.
 * @returns A promise that resolves to the POI lookup response.
 * @see https://dev.qweather.com/docs/api/geoapi/poi-lookup/
 */
export async function poiLookup(params: PoiLookupParams): Promise<PoiLookupResponse> {
  try {
    const response = await axiosInstance.get<PoiLookupResponse>('/geo/v2/poi/lookup', {
      params: params,
    });
    return response.data;
  } catch (error) {
    console.error("Error during POI lookup:", error);
    // Re-throw the error to allow for further handling by the caller
    throw error;
  }
}
