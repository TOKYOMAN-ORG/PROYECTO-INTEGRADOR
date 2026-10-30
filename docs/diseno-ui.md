# Guía del Sistema de Diseño UI/UX — SecurePlan Mobile

Documento de referencia técnica y arquitectura de diseño para la aplicación móvil SecurePlan (Expo SDK 57, React Native 0.86, React 19).

---

## 1. Principios de Diseño

1. **Consistencia Visual:** Todos los elementos interactivos y de contenido deben regirse por los tokens centralizados en `mobile/src/constants/theme.ts`. Queda terminantemente prohibido el uso de valores hexadecimales o escalas de fuente arbitrarias fuera de este archivo.
2. **Jerarquía Clara:** La interfaz debe guiar visualmente al usuario mediante pesos tipográficos, tamaños relativos y niveles de elevación/superficie claros.
3. **Accesibilidad Universal y Contraste WCAG AA:**
   - La relación de contraste mínima para texto normal contra fondo debe ser de **4.5:1**, y para componentes gráficos e interactivos de **3:1**.
   - Los elementos interactivos deben poseer un área táctil mínima de **44 × 44 dp**.
   - Todo componente debe exponer roles y estados semánticos (`accessibilityRole`, `accessibilityState`, `accessibilityLabel`).
4. **Resiliencia Responsiva:** Soporte nativo para modo claro y oscuro automático, fuentes escaladas (`allowFontScaling`), teléfonos compactos (< 600 dp) y tablets u orientación horizontal (≥ 600 dp).

---

## 2. Decisión Arquitectónica: Componentes Propios vs. Kits de UI

### Comparativa Evaluada

| Enfoque | Ventajas | Desventajas | Decisión |
|---|---|---|---|
| **Kit Completo (Paper, Tamagui, Gluestack, NativeWind)** | Componentes listos para usar de inmediato. | Incompatibilidad con React 19 / React Native 0.86 en SDK 57; añade sobrecarga de dependencias (transgresión de Sprint 4); acoplamiento a librerías externas. | **Descartado** |
| **`@expo/ui` (Widgets Nativos)** | Rendimiento nativo (SwiftUI / Jetpack Compose). | No se integra con el motor Flexbox/Yoga de React Native; requiere contenedor `<Host>`; inconsistente con temas oscuros personalizados. | **Descartado** |
| **Sistema Propio sobre React Native + Expo Modules** | 100% compatible con Expo SDK 57; bundle liviano; tokens integrados; cero dependencias frágiles; control total de accesibilidad. | Requiere construir y probar los componentes genéricos base. | **ADOPTADO** ✅ |

---

## 3. Matriz de Componentes e Implementación

| Componente | Tipo / Origen | Ruta en Código | Responsabilidad |
|---|---|---|---|
| **`Button`** | Propio (React Native) | `mobile/src/components/button.tsx` | Botón interactivo accesible con variantes (`primary`, `outline`, `ghost`, `danger`) y tamaños (`sm`, `md`, `lg`). Área táctil ≥ 44×44 dp. |
| **`TextField`** | Propio (React Native) | `mobile/src/components/text-field.tsx` | Campo de texto con etiquetas flotantes, estado de foco dinámico, mensajes de error accesibles y soporte multilínea. |
| **`ThemedText`** | Propio (React Native) | `mobile/src/components/themed-text.tsx` | Tipografía estructurada con variantes semánticas (`title`, `subtitle`, `body`, `caption`, `link`) y contraste garantizado. |
| **`Icon` / `IconButton`** | Propio sobre `expo-symbols` | `mobile/src/components/icon.tsx` | Reemplazo de emojis por iconografía nativa (SF Symbols en iOS / Material Symbols en Android y Web). |
| **`Screen`** | Propio (Estructura) | `mobile/src/components/screen.tsx` | Contenedor de pantalla con `SafeAreaView`, `KeyboardAvoidingView`, scroll opcional y ancho máximo para tablets. |
| **`Card`** | Propio (Contenedor) | `mobile/src/components/card.tsx` | Tarjeta contenedora con borde sutil, elevación, radio redondeado y fondo de superficie según tema. |
| **`Badge`** | Propio (Indicador) | `mobile/src/components/badge.tsx` | Etiqueta compacta de estado o prioridad (Alta, Media, Baja) con contraste WCAG AA verificado. |
| **`OptionSelector`** | Propio (Chips accesibles) | `mobile/src/components/option-selector.tsx` | Selector de opciones excluyentes o categorías con `accessibilityRole="radio"`. |
| **`Banner`** | Propio (Retroalimentación) | `mobile/src/components/banner.tsx` | Avisos informativos, de advertencia, éxito o peligro integrados en el flujo visual. |
| **`EmptyState`** | Propio (Estado) | `mobile/src/components/empty-state.tsx` | Vista informativa ante listas o agendas vacías con icono y acción de llamada (CTA). |
| **`ErrorState`** | Propio (Estado) | `mobile/src/components/error-state.tsx` | Vista degradada ante fallos con botón de reintento («Intentar de nuevo»). |
| **`LoadingState`** | Propio (Estado) | `mobile/src/components/loading-state.tsx` | Indicador de carga accesible con `ActivityIndicator` y etiqueta semántica. |
| **`ConfirmDialog`** | Propio (Modal) | `mobile/src/components/confirm-dialog.tsx` | Diálogo modal accesible para reemplazo uniforme de `Alert.alert` y confirmación de borrado. |
| **`Toast`** | Propio (Alerta volátil) | `mobile/src/components/toast.tsx` | Notificación emergente temporal en pantalla para reemplazo de avisos por query params. |
| **`DateField` / `TimeField`** | Propio sobre `datetimepicker` | `mobile/src/components/date-field.tsx` | Selector nativo de fecha/hora en Android e iOS (`@react-native-community/datetimepicker`) con alternativa HTML5 en Web. |
| **`MonthCalendar`** | Propio (Modular) | `mobile/src/components/month-calendar.tsx` | Componente modular de cuadrícula mensual extraído de la pantalla principal con navegación accesible. |
| **`EventCard`** | Propio (Modular) | `mobile/src/features/events/event-card.tsx` | Tarjeta de evento de la agenda con fecha, hora, prioridad y acciones directas. |

---

## 4. Reglas Estrictas del Repositorio

1. **Cero Hexadecimales Sueltos:** Ningún archivo dentro de `mobile/src/` (fuera de `constants/theme.ts`) puede incluir valores `#RGB` o `#RRGGBB`. Todo color debe provenir de `useTheme()` o `Colors[scheme]`.
2. **Cero Emojis como Iconos:** Los caracteres decorativos (📅, ⏰, ✕, ✓, ←) deben sustituirse por el componente `<Icon name="..." />`.
3. **Estructura Estándar con `Screen`:** Toda ruta en `mobile/src/app/` debe envolver su contenido en `<Screen>`, asegurando gestión unificada de área segura y teclado.
4. **Dimensiones Táctiles:** Ningún botón, chip o celda de calendario interactiva debe tener un tamaño menor a `44 × 44 dp`.
5. **Pruebas de Contraste Automáticas:** Cualquier nuevo token de color debe integrarse en la suite de pruebas unitarias de contraste WCAG AA (`mobile/src/constants/theme.test.ts`).

---

## 5. Lista de Verificación de Accesibilidad (A11y Checklist — SCRUM-111)

Esta lista audita todos los componentes nuevos construidos en el sprint para garantizar el cumplimiento de WCAG 2.1 AA, compatibilidad con lectores de pantalla (TalkBack / VoiceOver) y precisión táctil:

| Componente | Rol Semántico (`accessibilityRole`) | Estados (`accessibilityState`) | Etiqueta / Pistas (`accessibilityLabel` / `Hint`) | Área Táctil Mínima | Elementos Decorativos Ocultos |
|---|---|---|---|---|---|
| **`Button`** | `button` | `disabled`, `busy` (loading) | `accessibilityLabel` del título o acción | $\ge 44 \times 44$ dp (`minHeight: 48` / `36` + `hitSlop: 6`) | Iconos secundarios sin anuncio redundante |
| **`IconButton`** | `button` | `disabled` | Obligatorio vía prop `accessibilityLabel` | $\ge 44 \times 44$ dp (`minWidth: 44, minHeight: 44` + `hitSlop: 8`) | N/A (el botón expone la etiqueta semántica) |
| **`Icon`** | `image` (cuando tiene label) o ninguno si es decorativo | N/A | Solo cuando `accessibilityLabel` se define | N/A (gráfico) | Oculto con `aria-hidden`, `accessibilityElementsHidden` si no tiene label |
| **`TextField`** | Campo `TextInput` nativo | N/A | Label + obligatorio (`*`) + hint con error | $\ge 48$ dp altura de campo | Botón de revelar contraseña `button` con hitSlop $\ge 44$ |
| **`DateField`** | `button` | `disabled` | Label + fecha formateada legible | $\ge 48$ dp altura de caja | Icono de calendario oculto |
| **`TimeField`** | `button` | `disabled` | Label + hora legible | $\ge 48$ dp altura de caja | Icono de reloj oculto |
| **`OptionSelector`** | `radio` | `selected`, `disabled` | Nombre de opción + estado seleccionado + hint | $\ge 44 \times 44$ dp (`minHeight: 44, minWidth: 44`) | Punto indicador de color oculto |
| **`MonthCalendar` (Día)** | `button` | `selected` | "Día X de Mes, Año[, Hoy, N eventos, Prioridad P]" | $\ge 44 \times 44$ dp (`dayCellContainer minHeight: 44`) | Punto dot decorativo oculto |
| **`Card`** | `button` (si `onPress`) | N/A | `accessibilityLabel` descriptivo agrupado | $\ge 44$ dp de altura | `accessible={true}` unifica elementos internos |
| **`EventCard`** | `button` | N/A | "Evento: Título a las Hora, categoría C, prioridad P. Toca para ver detalles o editar." | Dimensiones de tarjeta completas | Hora e iconos decorativos agrupados |
| **`ConfirmDialog`** | `alert` / `button` | N/A | "Cerrar cuadro de diálogo", botones con labels | Botones $\ge 48$ dp, backdrop touchable $\ge 44$ dp | N/A |
| **`EventDetailModal`** | `modal` / `button` | N/A | "Cerrar detalle", "Cerrar modal de detalle", acciones | Botón cerrar con `IconButton` $\ge 44 \times 44$ dp | Iconos decorativos de metadatos ocultos |
| **`Banner`** | `alert` | N/A | Mensaje del banner + live region `polite` | Botón cerrar $\ge 44 \times 44$ dp | Icono de estado decorativo oculto |
| **`Toast`** | `alert` | N/A | Mensaje con `accessibilityLiveRegion="assertive"` | N/A (alerta visual) | N/A |
| **`LoadingState`** | `progressbar` | `busy: true` | Mensaje de carga accesible | N/A | Spinner accesible |
| **`ErrorState`** | `alert` | N/A | Título y mensaje de error | Botón reintentar $\ge 48$ dp | Icono decorativo de alerta oculto |
| **`EmptyState`** | `summary` | N/A | Título y mensaje informativo | Botón de acción opcional $\ge 48$ dp | Icono decorativo oculto |

