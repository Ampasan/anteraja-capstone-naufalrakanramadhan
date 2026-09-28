export interface WeatherSnapshot {
  temperatureC: number;
  apparentTemperatureC: number;
  weatherCode: number;
  windSpeedKmh: number;
  observedAt: string;
}

interface OpenMeteoResponse {
  current?: {
    temperature_2m: number;
    apparent_temperature: number;
    weather_code: number;
    wind_speed_10m: number;
    time: string;
  };
}

export async function fetchCurrentWeather(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<WeatherSnapshot> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m',
    timezone: 'Asia/Jakarta',
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal });
  if (!response.ok) throw new Error('Data cuaca tidak dapat dimuat.');

  const payload = (await response.json()) as OpenMeteoResponse;
  if (!payload.current) throw new Error('Respons cuaca tidak lengkap.');

  return {
    temperatureC: payload.current.temperature_2m,
    apparentTemperatureC: payload.current.apparent_temperature,
    weatherCode: payload.current.weather_code,
    windSpeedKmh: payload.current.wind_speed_10m,
    observedAt: payload.current.time,
  };
}

export function getWeatherLabel(code: number): string {
  if (code === 0) return 'Cerah';
  if ([1, 2, 3].includes(code)) return 'Berawan';
  if ([45, 48].includes(code)) return 'Berkabut';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Gerimis';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Hujan';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Salju';
  if ([95, 96, 99].includes(code)) return 'Badai petir';
  return 'Kondisi tidak diketahui';
}
