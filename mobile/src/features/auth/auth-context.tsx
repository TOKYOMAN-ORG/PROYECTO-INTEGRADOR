/**
 * Estado global de autenticación (SCRUM-29 / SCRUM-30).
 *
 * `AuthProvider` expone `status`, `signIn(token)` y `signOut()` (SCRUM-29) y, para el arranque sin red, `sessionError`
 * y `retryRestore()` (SCRUM-30). El JWT nunca sale de este módulo ni de `secure-token-storage`: las pantallas solo
 * ven `status` y las acciones, no el token.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { classifyRestoreError, getMe, login, type LoginInput, type RestoreFailure } from './auth-api.ts';
import { deleteToken, getToken } from '../../storage/secure-token-storage.ts';
import { onSessionExpired } from '../../services/http-client.ts';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

/** Fallo controlado al restaurar la sesión (sin red o inesperado); el token se conserva y se ofrece reintento. */
export type SessionError = Exclude<RestoreFailure, 'invalid'>;

type AuthContextValue = {
  status: AuthStatus;
  /** Presente cuando la validación de la sesión falló por un motivo distinto a un 401; ver `retryRestore`. */
  sessionError: SessionError | null;
  /** Indica si la sesión fue cerrada debido a un 401 recibido en una petición autenticada (SCRUM-52). */
  sessionExpired: boolean;
  /** Limpia el indicador de sesión expirada. */
  clearSessionExpired: () => void;
  /** Reintenta restaurar la sesión tras un fallo controlado. */
  retryRestore: () => void;
  /** Establece una sesión autenticada para un `token` ya persistido (SCRUM-29). */
  signIn: (token: string) => void;
  /** Ejecuta el login, persiste el token en SecureStore y autentica. Las pantallas nunca ven el token. */
  signInWithCredentials: (input: LoginInput) => Promise<void>;
  /** Borra el token y vuelve a la pila de autenticación (SCRUM-29). */
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return value;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [sessionError, setSessionError] = useState<SessionError | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [restoreAttempt, setRestoreAttempt] = useState(0);
  // Copia en memoria del token de la sesión vigente; la persistencia vive en SecureStore. No se expone por contexto.
  const tokenRef = useRef<string | null>(null);

  // Restaura la sesión al arrancar (SCRUM-30). `active` evita escribir estado tras desmontar o en un reintento cancelado.
  useEffect(() => {
    let active = true;

    async function restore() {
      setStatus('loading');
      setSessionError(null);

      const token = await getToken();
      if (!active) return;
      if (!token) {
        tokenRef.current = null;
        setStatus('unauthenticated');
        return;
      }

      try {
        await getMe(token);
        if (!active) return;
        tokenRef.current = token;
        setStatus('authenticated');
      } catch (error) {
        if (!active) return;
        const failure = classifyRestoreError(error);
        if (failure === 'invalid') {
          // 401: el token ya no sirve; se borra para no dejar credenciales obsoletas en el dispositivo.
          await deleteToken();
          if (!active) return;
          tokenRef.current = null;
          setStatus('unauthenticated');
          return;
        }
        // Sin red o fallo inesperado: el token puede seguir siendo válido, se conserva y se ofrece reintento.
        tokenRef.current = token;
        setSessionError(failure);
        setStatus('unauthenticated');
      }
    }

    void restore();
    return () => {
      active = false;
    };
  }, [restoreAttempt]);

  // Interceptor de 401 en peticiones autenticadas: borra la sesión y notifica expiración (SCRUM-52).
  useEffect(() => {
    return onSessionExpired(() => {
      tokenRef.current = null;
      setSessionExpired(true);
      setSessionError(null);
      setStatus('unauthenticated');
    });
  }, []);

  const retryRestore = useCallback(() => setRestoreAttempt((attempt) => attempt + 1), []);

  const clearSessionExpired = useCallback(() => setSessionExpired(false), []);

  const signIn = useCallback((token: string) => {
    tokenRef.current = token;
    setSessionError(null);
    setSessionExpired(false);
    setStatus('authenticated');
  }, []);

  const signInWithCredentials = useCallback(
    async (input: LoginInput) => {
      await login(input); // persiste el token en SecureStore sin exponerlo a la pantalla
      const token = await getToken();
      if (!token) throw new Error('No se pudo leer el token de sesión');
      signIn(token);
    },
    [signIn],
  );

  const signOut = useCallback(async () => {
    await deleteToken();
    tokenRef.current = null;
    setSessionError(null);
    setSessionExpired(false);
    setStatus('unauthenticated');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      sessionError,
      sessionExpired,
      clearSessionExpired,
      retryRestore,
      signIn,
      signInWithCredentials,
      signOut,
    }),
    [
      status,
      sessionError,
      sessionExpired,
      clearSessionExpired,
      retryRestore,
      signIn,
      signInWithCredentials,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
