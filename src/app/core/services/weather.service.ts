import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay, tap } from 'rxjs';

export interface WeatherCurrent {
  readonly temperature: number;
  readonly apparent: number;
  readonly humidity: number;
  readonly precipitation: number;
  readonly windSpeed: number;
  readonly code: number;
  readonly isDay: boolean;
}

export interface WeatherDay {
  readonly date: string;
  readonly code: number;
  readonly tempMax: number;
  readonly tempMin: number;
  readonly rainProbability: number | null;
  readonly rainSum: number;
  readonly uvIndex: number | null;
  readonly sunrise: string;
  readonly sunset: string;
}

export interface Weather {
  readonly current: WeatherCurrent;
  readonly days: readonly WeatherDay[];
}

export interface WeatherCondition {
  readonly label: string;
  readonly icon: string;
}

/** Códigos WMO (usados pelo Open-Meteo) → descrição em português e ícone do registro. */
export function weatherCondition(code: number, isDay = true): WeatherCondition {
  if (code === 0) return { label: isDay ? 'Céu limpo' : 'Noite limpa', icon: isDay ? 'sun' : 'moon' };
  if (code <= 2) return { label: 'Parcialmente nublado', icon: isDay ? 'cloud-sun' : 'cloud-moon' };
  if (code === 3) return { label: 'Nublado', icon: 'cloud' };
  if (code === 45 || code === 48) return { label: 'Neblina', icon: 'cloud-fog' };
  if (code >= 51 && code <= 57) return { label: 'Garoa', icon: 'cloud-drizzle' };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { label: code >= 80 ? 'Pancadas de chuva' : 'Chuva', icon: 'cloud-rain' };
  if (code >= 71 && code <= 77) return { label: 'Neve', icon: 'snowflake' };
  if (code === 85 || code === 86) return { label: 'Pancadas de neve', icon: 'snowflake' };
  if (code >= 95) return { label: 'Tempestade', icon: 'cloud-lightning' };
  return { label: 'Tempo variável', icon: 'cloud' };
}

interface OpenMeteoResponse {
  current: {
    temperature_2m: number; apparent_temperature: number; relative_humidity_2m: number;
    precipitation: number; weather_code: number; wind_speed_10m: number; is_day: number;
  };
  daily: {
    time: string[]; weather_code: number[]; temperature_2m_max: number[]; temperature_2m_min: number[];
    precipitation_probability_max: (number | null)[]; precipitation_sum: number[]; uv_index_max: (number | null)[];
    sunrise: string[]; sunset: string[];
  };
}

export const WEATHER_ENDPOINT = 'https://api.open-meteo.com/v1/forecast';

/**
 * Previsão do tempo via Open-Meteo (sem chave; CC BY 4.0, exige atribuição na interface).
 * Mantém cache em memória por coordenada, para não repetir a consulta ao navegar entre páginas.
 */
@Injectable({ providedIn: 'root' })
export class WeatherService {
  private readonly http = inject(HttpClient);
  private readonly cache = new Map<string, Observable<Weather>>();

  forecast(latitude: number, longitude: number): Observable<Weather> {
    const key = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
    const cached = this.cache.get(key);
    if (cached) return cached;
    const request = this.http
      .get<OpenMeteoResponse>(WEATHER_ENDPOINT, {
        params: {
          latitude: latitude.toFixed(4),
          longitude: longitude.toFixed(4),
          current: 'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,is_day',
          daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,uv_index_max,sunrise,sunset',
          timezone: 'America/Sao_Paulo',
          forecast_days: 7,
        },
      })
      .pipe(
        map((r) => this.parse(r)),
        // Em caso de erro, não guarda no cache: uma nova visita tenta de novo.
        tap({ error: () => this.cache.delete(key) }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    this.cache.set(key, request);
    return request;
  }

  private parse(r: OpenMeteoResponse): Weather {
    const c = r.current;
    const d = r.daily;
    return {
      current: {
        temperature: c.temperature_2m,
        apparent: c.apparent_temperature,
        humidity: c.relative_humidity_2m,
        precipitation: c.precipitation,
        windSpeed: c.wind_speed_10m,
        code: c.weather_code,
        isDay: c.is_day === 1,
      },
      days: d.time.map((date, i) => ({
        date,
        code: d.weather_code[i],
        tempMax: d.temperature_2m_max[i],
        tempMin: d.temperature_2m_min[i],
        rainProbability: d.precipitation_probability_max[i] ?? null,
        rainSum: d.precipitation_sum[i],
        uvIndex: d.uv_index_max[i] ?? null,
        sunrise: d.sunrise[i],
        sunset: d.sunset[i],
      })),
    };
  }
}
