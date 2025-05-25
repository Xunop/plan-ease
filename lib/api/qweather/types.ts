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
