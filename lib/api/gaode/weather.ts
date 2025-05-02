import axiosInstance from "./axiosInstance";
import { AmapResponse, AmapWeather } from "./types";
export const fetchAmapWeather = async (
    city: string
): Promise<AmapWeather[]> => {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GAODE_API_KEY;
    if (apiKey === undefined || apiKey === "") {
      throw new Error("API key invalid");
    }
    // Construct the params object
    const params: { [key: string]: string | number | boolean | undefined } = {
      key: apiKey,
      city: city,
      extensions: "all",
      output: "json",
    };

    const response = await axiosInstance.get<AmapResponse<AmapWeather[]>>(
      "v3/weather/weatherInfo",
      {
        params,
      },
    );

    if (response.data.status === "1" && response.data.forecasts) {
      if (typeof response.data.forecasts === "string") {
        throw new Error("Failed to fetch place weather from Amap API");
      } else {
        return response.data.forecasts;
      }
    } else {
      throw new Error("Failed to fetch Amap weather text from Amap API");
    }
  } catch (error) {
    console.error("Error fetching Amap weather:", error);
    throw error;
  }
};
