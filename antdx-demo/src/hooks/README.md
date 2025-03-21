# Hooks Personalizados para HopeAI

Este directorio contiene hooks personalizados utilizados en la aplicación HopeAI para gestionar estados, interacciones con APIs y otros comportamientos reutilizables.

## Hooks Principales

### `usePatientCache`

Hook especializado para el manejo eficiente del caché de datos de pacientes.

```typescript
const { 
  getCachedPatients,
  getCachedPatient,
  cachePatients,
  cachePatient,
  invalidateCache,
  invalidatePatientCache,
  isPatientsListCached,
  isPatientCached,
  isCacheExpired
} = usePatientCache(cacheDuration);
```

**Parámetros:**
- `cacheDuration`: Duración del caché en milisegundos (por defecto: 5 minutos)

**Retorna:**
- `getCachedPatients`: Obtiene la lista completa de pacientes del caché
- `getCachedPatient`: Obtiene un paciente específico del caché por su ID
- `cachePatients`: Almacena una lista de pacientes en el caché
- `cachePatient`: Almacena un paciente específico en el caché
- `invalidateCache`: Invalida todo el caché de pacientes
- `invalidatePatientCache`: Invalida el caché para un paciente específico
- `isPatientsListCached`: Verifica si la lista de pacientes está en caché
- `isPatientCached`: Verifica si un paciente específico está en caché
- `isCacheExpired`: Verifica si un tipo de caché ha expirado

### `usePatient`

Hook para gestionar la obtención, creación y actualización de datos de pacientes.

```typescript
const { 
  patient, 
  isLoading, 
  error, 
  fetchPatient, 
  updatePatient, 
  createPatient 
} = usePatient(patientId);
```

**Parámetros:**
- `patientId`: ID del paciente para obtener (opcional)

**Retorna:**
- `patient`: Datos del paciente actual
- `isLoading`: Estado de carga de los datos
- `error`: Error si hubo algún problema al obtener/actualizar datos
- `fetchPatient`: Función para cargar datos de un paciente específico
- `updatePatient`: Función para actualizar datos de un paciente
- `createPatient`: Función para crear un nuevo paciente

### `useClinicalAnalysis`

Hook unificado para el análisis clínico que combina las funcionalidades de análisis de datos de pacientes.

```typescript
const {
  thoughtSteps,
  suggestedDiagnoses,
  chatHistory,
  loading,
  error,
  analysisState,
  runAnalysis,
  askQuestion
} = useClinicalAnalysis(patientInfo, useEnhancedAnalysis);
```

**Parámetros:**
- `patientInfo`: Información del paciente en formato texto para analizar
- `useEnhancedAnalysis`: Flag para determinar si usar análisis mejorado (por defecto: true)

**Retorna:**
- `thoughtSteps`: Pasos del proceso de razonamiento clínico
- `suggestedDiagnoses`: Diagnósticos sugeridos basados en el análisis
- `chatHistory`: Historial de conversación con el asistente
- `loading`: Estado de carga del análisis
- `error`: Error del análisis, si existe
- `analysisState`: Estado actual del análisis clínico
- `runAnalysis`: Función para ejecutar el análisis
- `askQuestion`: Función para realizar preguntas al asistente clínico

### `useAnalysisStream`

Hook especializado para manejar la transmisión de datos de análisis clínicos en tiempo real.

```typescript
const {
  streamState,
  isStreaming,
  error,
  startStream,
  stopStream,
  resetStream
} = useAnalysisStream(patientData);
```

**Parámetros:**
- `patientData`: Datos del paciente para analizar

**Retorna:**
- `streamState`: Estado actual de la transmisión
- `isStreaming`: Indica si la transmisión está activa
- `error`: Error en la transmisión, si existe
- `startStream`: Función para iniciar la transmisión
- `stopStream`: Función para detener la transmisión
- `resetStream`: Función para reiniciar el estado de la transmisión

### `useClinicalAI`

Hook para interactuar con el módulo de IA clínica.

```typescript
const {
  analysisResult,
  isAnalyzing,
  error,
  runAnalysis,
  getRecommendations,
  explainReasoning
} = useClinicalAI(patientInfo);
```

**Parámetros:**
- `patientInfo`: Información clínica del paciente

**Retorna:**
- `analysisResult`: Resultado del análisis clínico
- `isAnalyzing`: Estado del proceso de análisis
- `error`: Error durante el análisis, si existe
- `runAnalysis`: Función para iniciar el análisis
- `getRecommendations`: Función para obtener recomendaciones basadas en el análisis
- `explainReasoning`: Función para obtener explicación del razonamiento clínico

### `useClinicalData`

Hook para gestionar datos clínicos completos, incluyendo historial, evaluaciones y resultados de pruebas.

```typescript
const {
  clinicalData,
  isLoading,
  error,
  fetchHistory,
  fetchEvaluations,
  fetchTestResults,
  addClinicalNote
} = useClinicalData(patientId);
```

**Parámetros:**
- `patientId`: ID del paciente para obtener sus datos clínicos

**Retorna:**
- `clinicalData`: Datos clínicos completos del paciente
- `isLoading`: Estado de carga de los datos
- `error`: Error al cargar datos, si existe
- `fetchHistory`: Función para cargar historial clínico
- `fetchEvaluations`: Función para cargar evaluaciones anteriores
- `fetchTestResults`: Función para cargar resultados de pruebas
- `addClinicalNote`: Función para añadir una nueva nota clínica

### `useDiagnosisSuggestions`

Hook para obtener y gestionar sugerencias de diagnóstico basadas en síntomas y datos clínicos.

```typescript
const {
  suggestions,
  isLoading,
  fetchSuggestions,
  filterByConfidence,
  sortByCriteria
} = useDiagnosisSuggestions(symptoms);
```

**Parámetros:**
- `symptoms`: Lista de síntomas para analizar

**Retorna:**
- `suggestions`: Lista de diagnósticos sugeridos
- `isLoading`: Estado de carga de las sugerencias
- `fetchSuggestions`: Función para obtener sugerencias basadas en síntomas
- `filterByConfidence`: Función para filtrar sugerencias por nivel de confianza
- `sortByCriteria`: Función para ordenar sugerencias según criterios específicos

### `useLoadingState`

Hook para gestionar estados de carga con notificaciones y manejo de errores integrado.

```typescript
const {
  isLoading,
  isSuccess,
  isError,
  isIdle,
  error,
  state,
  startLoading,
  setSuccess,
  setFailed,
  runWithLoading,
  reset
} = useLoadingState(options);
```

**Parámetros:**
- `options`: Configuración para el estado de carga
  - `operation`: Tipo de operación ('create', 'update', 'delete', 'fetch', etc.)
  - `entity`: Tipo de entidad ('patient', 'evaluation', 'analysis', etc.)
  - `showMessage`: Muestra mensajes automáticos (por defecto: true)
  - `messageSuccess`: Mensaje personalizado para éxito
  - `messageError`: Mensaje personalizado para error
  - `messageLoading`: Mensaje personalizado para carga
  - `showNotification`: Muestra notificaciones completas (por defecto: false)

**Retorna:**
- `isLoading`: Indica si está en estado de carga
- `isSuccess`: Indica si la operación fue exitosa
- `isError`: Indica si ocurrió un error
- `isIdle`: Indica si está en estado inicial
- `error`: Objeto de error si ocurrió alguno
- `state`: Estado actual ('idle', 'loading', 'success', 'error')
- `startLoading`: Función para iniciar estado de carga
- `setSuccess`: Función para establecer estado de éxito
- `setFailed`: Función para establecer estado de error
- `runWithLoading`: Función para ejecutar operación asíncrona con gestión automática de estados
- `reset`: Función para reiniciar el estado

### `useError`

Hook para gestión centralizada de errores que proporciona funcionalidades para manejar y registrar errores.

```typescript
const {
  errors,
  lastError,
  captureError,
  clearError,
  clearAllErrors,
  markErrorAsHandled,
  withErrorHandling
} = useError();
```

**Retorna:**
- `errors`: Lista de errores registrados
- `lastError`: Último error registrado
- `captureError`: Función para capturar un nuevo error
- `clearError`: Función para eliminar un error específico
- `clearAllErrors`: Función para eliminar todos los errores
- `markErrorAsHandled`: Función para marcar un error como gestionado
- `withErrorHandling`: Función para envolver operaciones asíncronas con manejo de errores

### `useErrorHandling`

Hook especializado para capturar y gestionar errores con opciones avanzadas de configuración.

```typescript
const {
  handleError,
  handleApiError,
  withTryCatch,
  formatErrorMessage,
  showErrorNotification
} = useErrorHandling(options);
```

**Parámetros:**
- `options`: Configuración para el manejo de errores
  - `showNotifications`: Muestra notificaciones automáticas (por defecto: true)
  - `captureToContext`: Captura errores en el contexto global (por defecto: true)
  - `logToConsole`: Registra errores en la consola (por defecto: true)

**Retorna:**
- `handleError`: Función para manejar errores genéricos
- `handleApiError`: Función especializada para errores de API
- `withTryCatch`: Función para envolver código en bloques try/catch automáticos
- `formatErrorMessage`: Función para formatear mensajes de error
- `showErrorNotification`: Función para mostrar notificaciones de error

### `useErrorLogger`

Hook para el registro y monitoreo de errores con opciones de exportación y análisis.

```typescript
const {
  logError,
  getErrorLogs,
  clearLogs,
  exportLogs,
  getErrorStats
} = useErrorLogger();
```

**Retorna:**
- `logError`: Función para registrar un error
- `getErrorLogs`: Función para obtener todos los registros de errores
- `clearLogs`: Función para limpiar los registros
- `exportLogs`: Función para exportar registros en formato CSV/JSON
- `getErrorStats`: Función para obtener estadísticas de errores

### `useNavigation`

Hook para gestionar la navegación y el estado de la barra lateral.

```typescript
const {
  isMenuCollapsed,
  toggleMenu,
  setCollapsed,
  currentPath,
  navigate,
  breadcrumbs
} = useNavigation();
```

**Retorna:**
- `isMenuCollapsed`: Estado de colapso del menú lateral
- `toggleMenu`: Función para alternar el estado del menú
- `setCollapsed`: Función para establecer el estado del menú directamente
- `currentPath`: Ruta actual de navegación
- `navigate`: Función para navegar a otra ruta
- `breadcrumbs`: Migas de pan para la ruta actual

## Convenciones de Uso

1. **Importación**:
   ```typescript
   import { usePatientCache } from '../hooks/usePatientCache';
   ```

2. **Uso Recomendado**:
   - Consumir hooks al principio de los componentes funcionales
   - Destructurar solo los elementos necesarios
   - Optimizar renders con useCallback/useMemo cuando sea apropiado

3. **Manejo de Errores**:
   Para hooks que pueden generar errores, utilizar los hooks de manejo de errores:
   ```typescript
   const { withErrorHandling } = useError();
   
   const result = await withErrorHandling(
     async () => { /* operación asíncrona */ },
     'Mensaje de error personalizado',
     'ComponentName'
   );
   ```

4. **Estados de Carga**:
   Para operaciones asíncronas, utilizar `useLoadingState`:
   ```typescript
   const { runWithLoading } = useLoadingState({
     operation: 'fetch',
     entity: 'patient'
   });
   
   const handleLoadData = async () => {
     await runWithLoading(async () => {
       // Operación asíncrona
       const data = await fetchData();
       setData(data);
     });
   };
   ```

5. **Caché**:
   Para datos que requieren almacenamiento en caché, utilizar el hook `usePatientCache`:
   ```typescript
   const { getCachedPatient, cachePatient } = usePatientCache();
   
   // Intentar obtener del caché primero
   let patient = getCachedPatient(patientId);
   
   if (!patient) {
     // Si no está en caché, obtener de la API
     patient = await fetchPatient(patientId);
     cachePatient(patient);
   }
   ```

## Dependencias entre Hooks

- `useClinicalAnalysis` integra funcionalidades de `useAnalysisStream` y `useClinicalAI`
- `usePatient` utiliza internamente `usePatientCache` y `useError`
- `useErrorHandling` utiliza `useError` y `useErrorLogger` para manejo completo de errores
- `useLoadingState` utiliza `notificationService` para mostrar estados de carga
