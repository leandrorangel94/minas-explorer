import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { EnrichmentService, formatDistance, translateOpeningHours } from './enrichment.service';
import { WEATHER_ENDPOINT, Weather, WeatherService, weatherCondition } from './weather.service';

const apiResponse = {
  current: { temperature_2m: 22.4, apparent_temperature: 23, relative_humidity_2m: 60, precipitation: 0, weather_code: 2, wind_speed_10m: 9, is_day: 1 },
  daily: {
    time: ['2026-11-20', '2026-11-21'], weather_code: [2, 63], temperature_2m_max: [28, 25], temperature_2m_min: [16, 15],
    precipitation_probability_max: [10, null], precipitation_sum: [0, 6], uv_index_max: [9, null],
    sunrise: ['2026-11-20T05:30', '2026-11-21T05:30'], sunset: ['2026-11-20T18:20', '2026-11-21T18:21'],
  },
};

describe('WeatherService', () => {
  let http: HttpTestingController;
  let service: WeatherService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(WeatherService);
  });

  afterEach(() => http.verify());

  it('consulta o Open-Meteo e converte a resposta', () => {
    let weather: Weather | undefined;
    service.forecast(-20.38, -43.5).subscribe((w) => (weather = w));
    const req = http.expectOne((r) => r.url === WEATHER_ENDPOINT);
    expect(req.request.params.get('latitude')).toBe('-20.3800');
    expect(req.request.params.get('timezone')).toBe('America/Sao_Paulo');
    req.flush(apiResponse);
    expect(weather!.current.temperature).toBe(22.4);
    expect(weather!.current.isDay).toBe(true);
    expect(weather!.days).toHaveLength(2);
    expect(weather!.days[1].rainProbability).toBeNull();
  });

  it('reaproveita a consulta (cache por coordenada)', () => {
    service.forecast(-20.38, -43.5).subscribe();
    service.forecast(-20.38, -43.5).subscribe();
    http.expectOne((r) => r.url === WEATHER_ENDPOINT).flush(apiResponse);
  });

  it('não guarda erro no cache', () => {
    service.forecast(-19.9, -43.9).subscribe({ error: () => undefined });
    http.expectOne((r) => r.url === WEATHER_ENDPOINT).flush('x', { status: 500, statusText: 'erro' });
    service.forecast(-19.9, -43.9).subscribe();
    http.expectOne((r) => r.url === WEATHER_ENDPOINT).flush(apiResponse);
  });

  it('traduz códigos WMO', () => {
    expect(weatherCondition(0).label).toBe('Céu limpo');
    expect(weatherCondition(0, false).icon).toBe('moon');
    expect(weatherCondition(63).icon).toBe('cloud-rain');
    expect(weatherCondition(95).label).toBe('Tempestade');
  });
});

describe('EnrichmentService', () => {
  it('devolve o item por id e tolera arquivo ausente', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const http = TestBed.inject(HttpTestingController);
    const service = TestBed.inject(EnrichmentService);
    const seen: unknown[] = [];
    service.forId('x').subscribe((v) => seen.push(v));
    http.expectOne('data/enrichment.json').flush('', { status: 404, statusText: 'Not Found' });
    expect(seen).toEqual([undefined]);
  });

  it('traduz horários e formata distâncias', () => {
    expect(translateOpeningHours('Mo-Fr 08:00-17:00; Su off')).toBe('Seg-Sex 08:00-17:00; Dom fechado');
    expect(formatDistance(33)).toBe('30 m');
    expect(formatDistance(1530)).toBe('1,5 km');
  });
});
