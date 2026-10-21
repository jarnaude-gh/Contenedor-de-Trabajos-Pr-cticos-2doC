# Identificación y Vidriera de Trabajos Finales

Permite a cada estudiante designar un único proyecto como su **Trabajo Final** oficial mediante una casilla en el formulario, y añade a la vidriera institucional una vista dedicada con pestañas para explorar exclusivamente los Trabajos Finales con un distintivo visual dorado.

## User Review & Critical Decisions

> [!IMPORTANT]
> Decisiones confirmadas a partir de las preguntas de clarificación:
> - **Selección de Trabajo Final**: Los alumnos marcan/desmarcan una casilla de verificación (*"Designar como mi Trabajo Final"*) al crear o editar cualquier trabajo. El backend desmarca automáticamente cualquier trabajo anterior del mismo alumno para garantizar la regla de **máximo un Trabajo Final por estudiante**.
> - **Visualización en la Vidriera**: Pestañas segmentadas en el encabezado del catálogo principal para alternar fluidamente entre **"Todos los Trabajos"** y **"Trabajos Finales"**.
> - **Distintivo Visual**: Insignia dorada destacada (`Trabajo Final` con estrella/trofeo) y borde sutil dorado/ámbar en la tarjeta para resaltar de inmediato los proyectos de graduación.

---

## 1. Overview & Core Concept

- **Qué hace**: Cada alumno puede subir todos los proyectos y prácticas que desee durante la cursada, pero puede designar puntualmente uno de ellos como su proyecto de graduación / Trabajo Final. La plataforma valida en tiempo real que cada alumno tenga como máximo un Trabajo Final asignado.
- **Audiencia**: Alumnos de Habilidades Digitales + IA 2026, docentes evaluadores y visitantes de la comunidad Don Bosco.
- **Valor agregado**: Facilita a los docentes la evaluación directa de los trabajos de egreso y permite a los visitantes filtrar rápidamente para apreciar las aplicaciones más maduras y completas desarrolladas por cada estudiante.

---

## 2. User Experience & Visual Design

### Flujos Clave de Usuario

1. **Designación de Trabajo Final (Alumno)**:
   - Al abrir el modal *"Publicar Trabajo"* o *"Modificar Trabajo"*, el alumno encuentra una casilla destacada:
     `[✓] Designar como mi Trabajo Final oficial`.
   - Se muestra un texto explicativo: *"Solo puedes tener un Trabajo Final oficial. Si marcas este trabajo, reemplazará automáticamente a cualquier otro que hayas designado antes"*.
   - Al guardar, el trabajo queda marcado inmediatamente y los demás trabajos del alumno se actualizan en Firestore y en memoria.

2. **Exploración en la Vidriera Principal**:
   - Arriba del catálogo general, se presenta un control segmentado con diseño limpio:
     `[ Todos los Trabajos (N) ]  [ 🌟 Trabajos Finales (M) ]`.
   - Al activar la pestaña de *Trabajos Finales*, el catálogo y los filtros se ajustan automáticamente para listar solo los proyectos insignia.

3. **Insignia y Estilo de Tarjeta**:
   - Las tarjetas de Trabajo Final cuentan con un borde ámbar cálido (`border-amber-300 ring-1 ring-amber-300/30`), gradiente sutil superior y un distintivo dorado superior:
     `🌟 Trabajo Final`.
   - En el modal de detalle (`AppDetailModal`) y en *"Mis Trabajos"* también se resalta con orgullo la condición de Trabajo Final.

---

## 3. Key Product Decisions & Trade-Offs

- **Unicidad Estricta en Backend y Base de Datos**:
  - *Decisión*: Cuando un alumno guarda un trabajo con `es_trabajo_final: true`, el backend busca cualquier otro trabajo previo de ese autor que tuviera esa bandera activa, la pasa a `false`, y sincroniza ambas entidades en Google Cloud Firestore.
  - *Razón*: Evita inconsistencias de datos o carreras de guardado que pudieran dejar más de un trabajo final por alumno.

- **Pestaña Segmentada vs. Filtro Desplegable**:
  - *Decisión*: Colocar un control segmentado destacado en el encabezado de la vidriera con contador dinámico en lugar de esconderlo dentro del selector de filtros.
  - *Razón*: Proporciona máxima visibilidad y acceso en 1 solo clic a los evaluadores y visitantes.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│                   Cliente Web (SPA)                    │
│                                                        │
│  [Vidriera: Pestañas "Todos" / "Trabajos Finales"]     │
│         │                                              │
│  [AppCard: Borde Ámbar + Insignia 🌟 Trabajo Final]    │
│         │                                              │
│  [AppFormModal: Casilla "Designar como Trabajo Final"] │
└──────────────────────────┬─────────────────────────────┘
                           │ API REST (/api/apps)
┌──────────────────────────▼─────────────────────────────┐
│                 Backend Node.js / Express               │
│                                                        │
│  • Enforce Uniqueness: Autor ID -> 1 Trabajo Final     │
│  • Actualización atómica en memoria y disco local      │
│  • Sincronización con reintento (withRetry)            │
└──────────────────────────┬─────────────────────────────┘
                           │ Long-Polling HTTPS
┌──────────────────────────▼─────────────────────────────┐
│             Google Cloud Firestore                     │
│  Colección: /applications/{appId}                      │
│  Campo: es_trabajo_final (boolean)                     │
└────────────────────────────────────────────────────────┘
```

### Componentes y Archivos a Actualizar

1. **`src/types.ts`**:
   - Añadir campo opcional `es_trabajo_final?: boolean` a la interfaz `Application`.
   - Añadir `soloTrabajosFinales?: boolean` al estado de filtros `FilterState` o control de vista.

2. **`server/db.ts` & `server/routes.ts`**:
   - Actualizar modelo `Application` con `es_trabajo_final?: boolean`.
   - En `createApplication` y `updateApplication`: si `es_trabajo_final === true`, desmarcar cualquier otra aplicación del mismo `autor_id` y persistir los cambios en Firestore.

3. **`firebase-blueprint.json`**:
   - Añadir `es_trabajo_final: { "type": "boolean" }` al esquema `Application`.

4. **`src/components/AppFormModal.tsx`**:
   - Agregar el checkbox interactivo con tooltip explicativo y estado reactivo.

5. **`src/components/AppCard.tsx` & `src/components/AppDetailModal.tsx`**:
   - Renderizar el marco dorado/ámbar e insignia de Trabajo Final cuando `app.es_trabajo_final` sea verdadero.

6. **`src/components/MyAppsView.tsx`**:
   - Mostrar el distintivo en la lista de trabajos del alumno y permitir marcar/cambiar el Trabajo Final con facilidad.

7. **`src/App.tsx`**:
   - Integrar el selector segmentado de pestañas (*"Todos los Trabajos"* vs. *"Trabajos Finales"*) en la vidriera principal con conteo dinámico.
