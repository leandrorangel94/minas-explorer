import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

/** Providers globais dos testes: animações desativadas (noop), para componentes com triggers. */
export default [provideAnimationsAsync('noop')];
