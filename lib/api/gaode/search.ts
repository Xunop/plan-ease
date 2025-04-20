import axiosInstance from "./axiosInstance";
import { AmapGeocode, AmapResponse, AmapTip } from "./types";

export const fetchAmapTips = async (
  keywords: string,
  location?: string, // location is now optional
  city: string = "全国",
): Promise<AmapTip[]> => {
  try {
    const apiKey = process.env.NEXT_PUBLIC_API_KEY;    // Construct the params object
    const params: { [key: string]: string | undefined } = {
      apiKey,
      keywords,
      city,
      datatype: "poi",
    };

    if (location) {
      params.location = location;
    }

    const response = await axiosInstance.get<AmapResponse<AmapTip[]>>(
      "assistant/inputtips",
      {
        params,
      },
    );

    if (response.data.status === "1" && response.data.tips) {
      if (typeof response.data.tips === "string") {
        throw new Error("Failed to fetch data from Amap API");
      } else {
        return response.data.tips;
      }
    } else {
      throw new Error("Failed to fetch data from Amap API");
    }
  } catch (error) {
    console.error("Error fetching Amap tips:", error);
    throw error;
  }
};

// Function to fetch Amap tips based on the address and city
export const fetchAmapGeocode = async (
  address: string,
  city: string = "全国", // Default to "全国" if no city is provided
): Promise<AmapGeocode[]> => {
  try {
    const apiKey = process.env.NEXT_PUBLIC_API_KEY;
    // Construct the params object
    const params: { [key: string]: string | undefined } = {
      apiKey,
      address,
      city,
      output: "json",
    };

    const response = await axiosInstance.get<AmapResponse<AmapGeocode[]>>(
      "geocode/geo",
      {
        params,
      },
    );

    if (response.data.status === "1" && response.data.geocodes) {
      if (typeof response.data.geocodes === "string") {
        throw new Error("Failed to fetch data from Amap API");
      } else {
        return response.data.geocodes;
      }
    } else {
      throw new Error("Failed to fetch data from Amap API");
    }
  } catch (error) {
    console.error("Error fetching Amap geocode data:", error);
    throw error;
  }
};
