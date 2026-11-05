# Evidencia SCRUM-110: Soporte de Pantallas Pequeñas y Fuente Grande con Alturas Flexibles

**Historia de Usuario:** SCRUM-86 - Interfaz responsiva en teléfonos, tablets y horizontal  
**Subtarea:** SCRUM-110 - Soportar fuente grande y pantallas pequeñas con alturas flexibles  
**Rama:** `feature/UI-UX-sistema-diseno-mobile`  
**Fecha:** 30 de Octubre de 2026  

---

## 1. Resumen de la Implementación

Se realizó una auditoría y refactorización integral en `mobile/src/` para asegurar que las 5 pantallas principales de la aplicación (`(auth)/login`, `(auth)/register`, `(app)/index` (Agenda), `(app)/events/new` y `EventDetailModal`) mantengan su legibilidad, usabilidad e integridad visual bajo condiciones extremas:
1. **Pantallas pequeñas y estrechas (320 dp de ancho)**: Dispositivos compactos y ventanas reducidas.
2. **Fuente grande del sistema / Accesibilidad (Dynamic Type / Large Fonts)**: Escalado de texto sin recortes ni solapamientos.
3. **Títulos extensos (hasta 100 caracteres)**: Comportamiento adecuado en tarjetas y modales.

---

## 2. Auditoría de Alturas Fijas y Corrección a `minHeight`

Se ejecutó una búsqueda y eliminación de `height:` fijos en contenedores de texto:

- **Celdas del Calendario (`MonthCalendar`)**:
  - Antes: `height: 38`, `width: 38` en `dayCell`.
  - Ahora: `minWidth: 36`, `minHeight: 36`, `borderRadius: 18`, `paddingHorizontal: 2`. Permite que la celda se expanda verticalmente de forma suave sin cortar los números de día cuando la fuente aumenta.
- **Botones (`Button`, `IconButton`)**:
  - Todos usan `minHeight: 48` (tamaño md) y `minHeight: 36` (tamaño sm con hitSlop $\ge 44$ dp).
- **Entradas de Texto (`TextField`, `DateField`, `TimeField`)**:
  - Usan `minHeight: 48` con `alignItems: multiline ? 'flex-start' : 'center'`.
- **Selectores (`OptionSelector`)**:
  - `minHeight: 44` y `minWidth: 44` con `flexWrap: 'wrap'` y `gap: 8`, garantizando adaptabilidad en anchos estrechos.

---

## 3. Adaptación a Pantallas Estrechas (`320 dp`) con `isNarrow`

En `mobile/src/utils/window-size-model.ts`:
- Se incorporó la bandera reactiva `isNarrow: width < 360` a `WindowSizeConfig`.
- En `mobile/src/app/(app)/events/new.tsx`:
  - Los selectores de `Fecha` y `Hora` se agrupaban en una fila `row: { flexDirection: 'row' }`.
  - Con `isNarrow`, la fila cambia dinámicamente a `column` (`styles.column` y `styles.fullCol`), permitiendo que cada selector ocupe el ancho completo disponible (280+ dp efectivos) sin comprimir los textos de fecha ni provocar desbordamientos.

---

## 4. Gestión de Títulos Largos (100 Caracteres)

- **En Tarjeta (`EventCard`)**:
  - Se configuró `<ThemedText numberOfLines={2} ellipsizeMode="tail" style={styles.title}>`.
  - Títulos de hasta 100 caracteres se muestran limpiamente en hasta 2 renglones con elipsis (`...`), preservando el layout de la lista.
- **En Detalle (`EventDetailModal`)**:
  - Se configuró `styles.title` con `flex: 1`, `marginRight: 12` y sin límite de líneas.
  - El título completo de 100 caracteres hace salto de línea fluido sin colisionar con el botón de cierre ni desbordar la tarjeta del modal.

---

## 5. Control de Escalado de Texto (`maxFontSizeMultiplier`)

- **Base (`ThemedText`)**:
  - Por defecto aplica `maxFontSizeMultiplier = 1.5`, permitiendo un crecimiento de hasta 150% del tamaño base del texto para satisfacer WCAG 1.4.4 (Resize text) sin romper la arquitectura de cajas.
- **Días y Encabezados del Calendario**:
  - Se limitó a `maxFontSizeMultiplier = 1.3` en `dayText` y `weekdayText` para evitar que un número de 2 dígitos (ej. "28") rompa en dos líneas dentro de una cuadrícula de 7 columnas en pantallas pequeñas.

---

## 6. Resultados de Verificación y Pruebas

- **TypeScript (`npx tsc --noEmit`)**: 0 errores de compilación.
- **Suite de Pruebas (`npm test --prefix mobile`)**: 259 pruebas pasando satisfactoriamente (0 fallos).
- **Grep de `height:` en `mobile/src/`**: Ningún contenedor de texto posee altura fija.
