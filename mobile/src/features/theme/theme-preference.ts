/**
 * Preferencia de tema de la app. No es un dato sensible, por eso en web se guarda en `localStorage`
 * y en nativo en `expo-secure-store` (ya instalado, evita sumar otra dependencia).
 * Ninguna función lanza: ante cualquier fallo se usa el tema del sistema.
 */

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedScheme = 'light' | 'dark';

const STORAGE_KEY = 'secureplan.theme-preference';

const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined';

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

/** Tema efectivo: la preferencia explícita gana; con `system` se usa el del dispositivo (claro por defecto). */
export function resolveScheme(
  preference: ThemePreference,
  systemScheme: string | null | undefined,
): ResolvedScheme {
  if (preference === 'light' || preference === 'dark') return preference;
  return systemScheme === 'dark' ? 'dark' : 'light';
}

/** Alterna entre claro y oscuro partiendo del tema que el usuario ve en este momento. */
export function toggleScheme(current: ResolvedScheme): ResolvedScheme {
  return current === 'dark' ? 'light' : 'dark';
}

export async function loadThemePreference(): Promise<ThemePreference> {
  try {
    if (isWeb) {
      const value = window.localStorage.getItem(STORAGE_KEY);
      return isThemePreference(value) ? value : 'system';
    }
    const SecureStore = await import('expo-secure-store');
    const value = await SecureStore.getItemAsync(STORAGE_KEY);
    return isThemePreference(value) ? value : 'system';
  } catch {
    return 'system';
  }
}

export async function saveThemePreference(preference: ThemePreference): Promise<void> {
  try {
    if (isWeb) {
      window.localStorage.setItem(STORAGE_KEY, preference);
      return;
    }
    const SecureStore = await import('expo-secure-store');
    await SecureStore.setItemAsync(STORAGE_KEY, preference);
  } catch {
    // La preferencia solo se pierde al reiniciar; no es crítico.
  }
}
