import axiosInstance from "./axiosInstance";
import { DailyForecast, WeatherAPIResponse } from "./types";

const getDaysDifference = (targetDateInput: string | Date): number => {
  const target = new Date(targetDateInput);
  if (isNaN(target.getTime())) {
    throw new Error(`Invalid date: ${targetDateInput}`);
  }
  const today = new Date();

  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffInMilliseconds = target.getTime() - today.getTime();
  return Math.ceil(diffInMilliseconds / (1000 * 60 * 60 * 24)); // 86,400,000 ms per day
};
const getForecastPath = (targetDateInput: string | Date): string => {
  const diffInDays = getDaysDifference(targetDateInput);

  if (diffInDays < 0) {
    throw new Error("The target date cannot be a past date.");
  }

  // diffInDays 0 means today, 1 means tomorrow, 2 means the day after tomorrow.
  if (diffInDays <= 2) {
    return "/v7/weather/3d";
  } else if (diffInDays <= 6) {
    return "/v7/weather/7d";
  } else if (diffInDays <= 9) {
    return "/v7/weather/10d";
  } else if (diffInDays <= 14) {
    return "/v7/weather/15d";
  } else if (diffInDays <= 29) {
    return "/v7/weather/30d";
  } else {
    throw new Error(
      "The target date is too far away. the API supports a maximum of 30-day forecasts.",
    );
  }
};

/**
 * Get weather data
 * See https://dev.qweather.com/docs/api/weather/weather-daily-forecast/
 * @param location The locationID or latitude/longitude coordinates of the area to be queried (e.g. “101010100” or “116.41,39.92”).
 * @param targetDateInput target date (string or Date object), the function will select the appropriate forecast days API based on this date
 * @param lang optional, multi-language setting (e.g. “en”, “zh-Hans”)
 * @param unit optional, data unit setting (“m” for metric, “i” for imperial)
 * @returns Promise<DailyForecast[]> Returns an array containing daily forecasts.
 */
export const fetchWeatherForecast = async (
  location: string,
  targetDateInput: string | Date,
  lang?: string,
  unit?: "m" | "i",
): Promise<DailyForecast[]> => {
  // const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
  // if (!apiKey) {
  //   throw new Error(
  //     "API KEY Error",
  //   );
  // }

  if (!location) {
    throw new Error("Must provider location param");
  }

  try {
    const path = getForecastPath(targetDateInput);

    const params: { [key: string]: string | undefined } = {
      location,
      lang,
      unit,
    };

    // Delete `undefined` params
    Object.keys(params).forEach((key) => {
      if (params[key] === undefined) {
        delete params[key];
      }
    });

    const response = await axiosInstance.get<WeatherAPIResponse>(path, {
      params,
    });

    if (response.data && response.data.code === "200" && response.data.daily) {
      return response.data.daily;
    } else {
      const apiMessage =
        (response.data as any)?.message ||
        `API code ${response.data?.code || "UNKNOWN"}`;
      throw new Error(`Error fetching Qweather weather: ${apiMessage}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        `Fetching weather error from Qweather (location: ${location}, date: ${targetDateInput}):`,
        error.message,
      );
      throw error;
    } else {
      console.error(
        `Unknown error occurred when fetching weather from Qweather (location: ${location}, date: ${targetDateInput}):`,
        error,
      );
      throw new Error("Fetching weather error from Qweather");
    }
  }
};
