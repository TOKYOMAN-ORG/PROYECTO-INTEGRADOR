# Evidencia SCRUM-115: Auditoría de Dependencias y Verificación con expo-doctor

**Historia de Usuario:** SCRUM-89 - Limpiar dependencias y verificar la calidad de la app  
**Subtarea:** SCRUM-115 - Revisar las dependencias de UI sin uso con expo-doctor  
**Rama:** `feature/UI-UX-sistema-diseno-mobile`  
**Fecha:** 30 de Octubre de 2026  

---

## 1. Resumen de la Implementación

En cumplimiento con los objetivos de optimización del Sprint UI/UX y la preparación para la auditoría técnica de dependencias del Sprint 4, se auditó exhaustivamente la superficie de paquetes instalados en `mobile/package.json`. Se desinstalaron los paquetes superfluos o descartados durante las fases de diseño y se validó la integridad global del proyecto mediante `npx expo-doctor`.

---

## 2. Paquetes Desinstalados (`npm uninstall`)

1. **`@expo/ui`**: Descartado formalmente en SCRUM-80 por su modelo rígido de widgets nativos incompatible con el layout responsive de Flexbox y estilos personalizados.
2. **`expo-glass-effect`**: Innecesario; los efectos de superficie se gestionan coherentemente con los tokens de elevación y colores semánticos (`theme.ts`).
3. **`expo-image`**: Sustituido por iconografía nativa vectorial (`expo-symbols`) y assets locales vectorizados.
4. **`expo-web-browser`**: No requerido para los flujos de sesión (autenticación JWT directa con `expo-secure-store`).

---

## 3. Matriz de Dependencias en `docs/diseno-ui.md`

Se actualizó la guía oficial del sistema de diseño incorporando la **Sección 6: Matriz de Dependencias de UI y Diagnóstico `expo-doctor`**, categorizando cada paquete en **Retirado**, **Conservado / Usado** o **Requerido por Expo Router / Framework**.

---

## 4. Diagnóstico de Salud con `npx expo-doctor`

Se ejecutó la herramienta oficial de diagnóstico de Expo SDK 57:
```bash
npx expo-doctor
```
**Salida del comando:**
```text
Running 21 checks on your project...
21/21 checks passed. No issues detected!
```
- **Integridad de versiones**: 21/21 checks aprobados (código de salida 0).
- **Consistencia de dependencias**: `package.json` y `package-lock.json` sincronizados y limpios.
- **Plugins de `app.json`**: Ningún paquete retirado permanece referenciado.
- **Referencias en código (`src/`)**: 0 importaciones huérfanas.
