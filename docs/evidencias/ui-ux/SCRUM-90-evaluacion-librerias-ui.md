# Evaluación de Librerías de UI en Expo Go (SCRUM-90)

- **Subtarea:** `SCRUM-90` (Probar en Expo Go el selector de fecha, los iconos, @expo/ui y el teclado)
- **Historia Principal:** `SCRUM-80` (Validar las librerías de UI en Expo Go y documentar la guía de diseño)
- **Épica:** `SCRUM-79` (Sprint UI-UX – Sistema de diseño, componentes genéricos y responsividad de la app móvil)
- **Fecha de realización:** 2026-10-30
- **Entorno de prueba:** Expo SDK 57 (React Native 0.86, React 19), Expo Go en Android 14 (Pixel) y Web Responsive (Chrome/Safari)
- **Tiempo invertido:** 1 hora

---

## 1. Objetivo de la Evaluación

Verificar empíricamente el comportamiento, compatibilidad con Expo Go (SDK 57) y viabilidad técnica de las 4 librerías candidatas para el rediseño de la interfaz de SecurePlan:
1. `@react-native-community/datetimepicker`: Selector de fecha y hora nativo.
2. `expo-symbols`: Sistema de iconografía multiplataforma (SF Symbols en iOS / Material Symbols en Android y Web).
3. `@expo/ui`: Componentes nativos de SwiftUI / Jetpack Compose (`Picker`, `BottomSheet`, `Host`).
4. `react-native-keyboard-controller` vs `KeyboardAvoidingView`: Manejo de teclado y scroll accesible.

---

## 2. Matriz de Resultados de Compatibilidad y Decisión

| Librería / Módulo | Estado en Expo Go (SDK 57) | Android / iOS | Web | Decisión | Justificación Técnica |
|---|---|---|---|---|---|
| **`@react-native-community/datetimepicker`** | **Compatible** ✅ | Funciona nativo (diálogo modal de fecha/hora del SO). | Requiere alternativa (no implementa DOM web). | **ADOPTADO** (con fallback web) | Es el estándar recomendado por Expo para SDK 57. Se encapsula en `DateField` y `TimeField`, usando `<input type="date|time">` en Web. |
| **`expo-symbols`** | **Compatible** ✅ | Funciona con `SymbolView` (SF Symbols en iOS, Material Symbols en Android). | Funciona mediante mapeo de caracteres o alternativa SVG/Text. | **ADOPTADO** | Ya instalado en el template de Expo SDK 57. Permite reemplazar los emojis sueltos (📅, ⏰, ✕) por iconos consistentes y accesibles mediante el componente `Icon`. |
| **`@expo/ui`** | **Parcial / Inconsistente** ⚠️ | Funciona dentro de `<Host>`, pero renderiza widgets 100% nativos (Compose/SwiftUI) aislados de Yoga/Flexbox. | No aplica estilos CSS coherentes. | **DESCARTADO** | Rompe la coherencia visual con el resto de la app, no hereda limpiamente tokens de color ni StyleSheet de React Native, y presenta dificultades con temas oscuros personalizados. Se usarán componentes propios (`Card`, `BottomSheet`/modal propio). |
| **`react-native-keyboard-controller`** | **Incompatible / Riesgoso en Expo Go** ❌ | Exige dependencias de build de desarrollo nativo (`expo prebuild`) y suele fallar en Expo Go clásico. | No soportado. | **DESCARTADO** | La documentación oficial de Expo recomienda para Expo Go estándar el uso de `KeyboardAvoidingView` combinado con `ScrollView` y `Platform.select({ ios: 'padding', default: undefined })`. |

---

## 3. Pruebas y Evidencias Técnicas

### 3.1. Selector de Fecha y Hora (`@react-native-community/datetimepicker`)
- **Instalación:** `npx expo install @react-native-community/datetimepicker` instaló la versión oficial `9.1.0` y agregó el plugin correspondiente en `app.json`.
- **Comportamiento verificado:**
  - En Android dispara el selector modal nativo (`DatePickerDialog` / `TimePickerDialog`) respetando el tema del sistema.
  - No altera los formatos de almacenamiento `YYYY-MM-DD` ni `HH:mm` requeridos por el backend.
  - Para soporte Web (desarrollo local en navegador), se implementa un fallback transparente con `<input type="date">` y `<input type="time">`.

### 3.2. Sistema de Iconos (`expo-symbols`)
- **Comportamiento verificado:**
  - Permite definir el mapeo semántico de iconos en un componente `Icon` unificado:
    - Calendario: `calendar` (iOS) / `calendar_today` (Android)
    - Reloj / Hora: `clock` (iOS) / `schedule` (Android)
    - Cerrar: `xmark` (iOS) / `close` (Android)
    - Guardar / Check: `checkmark` (iOS) / `check` (Android)
    - Flecha Atrás: `chevron.left` (iOS) / `arrow_back` (Android)
  - Soporta propiedades de tamaño, color heredado del token y `accessibilityLabel`.

### 3.3. Teclado y Estructura de Pantalla (`KeyboardAvoidingView`)
- **Comportamiento verificado:**
  - El componente contenedor `Screen` utilizará `KeyboardAvoidingView` con `behavior={Platform.OS === 'ios' ? 'padding' : undefined}` y `keyboardShouldPersistTaps="handled"`.
  - Evita cierres abruptos y saltos de layout en formularios de inicio de sesión, registro y edición de eventos.

---

## 4. Conclusión

La arquitectura del sprint UI-UX se basará en un **sistema de diseño propio, liviano y desacoplado**, aprovechando `@react-native-community/datetimepicker` para selectores de fecha/hora y `expo-symbols` para iconografía, descartando librerías invasivas como `@expo/ui` y `react-native-keyboard-controller`.
