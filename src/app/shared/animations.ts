import { animate, keyframes, query, stagger, style, transition, trigger } from '@angular/animations';

/**
 * Animações reutilizáveis (@angular/animations). Curvas suaves e durações curtas (200 a 300 ms).
 * São desligadas globalmente quando o usuário prefere menos movimento (`[@.disabled]` em app.html).
 */
const EASE = 'cubic-bezier(0.2, 0.7, 0.2, 1)';

/** Entrada da página nova ao trocar de rota (fade + leve subida). */
export const pageTransition = trigger('pageTransition', [
  transition('* <=> *', [
    query(':enter', [style({ opacity: 0, transform: 'translateY(10px)' }), animate(`280ms ${EASE}`, style({ opacity: 1, transform: 'none' }))], {
      optional: true,
    }),
  ]),
]);

/** Cards/linhas entrando em sequência (só os primeiros, para não alongar listas grandes). */
export const staggerIn = trigger('staggerIn', [
  transition('* => *', [
    query(
      ':enter',
      [style({ opacity: 0, transform: 'translateY(12px)' }), stagger(28, animate(`260ms ${EASE}`, style({ opacity: 1, transform: 'none' })))],
      { optional: true, limit: 12 },
    ),
  ]),
]);

/** Conteúdo aparecendo (ex.: depois do skeleton). */
export const fadeIn = trigger('fadeIn', [transition(':enter', [style({ opacity: 0 }), animate(`260ms ease-out`, style({ opacity: 1 }))])]);

/** Abre e fecha painéis (altura + opacidade). */
export const expandCollapse = trigger('expandCollapse', [
  transition(':enter', [style({ height: 0, opacity: 0, overflow: 'hidden' }), animate(`220ms ${EASE}`, style({ height: '*', opacity: 1 }))]),
  transition(':leave', [style({ overflow: 'hidden' }), animate('180ms ease-in', style({ height: 0, opacity: 0 }))]),
]);

/** Troca de imagem (galeria): a nova aparece com fade. */
export const crossFade = trigger('crossFade', [transition('* => *', [style({ opacity: 0.25 }), animate('240ms ease-out', style({ opacity: 1 }))])]);

/** "Pulso" do coração ao favoritar. */
export const heartPop = trigger('heartPop', [
  transition('false => true', [
    animate('340ms ease-out', keyframes([style({ transform: 'scale(1)', offset: 0 }), style({ transform: 'scale(1.4)', offset: 0.4 }), style({ transform: 'scale(1)', offset: 1 })])),
  ]),
]);
