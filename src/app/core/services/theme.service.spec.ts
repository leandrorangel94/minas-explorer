import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { THEME_STORAGE_KEY, ThemeService } from './theme.service';

interface FakeEnv {
  attrs: Map<string, string>;
  store: Map<string, string>;
  fireMedia(matches: boolean): void;
  fireStorage(key: string | null): void;
}

function setup(opts: { systemDark?: boolean; stored?: string; noStorage?: boolean; noMatchMedia?: boolean } = {}) {
  const attrs = new Map<string, string>();
  const store = new Map<string, string>(opts.stored ? [[THEME_STORAGE_KEY, opts.stored]] : []);
  let mediaListener: ((e: { matches: boolean }) => void) | undefined;
  const storageListeners: ((e: { key: string | null }) => void)[] = [];

  const localStorage = {
    getItem: (k: string) => { if (opts.noStorage) throw new DOMException('blocked', 'SecurityError'); return store.get(k) ?? null; },
    setItem: (k: string, v: string) => { if (opts.noStorage) throw new DOMException('blocked', 'SecurityError'); store.set(k, v); },
  };
  const win = {
    get localStorage() { if (opts.noStorage) throw new DOMException('blocked', 'SecurityError'); return localStorage; },
    matchMedia: opts.noMatchMedia ? undefined : () => ({
      matches: opts.systemDark ?? false,
      addEventListener: (_: string, l: (e: { matches: boolean }) => void) => (mediaListener = l),
    }),
    addEventListener: (type: string, l: (e: { key: string | null }) => void) => { if (type === 'storage') storageListeners.push(l); },
  };
  const doc = {
    defaultView: win,
    documentElement: {
      setAttribute: (k: string, v: string) => attrs.set(k, v),
      removeAttribute: (k: string) => attrs.delete(k),
    },
  };

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [{ provide: DOCUMENT, useValue: doc }] });
  const service = TestBed.inject(ThemeService);
  const env: FakeEnv = {
    attrs, store,
    fireMedia: (matches) => mediaListener?.({ matches }),
    fireStorage: (key) => storageListeners.forEach((l) => l({ key })),
  };
  return { service, env };
}

describe('ThemeService', () => {
  it('sem escolha segue o sistema e não define data-theme', () => {
    const light = setup({ systemDark: false });
    expect(light.service.preference()).toBe('system');
    expect(light.service.effective()).toBe('light');
    expect(light.env.attrs.has('data-theme')).toBe(false);

    const dark = setup({ systemDark: true });
    expect(dark.service.effective()).toBe('dark');
    expect(dark.env.attrs.has('data-theme')).toBe(false); // o CSS cuida via prefers-color-scheme
  });

  it('acompanha mudanças do sistema enquanto a preferência é "sistema"', () => {
    const { service, env } = setup({ systemDark: false });
    env.fireMedia(true);
    expect(service.effective()).toBe('dark');
    env.fireMedia(false);
    expect(service.effective()).toBe('light');
  });

  it('escolha manual vale sobre o sistema, é aplicada e salva', () => {
    const { service, env } = setup({ systemDark: false });
    service.set('dark');
    expect(service.effective()).toBe('dark');
    expect(env.attrs.get('data-theme')).toBe('dark');
    expect(env.store.get(THEME_STORAGE_KEY)).toBe('dark');

    env.fireMedia(false); // sistema muda, mas a escolha manual permanece
    expect(service.effective()).toBe('dark');

    service.set('light');
    expect(env.attrs.get('data-theme')).toBe('light');
    expect(service.effective()).toBe('light');
  });

  it('voltar para "sistema" remove o atributo', () => {
    const { service, env } = setup({ systemDark: true });
    service.set('light');
    service.set('system');
    expect(env.attrs.has('data-theme')).toBe(false);
    expect(env.store.get(THEME_STORAGE_KEY)).toBe('system');
    expect(service.effective()).toBe('dark');
  });

  it('restaura a escolha salva ao iniciar', () => {
    const { service, env } = setup({ stored: 'dark' });
    expect(service.preference()).toBe('dark');
    expect(env.attrs.get('data-theme')).toBe('dark');
  });

  it('valor salvo inválido cai para "sistema"', () => {
    for (const bad of ['roxo', '', '{"x":1}', 'null']) {
      const { service, env } = setup({ stored: bad });
      expect(service.preference()).toBe('system');
      expect(env.attrs.has('data-theme')).toBe(false);
    }
  });

  it('LocalStorage indisponível: funciona na sessão, sem lançar', () => {
    const { service, env } = setup({ noStorage: true });
    expect(service.preference()).toBe('system');
    expect(() => service.set('dark')).not.toThrow();
    expect(service.effective()).toBe('dark');
    expect(env.attrs.get('data-theme')).toBe('dark');
  });

  it('sem matchMedia assume claro', () => {
    const { service } = setup({ noMatchMedia: true });
    expect(service.effective()).toBe('light');
    service.set('dark');
    expect(service.effective()).toBe('dark');
  });

  it('sincroniza quando outra aba altera o tema', () => {
    const { service, env } = setup();
    env.store.set(THEME_STORAGE_KEY, 'dark');
    env.fireStorage(THEME_STORAGE_KEY);
    expect(service.preference()).toBe('dark');
    expect(env.attrs.get('data-theme')).toBe('dark');
    env.fireStorage('outra-chave'); // ignorada
    expect(service.preference()).toBe('dark');
  });
});
