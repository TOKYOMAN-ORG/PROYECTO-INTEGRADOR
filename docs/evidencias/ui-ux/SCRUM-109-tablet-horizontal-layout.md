# Evidencia SCRUM-109: Disposición en dos columnas para Tablets y Modo Horizontal

## 1. Contexto y Objetivos
- **Subtarea:** `SCRUM-109` ("Mostrar calendario y lista en dos columnas en tablet u horizontal y habilitar tablets y rotación")
- **Historia Padre:** `SCRUM-86` ("Hacer la interfaz responsiva en teléfonos, tablets y horizontal")
- **Objetivo:** Adaptar la aplicación para que en pantallas expandidas ($\ge 840$ dp, tablets y modo horizontal) aproveche el ancho disponible distribuyendo el calendario a la izquierda y la lista de eventos a la derecha, mientras que en teléfonos y pantallas compactas mantenga una única columna con scroll natural y fluido.

## 2. Cambios de Configuración (`mobile/app.json`)
Se modificó la configuración de la app en `app.json`:
- `"orientation": "default"`: desbloquea la orientación fija en vertical (`portrait`), permitiendo rotación automática a horizontal en dispositivos móviles y tablets.
- `"ios.supportsTablet": true`: habilita la compatibilidad nativa con iPad en pantalla completa sin emulación forzada a escala de iPhone.

```json
{
  "expo": {
    "orientation": "default",
    "ios": {
      "supportsTablet": true,
      "icon": "./assets/expo.icon"
    }
  }
}
```

## 3. Implementación Responsive en Pantalla Principal (`(app)/index.tsx`)
1. **Detección Dinámica de Clase de Tamaño (`useSizeClass`):**
   - Compacto ($< 600$ dp): 1 columna apilada.
   - Mediano ($600 - 839$ dp): 1 columna centrada con ancho máximo de 768 dp.
   - Expandido ($\ge 840$ dp): 2 columnas en fila (`flexDirection: 'row'`, `gap: 24`).
2. **Distribución en 2 Columnas (`expanded`):**
   - **Columna Izquierda (`maxWidth: 440`, `flex: 1`):** Aloja el componente `MonthCalendar` con navegación por mes y selección de días.
   - **Columna Derecha (`flex: 1.2`):** Aloja la cabecera del día seleccionado, estado de carga, errores con reintento, estado vacío (`EmptyState`) o lista de `EventCard`.
3. **Persistencia de Estado ante Rotaciones:**
   - La rotación del dispositivo no remonta el estado del componente; el mes, año y día seleccionados permanecen intactos junto con los eventos ya cacheados en memoria.

## 4. Verificación y Resultados
- Compilación de TypeScript: 0 errores (`npx tsc --noEmit`).
- Pruebas unitarias: 259 pruebas pasando con `npm test --prefix mobile`.
