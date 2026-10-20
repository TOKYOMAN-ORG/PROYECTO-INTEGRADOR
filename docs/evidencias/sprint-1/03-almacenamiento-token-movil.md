# 03 · Almacenamiento del token en la app móvil (criterio 3)

**Objetivo:** confirmar que el JWT únicamente se lee y escribe mediante Expo SecureStore, sin
`AsyncStorage` ni `localStorage`.

**Método:** búsquedas de texto sobre los archivos trackeados de `mobile/` (raíz de la rama).

## Resultados

### 3.1 Dependencias de almacenamiento en `mobile/package.json`

```text
15:    "expo-secure-store": "~57.0.4",
```

No hay `@react-native-async-storage/async-storage`, `react-native-mmkv` ni ninguna otra dependencia
de almacenamiento persistente.

### 3.2 ¿AsyncStorage / localStorage / sessionStorage en `mobile/src`?

```text
$ grep -rnEi "AsyncStorage|localStorage|sessionStorage" mobile/src
(sin coincidencias)
```

✅ No se usan en ningún archivo de la app.

### 3.3 Archivos que tocan SecureStore o el servicio de token

```text
$ grep -rlnE "expo-secure-store|secure-token-storage" mobile/src
mobile/src/features/auth/auth-api.test.ts
mobile/src/features/auth/auth-api.ts
mobile/src/storage/secure-token-storage.test.ts
mobile/src/storage/secure-token-storage.ts
```

`auth-api.ts` (y `auth-context.tsx`) trabajan con el token **a través del servicio**
`secure-token-storage.ts`; solo ese módulo importa `expo-secure-store`.

### 3.4 Único punto de lectura/escritura del token

```text
$ grep -rnE "SecureStore\.(get|set|delete)ItemAsync" mobile/src
mobile/src/storage/secure-token-storage.ts:17:    await SecureStore.setItemAsync(TOKEN_KEY, token);
mobile/src/storage/secure-token-storage.ts:27:    return await SecureStore.getItemAsync(TOKEN_KEY);
mobile/src/storage/secure-token-storage.ts:36:    await SecureStore.deleteItemAsync(TOKEN_KEY);
```

## Conclusión

- ✅ El token se guarda, lee y borra **solo** en `mobile/src/storage/secure-token-storage.ts`, que es
  el único módulo que importa `expo-secure-store` (Keychain en iOS / Keystore en Android).
- ✅ Sin `AsyncStorage`, `localStorage` ni `sessionStorage` en la app.

> **Nota (rama `feature/SCRUM-8-navegacion-protegida`, pendiente de merge):** para poder probar en
> navegador se añade un fallback **solo en memoria** en web (el token se pierde al recargar la pestaña
> y nunca se escribe en `localStorage` ni en disco). En dispositivos móviles no cambia nada: se sigue
> usando SecureStore. Este hallazgo se mantiene: no hay persistencia fuera del almacén seguro.
