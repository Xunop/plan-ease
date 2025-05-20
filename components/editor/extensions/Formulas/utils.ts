import { IconProps } from "@/components/ui/icon"; // Adjust the import path for your Icon component

// Define Icon Name type (using the type from your Icon component)
type LucideIconName = IconProps["name"];

// Interface for the return type
export interface WeatherVisuals {
  iconName: LucideIconName;
  animationClass: string; // CSS class for animation styling
}

/**
 * Determines the appropriate Lucide icon and animation class based on a weather description.
 * Supports both English keywords and specific Chinese weather terms.
 *
 * @param description - The weather description string (e.g., "Sunny", "Cloudy", "晴", "多云").
 * @returns An object containing the Lucide icon name and CSS animation class.
 */
export const getWeatherVisuals = (description: string | undefined | null): WeatherVisuals => {
  // Handle null/undefined input
  if (!description) {
    return { iconName: "CircleHelp", animationClass: "" };
  }

  const lowerDesc = description.toLowerCase(); // For case-insensitive English matching

  // --- Match Specific Conditions (Prioritize more severe/distinct weather) ---

  // Thunderstorm / Hail (雷暴 / 冰雹)
  if (description.includes('雷') || description.includes('雹') || lowerDesc.includes('thunder') || lowerDesc.includes('storm') || lowerDesc.includes('hail')) {
    return { iconName: "CloudLightning", animationClass: "weather-icon--stormy" };
  }

  // Snow / Sleet (雪 / 雨夹雪) - Check before general rain
  if (description.includes('雪') || lowerDesc.includes('snow') || lowerDesc.includes('sleet') || lowerDesc.includes('flurr')) {
    if (description.includes('雨夹雪') || description.includes('雨雪') || lowerDesc.includes('sleet')) {
      // Rain/Snow Mix
      return { iconName: "CloudSnow", animationClass: "weather-icon--snowy" };
    }
    // Pure Snow (小雪, 中雪, 大雪, 暴雪, 阵雪, 雪)
    return { iconName: "Snowflake", animationClass: "weather-icon--snowy" };
  }

  // Rain / Drizzle (雨 / 阵雨 / 暴雨 etc.)
  if (description.includes('雨') || lowerDesc.includes('rain') || lowerDesc.includes('shower') || lowerDesc.includes('drizzle')) {
    // Check for heavier rain types (暴, 强, 大, 特大)
    if (description.includes('暴') || description.includes('强') || description.includes('极端') || description.includes('大') || description.includes('特大') || lowerDesc.includes('heavy') || lowerDesc.includes('extreme')) {
      // Use Lucide's heavier rain icon if desired, and maybe a stronger animation
      return { iconName: "CloudRainWind", animationClass: "weather-icon--rainy-heavy" };
    }
    // Standard Rain/Drizzle (阵雨, 小雨, 中雨, 毛毛雨/细雨, 雨)
    return { iconName: "CloudRain", animationClass: "weather-icon--rainy" };
  }

  // Fog / Mist / Haze (雾 / 霾)
  if (description.includes('雾') || description.includes('霾') || lowerDesc.includes('fog') || lowerDesc.includes('mist') || lowerDesc.includes('haze')) {
      // Could differentiate Haze maybe? For now, group with Fog.
      return { iconName: "CloudFog", animationClass: "weather-icon--foggy" };
  }

   // Dust / Sand (沙 / 尘)
  if (description.includes('沙') || description.includes('尘') || lowerDesc.includes('sand') || lowerDesc.includes('dust')) {
    return { iconName: "Wind", animationClass: "weather-icon--windy" }; // Wind icon seems most appropriate
  }

  // Wind (风) - If not caught by dust/sand description
  if (description.includes('风') || lowerDesc.includes('wind')) {
     return { iconName: "Wind", animationClass: "weather-icon--windy" };
  }

  // Hot (热)
  if (description.includes('热') || lowerDesc.includes('hot')) {
    return { iconName: "ThermometerSun", animationClass: "weather-icon--hot" };
  }

  // Cold (冷)
  if (description.includes('冷') || lowerDesc.includes('cold')) {
    return { iconName: "ThermometerSnowflake", animationClass: "weather-icon--cold" };
  }

  // --- Match General Conditions ---

  // Clear / Sunny (晴)
  if (description === '晴' || lowerDesc.includes('clear') || lowerDesc.includes('sun')) {
    // Add logic here to check time of day if possible, to return Moon instead of Sun
    // const isNight = ...;
    // if (isNight) return { iconName: "Moon", animationClass: "weather-icon--night-clear" };
    return { iconName: "Sun", animationClass: "weather-icon--sunny" };
  }

  // Partly Cloudy (少云 / 晴间多云)
  if (description === '少云' || description === '晴间多云' || lowerDesc.includes('partly cloudy') || lowerDesc.includes('mostly sunny') || lowerDesc.includes('few clouds')) {
    // Add logic here to check time of day if possible, returning CloudMoon instead of CloudSun
    // const isNight = ...;
    // if (isNight) return { iconName: "CloudMoon", animationClass: "weather-icon--partly-cloudy-night" };
    return { iconName: "CloudSun", animationClass: "weather-icon--partly-cloudy" };
  }

  // Cloudy / Overcast (多云 / 阴) - Check last before default
  if (description === '多云' || description === '阴' || lowerDesc.includes('cloud') || lowerDesc.includes('overcast')) {
    return { iconName: "Cloud", animationClass: "weather-icon--cloudy" };
  }

  // Fallback for "未知" or any other unhandled description
  return { iconName: "CircleHelp", animationClass: "" };
};
