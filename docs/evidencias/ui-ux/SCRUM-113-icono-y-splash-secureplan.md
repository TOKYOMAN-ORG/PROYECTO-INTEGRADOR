# Evidencia SCRUM-113: Diseño e Integración de Ícono, Ícono Adaptable y Splash de SecurePlan

**Historia de Usuario:** SCRUM-88 - Diseñar los iconos de la app y la pantalla de carga / splash  
**Subtarea:** SCRUM-113 - Crear ícono, ícono adaptable y splash de SecurePlan y ajustar app.json  
**Rama:** `feature/UI-UX-sistema-diseno-mobile`  
**Fecha:** 30 de Octubre de 2026  

---

## 1. Resumen de la Implementación

Se diseñó e integró la identidad visual completa de la aplicación SecurePlan, sustituyendo por completo todos los assets y configuraciones por defecto de la plantilla de Expo. La nueva identidad combina el concepto de seguridad y planificación mediante un emblema vectorizado consistente en un escudo con calendario integrado y checkmark, utilizando los colores primarios del sistema de diseño (`#2563EB`, `#1D4ED8`, `#3B82F6` y fondos `#0B1120` / `#FFFFFF`).

---

## 2. Especificación de Assets Generados

Todos los assets se generaron a partir de gráficos vectoriales matemáticamente precisos y se optimizaron para producción móvil:

| Archivo | Dimensiones | Formato / Canal | Propósito |
|---|---|---|---|
| `mobile/assets/images/icon.png` | **1024 × 1024 px** | PNG RGB (sin canal alfa / opaco) | Ícono principal de la aplicación para App Store y Google Play Store, sin esquinas redondeadas artificiales. |
| `mobile/assets/images/android-icon-foreground.png` | **432 × 432 px** | PNG RGBA (transparente) | Primer plano del ícono adaptable de Android con margen para la zona segura central (72 dp). |
| `mobile/assets/images/android-icon-background.png` | **432 × 432 px** | PNG RGBA | Fondo del ícono adaptable de Android con gradiente sutil `#1D4ED8` a `#2563EB`. |
| `mobile/assets/images/android-icon-monochrome.png` | **432 × 432 px** | PNG RGBA (escala de grises) | Versión monocromática para íconos temáticos de Material You (Android 13+). |
| `mobile/assets/images/splash-icon.png` | **512 × 512 px** | PNG RGBA (transparente) | Ícono central de pantalla de carga (splash) para tema claro (`#2563EB` de fondo). |
| `mobile/assets/images/splash-icon-dark.png` | **512 × 512 px** | PNG RGBA (transparente) | Ícono central de pantalla de carga (splash) para tema oscuro (`#0B1120` de fondo). |
| `mobile/assets/images/favicon.png` | **48 × 48 px** | PNG RGBA | Favicon para navegador Web. |

---

## 3. Limpieza de Assets de Plantilla

- Se eliminó el directorio de plantilla `mobile/assets/expo.icon/` que contenía archivos de demostración (`expo-symbol 2.svg` y `grid.png`).
- Ningún archivo de plantilla de Expo permanece en `mobile/assets/`.

---

## 4. Ajustes en `mobile/app.json`

Se actualizó la configuración declarativa del proyecto:
1. `name`: Cambiado de `"mobile"` a `"SecurePlan"`.
2. `android.adaptiveIcon.backgroundColor`: Asignado a `#2563EB` (Primary Token).
3. `expo-splash-screen`:
   - Configuración para tema claro: `backgroundColor: "#2563EB"`, `image: "./assets/images/splash-icon.png"`, `imageWidth: 120`.
   - Configuración para tema oscuro: `dark: { backgroundColor: "#0B1120", image: "./assets/images/splash-icon-dark.png" }`.
4. `ios`: Retirada la referencia al directorio obsoleto `expo.icon` para utilizar el `icon.png` de 1024 × 1024 estándar.

---

## 5. Verificación de Compilación y Calidad

- `file mobile/assets/images/icon.png`: Confirma 1024 × 1024, RGB (sin transparencia).
- Suite de pruebas unitarias (`npm test --prefix mobile`): 259 pruebas pasando satisfactoriamente.
- TypeScript (`npx tsc --noEmit`): 0 errores.
