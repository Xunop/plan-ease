import axiosInstance from "./axiosInstance";
import { AmapGeocode, AmapPlace, AmapResponse, AmapTip } from "./types";

export const fetchAmapTips = async (
  keywords: string,
  location?: string, // location is now optional
  city: string = "全国",
): Promise<AmapTip[]> => {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GAODE_API_KEY;
    if (apiKey === undefined || apiKey === "") {
      throw new Error("API key invalid")
    }

    const params: { [key: string]: string | undefined } = {
      key: apiKey,
      keywords,
      city,
      datatype: "poi",
    };

    if (location) {
      params.location = location;
    }

    const response = await axiosInstance.get<AmapResponse<AmapTip[]>>(
      "v3/assistant/inputtips",
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

// Function to fetch address info based on the address and city
export const fetchAmapGeocode = async (
  address: string,
  city: string = "全国", // Default to "全国" if no city is provided
): Promise<AmapGeocode[]> => {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GAODE_API_KEY;
    if (apiKey === undefined || apiKey === "") {
      throw new Error("API key invalid")
    }
    // Construct the params object
    const params: { [key: string]: string | undefined } = {
      key: apiKey,
      address,
      city,
      output: "json",
    };

    const response = await axiosInstance.get<AmapResponse<AmapGeocode[]>>(
      "v3/geocode/geo",
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

// Fetch place details from Amap API
export const fetchAmapPlaceById = async (
  id: string,
  showFields: string = "business,photos" // Default fields as per cURL
): Promise<AmapPlace[]> => {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GAODE_API_KEY;
    if (apiKey === undefined || apiKey === "") {
      throw new Error("API key invalid")
    }
    const params: { [key: string]: string | undefined } = {
      key: apiKey,
      id,
      show_fields: showFields,
      output: "json",
    };

    const response = await axiosInstance.get<AmapResponse<AmapPlace[]>>(
      "v5/place/detail",
      {
        params,
      }
    );

    if (response.data.status === "1" && response.data.pois) {
      if (typeof response.data.pois === "string") {
        throw new Error("Failed to fetch place detail from Amap API");
      } else {
        return response.data.pois;
      }
    } else {
      throw new Error("Failed to fetch place detail from Amap API");
    }
  } catch (error) {
    console.error("Error fetching Amap place detail:", error);
    throw error;
  }
};

// Fetch place text search results from Amap API
export const fetchAmapPlaceByKeywords = async (
  keywords: string,
  types?: string,
  region?: string,
  cityLimit?: boolean,
  showFields: string = "business,photos",
  pageSize?: number,
  pageNum?: number
): Promise<AmapPlace[]> => {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GAODE_API_KEY;
    if (apiKey === undefined || apiKey === "") {
      throw new Error("API key invalid")
    }
    // Construct the params object
    const params: { [key: string]: string | number | boolean | undefined } = {
      key: apiKey,
      keywords,
      types,
      region,
      city_limit: cityLimit,
      show_fields: showFields,
      page_size: pageSize,
      page_num: pageNum,
      output: "json",
    };

    const response = await axiosInstance.get<AmapResponse<AmapPlace[]>>(
      "v5/place/text",
      {
        params,
      }
    );

    console.log("text search", response)

    if (response.data.status === "1" && response.data.pois) {
      if (typeof response.data.pois === "string") {
        throw new Error("Failed to fetch place text from Amap API");
      } else {
        return response.data.pois;
      }
    } else {
      throw new Error("Failed to fetch place text from Amap API");
    }
  } catch (error) {
    console.error("Error fetching Amap place text:", error);
    throw error;
  }
};
