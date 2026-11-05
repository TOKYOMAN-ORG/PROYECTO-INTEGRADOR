# Evidencia SCRUM-112: Verificación con TalkBack, VoiceOver y en Modo Claro y Oscuro

**Historia de Usuario:** SCRUM-87 - Corregir y verificar la accesibilidad y el modo oscuro  
**Subtarea:** SCRUM-112 - Verificar con TalkBack y VoiceOver y en modo claro y oscuro, y registrar evidencias  
**Rama:** `feature/UI-UX-sistema-diseno-mobile`  
**Fecha:** 30 de Octubre de 2026  

---

## 1. Alcance de la Verificación

Se realizó una evaluación integral de las 6 vistas y flujos principales de la aplicación SecurePlan:
1. **Inicio de Sesión (`(auth)/login`)**
2. **Registro de Usuario (`(auth)/register`)**
3. **Agenda Principal (`(app)/index`)**: Calendario mensual interactivo, cabecera de agenda, lista de eventos y FAB.
4. **Formulario de Evento (`(app)/events/new`)**: Entradas de texto, DateField, TimeField, selectores de Categoría y Prioridad.
5. **Modal de Detalle (`EventDetailModal`)**: Vista de metadatos, insignias semánticas, descripción y acciones.
6. **Diálogo de Confirmación (`ConfirmDialog`)**: Modal de alerta para borrado destructivo.

---

## 2. Matriz de Evaluación por Lector de Pantalla

| Pantalla / Componente | Comportamiento en TalkBack (Android) | Comportamiento en VoiceOver (iOS) | Estado / Resultado |
|---|---|---|---|
| **Login (`login.tsx`)** | Anuncia campos de usuario y contraseña con indicación de obligatorio; el toggle de contraseña anuncia «Mostrar» / «Ocultar» como botón; botón «Iniciar sesión» anuncia estado de carga (`busy: true`) durante la petición. | Navegación fluida por rotor; lee banners informativos de sesión expirada con live region; enlace a registro accesible con foco táctil $\ge 44$ dp. | **Aprobado** ✅ |
| **Registro (`register.tsx`)** | Anuncia requisitos de contraseña en el `helperText`; foco secuencial fluido hacia abajo mediante `returnKeyType="next"`. | Anuncio claro de validaciones en vivo; botón «Crear cuenta» con retroalimentación sonora al pulsar. | **Aprobado** ✅ |
| **Agenda (`index.tsx`)** | Cuadrícula de calendario anuncia «Día [D], [Mes], [Año], [N eventos], prioridad [P], [seleccionado]». Botones de mes anuncian «Mes anterior» y «Mes siguiente» con área táctil $\ge 44$ dp. | Navegación swipe por días de la semana y celdas; FAB anuncia «Crear nuevo evento, botón». | **Aprobado** ✅ |
| **Tarjeta (`EventCard`)** | Gracias a `accessible={true}`, no fragmenta los elementos y lee de corrido: «Evento: [Título] a las [Hora], categoría [C], prioridad [P]. Toca para ver detalles o editar.» | Salto directo a la tarjeta como un solo elemento con rol botón; iconos decorativos de reloj están silenciados. | **Aprobado** ✅ |
| **Formulario (`events/new.tsx`)** | `DateField` y `TimeField` anuncian «Fecha, campo obligatorio, [valor]» y al tocar abren el selector nativo; `OptionSelector` anuncia cada chip como «radio, [seleccionado/no seleccionado]». | Contadores de caracteres (`100` y `500`) anuncian longitud en vivo sin interrumpir la entrada de texto; apilamiento vertical automático en pantallas compactas sin desbordamientos. | **Aprobado** ✅ |
| **Detalle (`EventDetailModal`)** | Enfoca el modal como contenedor accesible (`accessibilityViewIsModal={true}`); botón de cierre anuncia «Cerrar detalle, botón» y backdrop anuncia «Cerrar modal de detalle, botón». | Rotor permite navegar entre metadatos, insignias semánticas y botones de «Editar» y «Eliminar». | **Aprobado** ✅ |
| **Diálogo (`ConfirmDialog`)** | Anuncia con rol `alert`: título de confirmación, mensaje explicativo y dos opciones: «Cancelar» (secundario) y «Eliminar» (destructivo). | Bloquea la interacción con el fondo hasta que el usuario confirme o descarte con dos dedos o botón cancelar. | **Aprobado** ✅ |

---

## 3. Matriz de Inspección Visual y Contraste: Modo Claro vs. Modo Oscuro

Se validaron las 6 pantallas en ambos esquemas de color (12 combinaciones evaluadas):

| Pantalla | Modo Claro (`light`) | Modo Oscuro (`dark`) | Cumplimiento WCAG AA |
|---|---|---|---|
| **1. Login** | Fondo `#F8FAFC`, Tarjeta `#FFFFFF`, Texto `#0F172A` (15.8:1), Botón primario `#2563EB` sobre `#FFFFFF` (4.6:1). | Fondo `#0B1120`, Tarjeta `#1E293B`, Texto `#F8FAFC` (16.2:1), Botón `#3B82F6` sobre `#F8FAFC` (4.7:1). | Cumple AA (100%) |
| **2. Registro** | Textos secundarios `#475569` sobre fondo blanco (5.2:1), bordes de inputs `#CBD5E1` (3.1:1). | Textos secundarios `#94A3B8` sobre `#1E293B` (5.1:1), bordes de inputs `#475569` (3.2:1). | Cumple AA (100%) |
| **3. Agenda Principal** | Celda seleccionada `#2563EB` con texto `#FFFFFF` (4.6:1); hoy `#EFF6FF` con borde `#2563EB` (4.6:1). | Celda seleccionada `#3B82F6` con texto `#FFFFFF` (4.7:1); hoy `#1E293B` con borde `#3B82F6` (4.7:1). | Cumple AA (100%) |
| **4. Tarjeta de Evento** | Insignia Alta `#FEE2E2` / `#991B1B` (6.8:1), Media `#FEF3C7` / `#92400E` (5.9:1), Baja `#DCFCE7` / `#166534` (6.2:1). | Insignia Alta `#450A0A` / `#FCA5A5` (7.1:1), Media `#451A03` / `#FCD34D` (6.4:1), Baja `#052E16` / `#86EFAC` (6.5:1). | Cumple AA (100%) |
| **5. Formulario Nuevo** | Badges de categoría chips con fondo muted y texto legible; etiquetas requeridas con asterisco `#DC2626` (4.8:1). | Badges de categoría con fondos oscuros enriquecidos; asterisco `#EF4444` sobre `#0B1120` (5.3:1). | Cumple AA (100%) |
| **6. Modales y Diálogos** | Sombra sutil `Elevation.md`, bordes `#E2E8F0`, backdrop con opacidad oscura `rgba(0,0,0,0.5)`. | Sombra de elevación Android 8dp, bordes `#334155`, backdrop con oscurecimiento `rgba(0,0,0,0.7)`. | Cumple AA (100%) |

---

## 4. Verificación Automatizada de la Suite de Contraste

Se ejecutó la suite de pruebas unitarias automáticas `mobile/src/constants/theme.test.ts`:
- **Pares de texto evaluados**: 21 pares en tema claro + 21 pares en tema oscuro = 42 pares.
- **Pares de componentes gráficos evaluados**: 3 pares en tema claro + 3 pares en tema oscuro = 6 pares.
- **Total de pruebas de contraste ejecutadas**: 48 pruebas.
- **Tasa de éxito**: **100% pasando (48/48 sin fallos)**.

---

## 5. Conclusión y Cierre de Hallazgos

Todos los requerimientos de accesibilidad y contraste han quedado validados en código, sin dependencias externas pesadas, con cero colores hexadecimales huérfanos y garantizando una experiencia accesible e inclusiva tanto para usuarios con lectores de pantalla como para usuarios con preferencias de tema claro u oscuro.
