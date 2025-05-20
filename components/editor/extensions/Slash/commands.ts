import { CommandDefinition, CommandResult } from "./types";
import { preprocessCommand } from "./commandUtils";
import { AmapWeather, Forecast } from "@/lib/api/gaode/types";
import { fetchAmapWeather } from "@/lib/api/gaode/weather";

/**
 * Fetches weather forecast from Amap API based on location adcode and date.
 * @param options Expected to contain `locationAdcode` (Amap city/district code) and `date` (YYYY-MM-DD).
 */
async function getWeather(
  options: Record<string, string>,
): Promise<CommandResult> {
  // *** Assumption: options.locationAdcode contains the required Amap adcode string ***
  const { address: locationAdcode = "", date: inputDate = "" } = options;

  // 1. Input Validation
  if (!locationAdcode) {
    // Provide a more specific message if possible based on your suggestion data
    return { display: `Please specify a location.`, isPlaceholder: true };
  }
  if (!inputDate) {
    return {
      display: `Please specify a date (e.g., Tomorrow, 2025-05-10).`,
      isPlaceholder: true,
    };
  }

  console.log(
    `Workspaceing weather for adcode: ${locationAdcode}, target date: ${inputDate}`,
  ); // Debug log

  // 3. Call API
  try {
    // Assuming fetchAmapWeather handles API key logic internally
    const weatherDataArray: AmapWeather[] =
      await fetchAmapWeather(locationAdcode);

    // API often returns an array, usually with one item for forecasts
    if (
      !weatherDataArray ||
      weatherDataArray.length === 0 ||
      !weatherDataArray[0].casts
    ) {
      console.warn(
        "Amap API returned no forecasts for adcode:",
        locationAdcode,
      );
      // Attempt to use the city name from the response if available, otherwise use adcode
      const cityName = weatherDataArray?.[0]?.city ?? locationAdcode;
      return {
        display: `Weather data currently unavailable for ${cityName}.`,
        isPlaceholder: false,
      };
    }

    const weatherData = weatherDataArray[0];
    const cityName = weatherData.city; // Use city name from response

    // 4. Find Matching Forecast
    const forecast: Forecast | undefined = weatherData.casts.find(
      (cast) => cast.date === inputDate,
    );

    if (!forecast) {
      // Check if requested date is simply out of range of the forecast returned
      const availableDates = weatherData.casts.map((c) => c.date).join(", ");
      console.warn(
        `Forecast for ${inputDate} not found. Available: ${availableDates}`,
      );
      return {
        display: `Weather forecast not available for ${cityName} on ${inputDate}. Available dates: ${availableDates}`,
        isPlaceholder: false,
      };
    }

    // 5. Format Successful Result
    // You can customize this display string
    const displayString = `${cityName} (${forecast.date}):
Day: ${forecast.dayweather}, ${forecast.daytemp}°C
Night: ${forecast.nightweather}, ${forecast.nighttemp}°C
Reported at: ${weatherData.reporttime}`;

    return {
      display: displayString,
      isPlaceholder: false,
      // Optionally include more structured data if the UI needs it
      data: {
        city: cityName,
        reportTime: weatherData.reporttime,
        forecast: forecast,
      },
    };
  } catch (error: any) {
    console.error(
      `Error in getWeather action for adcode ${locationAdcode}:`,
      error,
    );

    // Create a user-friendly error message
    let errorMessage = `Could not retrieve weather for the selected location.`;
    if (error.message?.includes("API key invalid")) {
      errorMessage = "Weather service unavailable (Configuration Error).";
    } else if (error.message) {
      // Include part of the underlying error if it's informative, but keep it concise
      errorMessage += ` (${error.message})`;
    }

    // Return error result - not a placeholder
    return { display: errorMessage, isPlaceholder: false };
  }
}

async function getTravelTime(
  options: Record<string, string>,
): Promise<CommandResult> {
  const { origin = "start point", destination = "end point" } = options;
  await new Promise((resolve) => setTimeout(resolve, 100));

  if (!origin || origin.trim() === "") {
    return {
      display: `Please specify an origin (e.g., /From London to Paris).`,
      isPlaceholder: true,
    };
  }
  if (!destination || destination.trim() === "") {
    return {
      display: `Please specify a destination (e.g., /From ${origin} to Paris).`,
      isPlaceholder: true,
    };
  }

  // Simulate calculation
  const timeHours = Math.floor(Math.random() * 10) + 1;
  const timeMinutes = Math.floor(Math.random() * 60);

  return {
    display: `Estimated travel time from ${origin} to ${destination}: ${timeHours}h ${timeMinutes}m.`,
  };
}

export const commands: CommandDefinition[] = [
  {
    name: "Weather",
    commandPrefix: "/Weather",
    format: "/Weather in {address} on {date}", // Note: format starts WITH the prefix
    description: "Get weather for a location on a specific date.",
    // Options, Regex, Order will be generated by preprocessCommand
    options: [],
    action: getWeather,
  },
  // {
  //   name: "From",
  //   commandPrefix: "/From",
  //   format: "/From {origin} to {destination}",
  //   description: "Calculate travel time between two locations.",
  //   options: [],
  //   action: getTravelTime,
  // },
  // Add more commands here
];

// --- Preprocess Commands on Load ---
commands.forEach(preprocessCommand);

// Optional: Log preprocessed commands for verification
// console.log("Preprocessed Commands:", JSON.stringify(commands.map(c => ({ ...c, parsingRegex: c.parsingRegex?.toString() })), null, 2));
