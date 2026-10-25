/**
 * Único lugar donde vive el JWT.
 *
 * - Nativo (iOS/Android): el almacén seguro del sistema (Keychain en iOS, Keystore en Android) vía expo-secure-store.
 * - Web: `expo-secure-store` no tiene implementación (su módulo web está vacío), así que el token
 *   vive SOLO en memoria de la pestaña: nunca se escribe en `localStorage` ni en disco y desaparece
 *   al recargar, por lo que en web tampoco hay sesión persistente.
 * - Node (tests): si `expo-secure-store` está mockeado se utiliza el mock; si no está disponible, se utiliza
 *   almacenamiento en memoria sin romper la carga del módulo.
 *
 * Ninguna función lanza: si el almacén falla devuelven `false` / `null` y el llamador decide qué mostrar.
 */

// Las claves solo admiten letras, dígitos, ".", "-" y "_".
const TOKEN_KEY = 'secureplan.access-token';

/**
 * ¿Estamos en el navegador? Se comprueba `document` porque existe solo allí: ni en Node (tests) ni en
 * React Native nativo (tiene `window`, pero no `document`).
 */
const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined';

// Copia en memoria del token. Usada en web o en entornos Node sin módulo nativo.
let memoryToken: string | null = null;

async function getSecureStore(): Promise<typeof import('expo-secure-store') | null> {
  if (isWeb) return null;
  try {
    return await import('expo-secure-store');
  } catch {
    return null;
  }
}

/** `true` si el token quedó guardado. */
export async function saveToken(token: string): Promise<boolean> {
  if (isWeb) {
    memoryToken = token;
    return true;
  }
  try {
    const store = await getSecureStore();
    if (!store) {
      memoryToken = token;
      return true;
    }
    await store.setItemAsync(TOKEN_KEY, token);
    return true;
  } catch {
    return false;
  }
}

/** El token guardado, o `null` si no hay ninguno o el almacén falla. */
export async function getToken(): Promise<string | null> {
  if (isWeb) return memoryToken;
  try {
    const store = await getSecureStore();
    if (!store) return memoryToken;
    return await store.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

/** `true` si no queda token guardado. */
export async function deleteToken(): Promise<boolean> {
  if (isWeb) {
    memoryToken = null;
    return true;
  }
  try {
    const store = await getSecureStore();
    if (!store) {
      memoryToken = null;
      return true;
    }
    await store.deleteItemAsync(TOKEN_KEY);
    return true;
  } catch {
    return false;
  }
}

