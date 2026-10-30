# SecurePlan Mobile — App móvil

App Expo (SDK 57) con `expo-router` y TypeScript estricto. Forma parte del monorepo descrito en el [README de la raíz](../README.md), que explica cómo levantar la base de datos y el backend.

## Arranque

```bash
cp .env.example .env     # revisa EXPO_PUBLIC_API_URL según tu emulador o dispositivo
npm install
npx expo start
```

`EXPO_PUBLIC_API_URL` es la **única** fuente de la URL del backend. Es pública (queda dentro del bundle): nunca pongas secretos en variables `EXPO_PUBLIC_*`.

## Comandos

| Comando | Para qué |
|---|---|
| `npx expo start` | Servidor de desarrollo (Expo Go, emulador o web). |
| `npm run lint` | ESLint (`eslint-config-expo`). |
| `npx tsc --noEmit` | Comprobación de tipos. |
| `npm test` | Pruebas unitarias (`node:test`, archivos `*.test.ts`). |

## Estructura de `src/`

Cada carpeta tiene una única responsabilidad. Una carpeta vacía lleva un `.gitkeep`; bórralo al añadir el primer archivo.

| Carpeta | Responsabilidad | No debe contener |
|---|---|---|
| `app/` | Solo rutas y layouts de `expo-router` (cada archivo es una pantalla). | Lógica de negocio, llamadas a la API, componentes reutilizables. |
| `features/<módulo>/` | Todo lo propio de un módulo funcional: sus componentes, hooks y tipos. Hoy `features/auth/` (autenticación). | Código compartido entre módulos. |
| `services/` | Comunicación con la API: `http-client.ts` (cliente base) y, sobre él, una función por endpoint. | Componentes, estado de UI, acceso al almacenamiento seguro. |
| `storage/` | Persistencia local y segura (SecureStore para el JWT). | Llamadas a la API. |
| `components/` | UI reutilizable y sin lógica de negocio (`themed-text`, `themed-view`). | Componentes de un solo módulo (van en su `features/`). |
| `hooks/` | Hooks genéricos reutilizables (`use-theme`, `use-color-scheme`). | Hooks de un solo módulo. |
| `constants/` | Valores constantes de la app (tema, espaciados). | URLs de la API ni secretos. |
| `types/` | Tipos de TypeScript compartidos entre módulos. | Tipos de un solo módulo. |

El alias `@/` apunta a `src/` (`import { ThemedText } from '@/components/themed-text'`).

## Cliente HTTP

`services/http-client.ts` exporta `request`, que usa `fetch`, lee la URL base de `process.env.EXPO_PUBLIC_API_URL`, aplica un timeout (10 s por defecto) y serializa el cuerpo como JSON. **Nunca rechaza con una excepción cruda**, solo con:

| Error | Cuándo |
|---|---|
| `NetworkError` | Sin red, host inalcanzable, timeout o `EXPO_PUBLIC_API_URL` sin configurar. |
| `ApiError` | Respuesta no 2xx (o 2xx con cuerpo ilegible). Trae `status` y `message` (el de NestJS cuando existe). |

```ts
import { ApiError, NetworkError, request } from '@/services/http-client';

try {
  const health = await request<{ status: string }>('/api/health'); // las rutas llevan el prefijo /api del backend
} catch (error) {
  if (error instanceof ApiError) { /* error.status, error.message */ }
  else if (error instanceof NetworkError) { /* sin conexión o sin respuesta */ }
}
```

Alcance actual: el cliente aún no adjunta el JWT; los interceptores de autenticación llegan en el Sprint 2.

## Sistema de Diseño y UI/UX

La arquitectura visual, principios de accesibilidad (WCAG AA), tokens semánticos y la matriz de componentes reutilizables están especificados en la [Guía de Diseño UI/UX](../docs/diseno-ui.md).
