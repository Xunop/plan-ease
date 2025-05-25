"use server";

import axiosInstance from "./axiosInstance";
import { AmapPath, AmapResponse, AmapRoute } from "./types";

interface AmapDirectionParams {
  origin: string; // Origin, in latitude,longitude format (e.g., longitude,latitude)
  destination: string; // Destination, in latitude,longitude format (e.g., longitude,latitude)
  strategy?: string; // Optional strategy parameter, e.g., 0 - shortest time, 1 - shortest distance, 2 - fastest speed, 3 - avoid toll roads
  waypoints?: string;
  show_fields?: string;
  method?:
    | "driving"
    | "walking"
    | "bicycling"
    | "electrobike"
    | "transit/integrated"; // Route planning method (e.g., driving, public transit, walking, cycling, electric bike)
}

export const fetchAmapDirection = async ({
  origin,
  destination,
  waypoints,
  strategy = "32",
  method = "driving",
  show_fields = "polyline",
}: AmapDirectionParams): Promise<AmapRoute> => {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GAODE_API_KEY;
    if (apiKey === undefined || apiKey === "") {
      throw new Error("API key invalid");
    }
    const params: { [key: string]: string | undefined } = {
      key: apiKey,
      origin,
      destination,
      strategy,
      show_fields,
    };

    if (waypoints) {
      params.waypoints = waypoints;
    }

    const response = await axiosInstance.get<AmapResponse<AmapRoute>>(
      "v5/direction/" + method,
      {
        params,
      },
    );

    // console.log("res", response)
    if (response.data.status === "1" && response.data.route) {
      if (typeof response.data.route === "string") {
        throw new Error("Failed to fetch direction data from Amap API");
      } else {
        return response.data.route;
      }
    } else {
      throw new Error("Failed to fetch direction data from Amap API");
    }
  } catch (error) {
    console.error("Error fetching Amap direction:", error);
    throw error;
  }
};
