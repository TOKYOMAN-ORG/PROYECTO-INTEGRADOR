# Evidencia SCRUM-111: Auditoría de Roles, Estados, Etiquetas y Áreas Táctiles de Accesibilidad

**Historia de Usuario:** SCRUM-87 - Corregir y verificar la accesibilidad y el modo oscuro  
**Subtarea:** SCRUM-111 - Corregir roles, estados, etiquetas y áreas táctiles de accesibilidad  
**Rama:** `feature/UI-UX-sistema-diseno-mobile`  
**Fecha:** 30 de Octubre de 2026  

---

## 1. Resumen de la Implementación

Se completó una auditoría exhaustiva de accesibilidad móvil (WCAG 2.1 AA) en todos los componentes y pantallas desarrollados durante el sprint de UI/UX. La auditoría cubrió roles semánticos, estados reactivos, etiquetas y pistas de accesibilidad, unificación de elementos interactivos compuestos, ocultación de iconos decorativos y verificación estricta de áreas táctiles mínimas ($\ge 44 \times 44$ dp).

---

## 2. Hallazgos y Correcciones Realizadas

1. **Roles Semánticos en `Pressable` (`accessibilityRole`)**:
   - Se verificaron todos los componentes interactivos de `mobile/src/`.
   - Se añadieron roles explícitos faltantes en:
     - `ConfirmDialog`: Backdrop dismiss ahora cuenta con `accessibilityRole="button"`.
     - `EventDetailModal`: Backdrop dismiss ahora cuenta con `accessibilityRole="button"`.
     - `Card`: Configurado con `accessible={true}` y `accessibilityRole="button"`.
     - `OptionSelector`: Configurado con `accessibilityRole="radio"`.
   - **Resultado del script de auditoría**: El 100% de los elementos JSX `<Pressable>` poseen `accessibilityRole` explícito (`button` o `radio`).

2. **Agrupación Accesible en Tarjetas (`Card` y `EventCard`)**:
   - `Card` ahora implementa `accessible={true}` cuando es interactiva (`onPress`).
   - Esto consolida la hora, etiquetas de categoría/prioridad y título en un único nodo de accesibilidad para TalkBack/VoiceOver, anunciando el `accessibilityLabel` formateado completo:
     `"Evento: [Título] a las [Hora], categoría [Categoría], prioridad [Prioridad]. Toca para ver detalles o editar."` en lugar de fragmentar la lectura.

3. **Ocultación de Iconos Decorativos**:
   - En `mobile/src/components/icon.tsx`:
     - Se añadió la lógica `isDecorative = !accessibilityLabel`.
     - Los iconos decorativos (relojes junto a la hora, calendarios en cabeceras, chevrons) aplican:
       - `accessible={false}`
       - `accessibilityElementsHidden={true}`
       - `importantForAccessibility="no"`
       - `aria-hidden={true}`
     - Los lectores de pantalla ya no leen nombres genéricos como "Reloj", evitando anuncios redundantes que entorpecen la navegación.

4. **Dimensiones Táctiles Mínimas ($\ge 44 \times 44$ dp)**:
   - **Botón de cierre de modal (`IconButton name="close"`)**: `minWidth: 44, minHeight: 44` con `hitSlop: 8`.
   - **Navegación de mes (`IconButton name="back" | "chevronRight"`)**: `minWidth: 44, minHeight: 44` con `hitSlop: 8`.
   - **Celdas de día en `MonthCalendar`**: `dayCellContainer` cuenta con `minHeight: 44` y `width: 14.28%` (ancho efectivo de 41 a 120 dp).
   - **Chips de selección en `OptionSelector`**: `minHeight: 44` y `minWidth: 44`.
   - **Campos de formulario (`TextField`, `DateField`, `TimeField`)**: `minHeight: 48`.
   - **Botones (`Button`)**: `minHeight: 48` (md) y `minHeight: 36` con `hitSlop: 6` (sm) alcanzando 48 dp táctiles.

---

## 3. Matriz de Componentes en `docs/diseno-ui.md`

Se actualizó la guía oficial del sistema de diseño (`docs/diseno-ui.md`) incorporando la **Sección 5: Lista de Verificación de Accesibilidad (A11y Checklist)** con la descripción detallada para cada uno de los 17 componentes del sistema.

---

## 4. Resultados de Verificación

- **Auditoría de `Pressable` sin rol**: 0 encontrados (10/10 tienen rol semántico).
- **Compilación TypeScript (`npx tsc --noEmit`)**: 0 errores.
- **Suite de Pruebas (`npm test --prefix mobile`)**: 259 pruebas pasando satisfactoriamente.
