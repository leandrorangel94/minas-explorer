import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { Weather, WeatherService, weatherCondition } from '../../../core/services/weather.service';
import { fadeIn } from '../../animations';
import { Icon } from '../icon/icon';
import { Skeleton } from '../skeleton/skeleton';

type State = { status: 'loading' } | { status: 'error' } | { status: 'ok'; weather: Weather };

/** Seção "Clima" de um destino: condição atual e previsão de 7 dias (Open-Meteo). */
@Component({
  selector: 'me-weather',
  imports: [MatCardModule, DecimalPipe, Icon, Skeleton],
  animations: [fadeIn],
  templateUrl: './weather.html',
  styleUrl: './weather.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeatherSection {
  readonly latitude = input.required<number>();
  readonly longitude = input.required<number>();
  readonly place = input.required<string>();

  private readonly service = inject(WeatherService);

  protected readonly state = toSignal(
    toObservable(computed(() => [this.latitude(), this.longitude()] as const)).pipe(
      switchMap(([lat, lon]) =>
        this.service.forecast(lat, lon).pipe(
          map((weather): State => ({ status: 'ok', weather })),
          catchError(() => of<State>({ status: 'error' })),
          startWith<State>({ status: 'loading' }),
        ),
      ),
    ),
    { initialValue: { status: 'loading' } as State },
  );

  protected readonly condition = (code: number, isDay = true) => weatherCondition(code, isDay);

  protected weekday(iso: string, index: number): string {
    if (index === 0) return 'Hoje';
    return new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
  }

  protected time(iso: string): string {
    return iso.slice(11, 16);
  }
}
