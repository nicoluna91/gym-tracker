# Gym Tracker — Documentación del proyecto para LLMs

## Visión general

Gym Tracker es una **PWA (Progressive Web App) offline-first** para registrar entrenamientos de gimnasio.
Está construida con **Angular 21** (standalone components) y persiste toda la información en **IndexedDB** en el dispositivo del usuario — no existe backend ni API remota.

El idioma de la UI y los datos del dominio (nombres de ejercicios, grupos musculares, días de la semana) están en **español**.

---

## Stack tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Angular (standalone, signals) | 21.x |
| Estado | @ngrx/signals (`signalStore`) | 21.x |
| UI components | PrimeNG + @primeuix/themes (Aura) | 21.x |
| Gráficos | Chart.js (vía `primeng/chart`) | 4.x |
| Estilos | Tailwind CSS 4 + CSS custom properties | 4.x |
| Persistencia local | idb (wrapper de IndexedDB) | 8.x |
| PWA | @angular/service-worker + ngsw-config.json | 21.x |
| Testing | Vitest + jsdom | 4.x |
| Build | @angular/build (Vite-based) | 21.x |
| TypeScript | strict mode | 5.9 |
| Package manager | npm | 11.x |

---

## Estructura de directorios

```
src/app/
├── app.ts                     # Componente raíz (solo <router-outlet>)
├── app.html                   # Template del componente raíz
├── app.config.ts              # Configuración de la aplicación (providers)
├── app.routes.ts              # Definición de rutas (lazy loading)
│
├── models/                    # Interfaces del dominio
│   ├── exercise.model.ts      # Exercise, MuscleGroup
│   ├── routine.model.ts       # RoutineDay, WeeklyRoutine, Weekday
│   └── workout.model.ts       # WorkoutSet
│
├── state/                     # Signal stores (@ngrx/signals)
│   ├── exercise.store.ts      # Catálogo de ejercicios (estático)
│   ├── routine.store.ts       # Rutina semanal (CRUD persistido)
│   ├── workout.store.ts       # Series del día seleccionado
│   └── metrics.store.ts       # Métricas globales (PRs, volumen)
│
├── core/
│   ├── app-initializer.ts     # APP_INITIALIZER — carga stores al arrancar
│   ├── db/
│   │   └── app-db.ts          # Configuración IndexedDB, export/import JSON
│   ├── persistence/
│   │   ├── routine.repository.ts   # CRUD IndexedDB para rutina
│   │   └── workout.repository.ts   # CRUD IndexedDB para workout sets
│   ├── shell/
│   │   └── shell.component.ts      # Layout: main + bottom navigation bar
│   └── utils/
│       ├── id.util.ts         # createId(prefix) → prefix_UUID
│       ├── date.util.ts       # Funciones de fecha ISO/local
│       └── weekday.util.ts    # weekdayFromDate(Date) → Weekday
│
├── data/exercises/
│   ├── exercises.json         # Catálogo de 32 ejercicios (datos estáticos)
│   └── exercise.data-source.ts # Exporta EXERCISES: Exercise[]
│
├── shared/
│   └── weekdays.ts            # WEEKDAYS: array ordenado lunes→domingo
│
└── features/                  # Páginas (standalone components)
    ├── home/                  # Dashboard, ajustes, export/import BD
    ├── week/                  # Vista semanal con estado de cada día
    ├── routine/               # Configuración de rutina semanal
    │   ├── routine.page.*     # Lista de días configurados
    │   └── routine-day.page.* # Editor de un día (músculos + ejercicios)
    ├── workout/               # Registro de entrenamiento
    │   ├── workout.page.*     # Selector de día para entrenar
    │   └── workout-day.page.* # Registro de series (peso/reps por ejercicio)
    ├── metrics/               # PRs y gráfico de volumen por músculo
    └── calendar/              # Calendario con historial de sesiones
```

---

## Modelos del dominio

### `MuscleGroup` (union type)
```
'pecho' | 'espalda' | 'piernas' | 'hombros' | 'biceps' | 'triceps'
```

### `Exercise`
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `string` | Identificador único (ej: `bench_press`) |
| `nombre` | `string` | Nombre en español (ej: "Press banca") |
| `musculo` | `MuscleGroup` | Grupo muscular principal |
| `imagen` | `string` | Ruta relativa a la imagen del ejercicio |

### `Weekday` (union type)
```
'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo'
```
> Nota: `miercoles` y `sabado` están escritos **sin tilde** intencionalmente en todo el código.

### `RoutineDay`
| Campo | Tipo | Descripción |
|---|---|---|
| `day` | `Weekday` | Día de la semana |
| `muscle` | `MuscleGroup` | Grupo muscular principal (primer músculo seleccionado) |
| `muscles?` | `MuscleGroup[]` | Todos los grupos musculares del día (opcional) |
| `exerciseIds` | `string[]` | IDs de ejercicios asignados, en orden |

### `WeeklyRoutine`
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `string` | `routine_<UUID>` |
| `days` | `RoutineDay[]` | Días configurados (0-7 elementos) |
| `createdAt` | `number` | Timestamp de creación (`Date.now()`) |
| `updatedAt` | `number` | Timestamp de última actualización |

### `WorkoutSet`
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `string` | `set_<UUID>` |
| `date` | `string` | Fecha ISO `YYYY-MM-DD` (ej: `2026-03-27`) |
| `exerciseId` | `string` | ID del ejercicio realizado |
| `peso` | `number` | Peso levantado (kg) |
| `repeticiones` | `number` | Número de repeticiones |
| `createdAt` | `number` | Timestamp de creación |

---

## Base de datos (IndexedDB)

- **Nombre**: `gym-tracker-db`
- **Versión**: 1
- **Librería**: `idb` (typed wrapper sobre IndexedDB)

### Object stores

| Store | Key | Índices | Contenido |
|---|---|---|---|
| `routine` | String manual (`weekly-routine`) | — | Un único documento `WeeklyRoutine` |
| `sets` | `keyPath: 'id'` | `by-date` (campo `date`), `by-exerciseId` (campo `exerciseId`) | Todos los `WorkoutSet` registrados |

### Export / Import

`app-db.ts` expone `exportDb()` e `importDb()` que generan/consumen un JSON con formato:
```typescript
type GymTrackerDbDumpV1 = {
  schemaVersion: 1;
  exportedAt: string;      // ISO datetime
  data: {
    routine: WeeklyRoutine | null;
    sets: WorkoutSet[];
  };
};
```

---

## Gestión de estado (@ngrx/signals)

Todos los stores usan `signalStore` con `providedIn: 'root'` (singleton global).

### `ExerciseStore`
- **Estado**: `exercises: Exercise[]` (inicializado desde `exercises.json`)
- **Computed**: `muscles` — lista de `MuscleGroup` únicos presentes en el catálogo
- **Métodos**: `getById(id)`, `getByMuscle(muscle)`, `setExercises(exercises)`
- No persiste — los ejercicios son datos estáticos embebidos en la app

### `RoutineStore`
- **Estado**: `routine: WeeklyRoutine | null`, `loading: boolean`
- **Computed**: `days`, `hasRoutine`, `dayMap` (Map<Weekday, RoutineDay>)
- **Métodos**: `init()`, `saveWeeklyRoutine(days)`, `upsertDay(day)`, `removeDay(weekday)`, `clear()`, `buildDay(day, muscles, exerciseIds)`
- **Persistencia**: `RoutineRepository` → IndexedDB store `routine`

### `WorkoutStore`
- **Estado**: `selectedDate: string` (ISO YYYY-MM-DD, default = hoy), `sets: WorkoutSet[]`, `loading: boolean`
- **Computed**: `totalVolume` — suma de `peso × repeticiones` de las series del día
- **Métodos**: `init()`, `loadByDate(date)`, `addSet(exerciseId, peso, repeticiones, date?)`, `clearAll()`
- **Dependencias**: `WorkoutRepository`, `MetricsStore` (recalcula métricas tras añadir serie)
- **Persistencia**: `WorkoutRepository` → IndexedDB store `sets`

### `MetricsStore`
- **Estado**: `sets: WorkoutSet[]` (todas las series históricas), `loading: boolean`
- **Computed**:
  - `prMaxWeightByExercise` — Map<exerciseId, maxPeso>
  - `prMaxSessionVolumeByExercise` — Map<exerciseId, maxVolumenDeSesión>
  - `volumeByDate` — Map<date, volumenTotal>
- **Métodos**: `init()` — carga todos los sets desde IndexedDB
- **Persistencia**: solo lectura vía `WorkoutRepository.getAllSets()`

### Inicialización

`provideAppInitializer()` registra un `APP_INITIALIZER` que ejecuta `Promise.all([routineStore.init(), workoutStore.init(), metricsStore.init()])` antes de que la app se renderice.

---

## Rutas

Todas las rutas son hijas del `ShellComponent` (layout con navegación inferior).

| Ruta | Componente | Descripción |
|---|---|---|
| `/home` | `HomePage` | Dashboard con enlaces rápidos, export/import de BD, reset de datos |
| `/semana` | `WeekPage` | Vista semanal: cada día muestra músculos y nº ejercicios de la rutina |
| `/rutina` | `RoutinePage` | Lista de días de la rutina semanal configurados |
| `/rutina/dia/:day` | `RoutineDayPage` | Editor de un día: selección de músculos y ejercicios |
| `/entrenamiento` | `WorkoutPage` | Selector de día de la semana para iniciar entrenamiento |
| `/entrenamiento/:day` | `WorkoutDayPage` | Registro de series del día: peso y repeticiones por ejercicio |
| `/metricas` | `MetricsPage` | PRs por peso, gráfico de volumen histórico |
| `/calendario` | `CalendarPage` | Calendario interactivo, detalle por fecha, borrado de series |

El parámetro `:day` es un `Weekday` (ej: `lunes`, `martes`).

---

## Repositorios (capa de persistencia)

### `RoutineRepository`
- `getRoutine(): Promise<WeeklyRoutine | null>`
- `saveRoutine(routine): Promise<void>`
- `clearRoutine(): Promise<void>`

### `WorkoutRepository`
- `addSet(set): Promise<void>`
- `deleteSet(id): Promise<void>`
- `getSetsByDate(date): Promise<WorkoutSet[]>`
- `getSetsByExercise(exerciseId): Promise<WorkoutSet[]>`
- `getAllSets(): Promise<WorkoutSet[]>`
- `clearAllSets(): Promise<void>`

Ambos son servicios `@Injectable({ providedIn: 'root' })` que usan la función `getDb()` para obtener la conexión a IndexedDB.

---

## Utilidades

| Archivo | Funciones | Descripción |
|---|---|---|
| `id.util.ts` | `createId(prefix)` | Genera IDs con formato `prefix_<UUID>` |
| `date.util.ts` | `todayISO()`, `dateToUtcYmd()`, `dateMetaToUtcYmd()`, `dateToLocalYmd()`, `dateMetaToLocalYmd()` | Conversiones de fecha. Las fechas en BD usan formato UTC ISO `YYYY-MM-DD` |
| `weekday.util.ts` | `weekdayFromDate(date)` | Convierte `Date` a `Weekday` usando `getDay()` |

---

## UI y estilos

- **Tema oscuro por defecto** con soporte automático para tema claro vía `prefers-color-scheme: light`
- CSS custom properties en `:root` definen los colores de la app (`--app-bg`, `--app-surface`, `--app-fg`, etc.)
- PrimeNG usa el tema **Aura** de `@primeuix/themes`
- Tailwind CSS 4 para utilidades de layout y spacing
- El shell tiene una **barra de navegación fija inferior** con 5 tabs: Home, Rutina, Entreno, Calendario, Métricas

---

## PWA

- Service worker habilitado solo en producción (`!isDevMode()`)
- `ngsw-config.json` configura precarga del app shell y caché lazy de assets
- `manifest.webmanifest` configura la app como standalone con iconos en múltiples resoluciones
- Estrategia de registro: `registerWhenStable:30000`

---

## Catálogo de ejercicios

El catálogo contiene **32 ejercicios** organizados por grupo muscular, definidos estáticamente en `exercises.json`:

- **Pecho** (6): Press banca, Press inclinado barra/mancuernas, Press declinado, Aperturas mancuernas/polea
- **Espalda** (6): Jalón al pecho, Dominadas, Remo barra/polea/T-Bar, Face pull
- **Piernas** (7): Sentadilla/frontal, Prensa, Extensión cuádriceps, Curl femoral, Peso muerto rumano, Gemelos
- **Hombros** (5): Press militar, Press hombro mancuernas, Elevaciones laterales/frontales, Pájaros
- **Bíceps** (4): Curl barra, Curl barra Z, Curl martillo, Curl concentración
- **Tríceps** (4): Extensión polea, Rompecráneos, Extensión por encima, Fondos en banco

---

## Convenciones del código

- **Standalone components**: no se usan NgModules. Todos los componentes son `standalone: true`
- **Lazy loading**: todas las páginas se cargan de forma lazy en las rutas
- **Signal stores**: estado reactivo con `@ngrx/signals` — sin Actions, Reducers ni Effects tradicionales de NgRx
- **Repositorios**: patrón repository como capa de abstracción sobre IndexedDB
- **Nombrado de archivos**:
  - Páginas: `*.page.ts` / `*.page.html`
  - Modelos: `*.model.ts`
  - Stores: `*.store.ts`
  - Repositorios: `*.repository.ts`
  - Utilidades: `*.util.ts`
- **IDs**: prefijo descriptivo + UUID (ej: `routine_abc123`, `set_def456`)
- **Fechas en BD**: siempre formato UTC ISO `YYYY-MM-DD`
- **Idioma**: UI y datos en español; nombres de variables y código en inglés/español mixto (dominio en español, código estructural en inglés)

---

## Flujo de datos principal

```
Usuario interactúa con la UI (Feature Page)
  ↓
Feature Page llama a un método del Store
  ↓
Store actualiza estado local (patchState) + llama al Repository
  ↓
Repository persiste en IndexedDB (vía idb)
  ↓
Signals reactivos actualizan la UI automáticamente
```

### Flujo de entrenamiento (ejemplo)

1. Usuario navega a `/entrenamiento/:day`
2. `WorkoutDayPage` lee la rutina del día desde `RoutineStore.dayMap`
3. Por cada ejercicio, muestra series ya registradas (desde `WorkoutStore.sets`)
4. Usuario añade serie → `WorkoutStore.addSet(exerciseId, peso, reps)`
5. El store crea el `WorkoutSet`, lo persiste vía `WorkoutRepository.addSet()`
6. Tras persistir, llama a `MetricsStore.init()` para recalcular PRs
7. La UI se actualiza reactivamente con la nueva serie y métricas

---

## Scripts disponibles

| Script | Comando | Descripción |
|---|---|---|
| `start` | `ng serve` | Servidor de desarrollo |
| `build` | `ng build` | Build de producción |
| `test` | `ng test` | Ejecutar tests con Vitest |
| `watch` | `ng build --watch --configuration development` | Build en modo watch |
