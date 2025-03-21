# Componentes de HopeAI

Este directorio contiene los componentes React utilizados en la aplicación HopeAI para crear la interfaz de usuario. Están organizados por categorías funcionales para facilitar su localización y uso.

## Estructura de la Aplicación

### Componentes de Layout

#### `AppLayout`

Componente principal de layout que proporciona la estructura base de la aplicación.

```tsx
<AppLayout>
  <RouteContent />
</AppLayout>
```

**Props:**
- `children`: Elementos hijos a renderizar dentro del layout
- `showSidebar`: Controla la visibilidad de la barra lateral (por defecto: true)

**Características:**
- Implementa el componente Layout de Ant Design
- Gestiona la visualización del menú lateral y encabezado
- Proporciona ajustes responsive para diferentes tamaños de pantalla

#### `SidebarNavigation`

Componente de navegación lateral que muestra las opciones principales del menú.

```tsx
<SidebarNavigation collapsed={isMenuCollapsed} />
```

**Props:**
- `collapsed`: Estado de colapso de la barra lateral
- `onItemClick`: Callback para cuando se hace clic en un ítem del menú

**Características:**
- Construido con el componente Menu de Ant Design
- Enlaces a las secciones principales de la aplicación
- Soporte para colapsar/expandir el menú
- Resalta la sección actual

## Gestión de Pacientes

#### `PatientList`

Componente para visualizar y buscar pacientes en una tabla interactiva.

```tsx
<PatientList patients={patientData} isLoading={loading} />
```

**Props:**
- `patients`: Array de objetos Patient con la información de los pacientes
- `isLoading`: Estado de carga (por defecto: false)

**Características:**
- Tabla ordenable y con búsqueda
- Opción para ver detalles de paciente
- Indicadores visuales para estado de paciente
- Optimizado con useMemo para prevenir renderizados innecesarios

#### `PatientForm`

Formulario para crear o editar información de pacientes.

```tsx
<PatientForm 
  mode="edit" 
  patient={patientData} 
  onSave={handleSave} 
  onCancel={handleCancel} 
/>
```

**Props:**
- `mode`: 'create' o 'edit' para determinar modo del formulario
- `patient`: Datos del paciente cuando se está en modo edición
- `onSave`: Callback para guardar cambios
- `onCancel`: Callback para cancelar operación

**Características:**
- Validación de campos integrada
- Soporte para múltiples secciones de datos
- Manejo automático de estados de carga
- Feedback visual durante la validación

#### `PatientHistory`

Componente para visualizar el historial clínico completo de un paciente.

```tsx
<PatientHistory patientId={id} />
```

**Props:**
- `patientId`: ID del paciente cuyo historial se desea ver
- `initialTab`: Pestaña inicial a mostrar (opcional)

**Características:**
- Interfaz con pestañas para diferentes tipos de información
- Línea de tiempo de evaluaciones anteriores
- Visualización de resultados de tests 
- Notas clínicas con marcado de texto

#### `PatientHeader`

Encabezado para páginas de paciente que muestra información básica y acciones.

```tsx
<PatientHeader patient={patientData} />
```

**Props:**
- `patient`: Objeto con datos básicos del paciente
- `onEditClick`: Función a ejecutar cuando se solicita editar (opcional)

**Características:**
- Muestra nombre, edad y datos básicos del paciente
- Proporciona acceso a acciones contextuales
- Diseño responsive con ajustes para móvil

#### `PatientReviewPage`

Página completa para revisión de información de paciente.

```tsx
<PatientReviewPage patientId={id} />
```

**Props:**
- `patientId`: ID del paciente a revisar

**Características:**
- Combina múltiples componentes de paciente
- Maneja estados de carga y errores
- Gestiona la navegación entre secciones

#### `PatientAnalysisContainer`

Contenedor para análisis clínico de paciente.

```tsx
<PatientAnalysisContainer patientId={id} />
```

**Props:**
- `patientId`: ID del paciente a analizar
- `useEnhancedAnalysis`: Indica si usar análisis mejorado (por defecto: true)

**Características:**
- Integra componentes de análisis clínico
- Gestiona estado del proceso de análisis
- Visualiza resultados y recomendaciones

## Análisis Clínico

#### `DiagnosisPanel`

Panel que muestra los diagnósticos sugeridos por la IA.

```tsx
<DiagnosisPanel diagnoses={diagnosisData} />
```

**Props:**
- `diagnoses`: Array de diagnósticos sugeridos
- `onSelect`: Callback cuando se selecciona un diagnóstico (opcional)

**Características:**
- Visualización de diagnósticos con nivel de confianza
- Descripción detallada de cada condición
- Formateo de criterios diagnósticos
- Códigos DSM-5/CIE-11 asociados

#### `RecommendationList`

Lista de recomendaciones terapéuticas basadas en el análisis.

```tsx
<RecommendationList recommendations={recommendationData} />
```

**Props:**
- `recommendations`: Array de recomendaciones generadas
- `onApply`: Callback para aplicar una recomendación (opcional)

**Características:**
- Categorización por tipo de recomendación
- Información basada en evidencia
- Opciones para aplicar o descartar recomendaciones
- Explicación del razonamiento clínico

#### `ClinicalEditor`

Editor para notas clínicas con funciones específicas para psicología.

```tsx
<ClinicalEditor 
  initialValue={noteText}
  onChange={handleNoteChange}
/>
```

**Props:**
- `initialValue`: Texto inicial del editor
- `onChange`: Callback para cambios en el contenido
- `readOnly`: Modo de solo lectura (por defecto: false)

**Características:**
- Herramientas de formato para notas clínicas
- Soporte para plantillas predefinidas
- Corrector ortográfico específico para terminología clínica
- Autoguardado y historial de versiones

#### `ClinicalAssistantDrawer`

Panel lateral para interactuar con el asistente clínico de IA.

```tsx
<ClinicalAssistantDrawer 
  visible={isDrawerVisible}
  onClose={closeDrawer}
  patientId={patientId}
/>
```

**Props:**
- `visible`: Controla visibilidad del panel
- `onClose`: Callback para cerrar el panel
- `patientId`: ID del paciente en contexto

**Características:**
- Interfaz conversacional con IA
- Historial de preguntas y respuestas
- Sugerencias contextuales
- Explicación del razonamiento clínico

## Componentes de UI y Carga

#### `SuspenseWrapper`

Wrapper para React.Suspense con fallback integrado.

```tsx
<SuspenseWrapper>
  <LazyLoadedComponent />
</SuspenseWrapper>
```

**Props:**
- `children`: Componentes a envolver con Suspense
- `fallback`: Componente a mostrar durante la carga (opcional)

**Características:**
- Implementa React.Suspense con un fallback predeterminado
- Muestra indicador de carga consistente
- Facilita la carga diferida de componentes

#### `LoadingFeedback`

Componente para mostrar estados de carga, éxito o error con retroalimentación.

```tsx
<LoadingFeedback
  loading={isLoading}
  error={error}
  loadingText="Cargando datos del paciente..."
>
  <ComponentContent />
</LoadingFeedback>
```

**Props:**
- `loading`: Estado de carga
- `error`: Error para mostrar (si existe)
- `loadingText`: Texto personalizado durante la carga
- `errorComponent`: Componente personalizado para error
- `children`: Contenido a mostrar cuando no está cargando ni hay error

**Características:**
- Maneja automáticamente los diferentes estados (carga/error/contenido)
- Proporciona retroalimentación visual consistente
- Soporta personalización de mensajes y componentes

#### `withLoadingFeedback`

HOC que envuelve componentes con funcionalidad de LoadingFeedback.

```tsx
const EnhancedComponent = withLoadingFeedback(MyComponent);
```

**Parámetros:**
- `Component`: Componente a envolver
- `options`: Opciones de configuración (opcional)

**Características:**
- Añade estados de carga y error a cualquier componente
- Mantiene las props originales del componente envuelto
- Proporciona una API consistente para estados de carga

## Manejo de Errores

#### `ErrorBoundary`

Componente boundary para capturar errores en componentes hijos.

```tsx
<ErrorBoundary componentName="PatientDetails">
  <PatientDetails />
</ErrorBoundary>
```

**Props:**
- `componentName`: Nombre del componente para registro de errores
- `fallback`: Componente personalizado para mostrar en caso de error
- `children`: Componentes a monitorear para errores

**Características:**
- Captura errores en el ciclo de vida de componentes React
- Evita que los errores colapsen toda la aplicación
- Registra errores para diagnóstico
- Proporciona opciones para recuperarse del error

#### `ErrorDisplay`

Componente para mostrar errores con diferentes niveles de detalle.

```tsx
<ErrorDisplay 
  error={errorObject} 
  level="user" 
/>
```

**Props:**
- `error`: Objeto de error a mostrar
- `level`: Nivel de detalle ('user', 'developer', 'detailed')
- `onRetry`: Callback para reintentar la operación fallida

**Características:**
- Formatea errores para diferentes audiencias
- Proporciona acciones para resolver problemas comunes
- Muestra detalles técnicos según nivel seleccionado
- Soporte para diferentes tipos de errores

#### `ErrorManager`

Componente para gestionar errores a nivel de aplicación.

```tsx
<ErrorManager>
  <App />
</ErrorManager>
```

**Props:**
- `children`: Componentes de la aplicación
- `onError`: Callback para procesar errores capturados

**Características:**
- Centraliza la gestión de errores
- Integra con servicios de reporte de errores
- Proporciona contexto global para errores
- Permite estrategias de recuperación

#### `AIErrorFallback`

Componente especializado para manejar errores en interacciones con IA.

```tsx
<AIErrorFallback 
  error={aiError}
  onRetry={retryAnalysis}
  context={analysisContext}
/>
```

**Props:**
- `error`: Error específico de la IA
- `onRetry`: Función para reintentar la operación
- `context`: Contexto donde ocurrió el error
- `fallbackSuggestions`: Sugerencias alternativas si la IA falla

**Características:**
- Manejo especializado para errores de APIs de IA
- Estrategias específicas para diferentes tipos de fallos
- Sugerencias alternativas cuando la IA no está disponible
- Opciones para continuar con funcionalidad limitada

## Convenciones de Uso

1. **Composición de Componentes**:
   ```tsx
   // Preferir composición sobre props complejas
   <PatientContainer>
     <PatientHeader patient={patient} />
     <PatientContent>
       <PatientHistory patientId={patient.id} />
     </PatientContent>
   </PatientContainer>
   ```

2. **Manejo de Estados de Carga**:
   ```tsx
   // Usar LoadingFeedback para gestionar estados
   <LoadingFeedback
     loading={isLoading}
     error={error}
   >
     <ComponentContent />
   </LoadingFeedback>
   
   // Alternativa con HOC
   const ComponentWithLoading = withLoadingFeedback(MyComponent);
   <ComponentWithLoading isLoading={isLoading} error={error} {...otherProps} />
   ```

3. **Patrones de Error**:
   ```tsx
   // Envolver componentes que puedan fallar con ErrorBoundary
   <ErrorBoundary componentName="PatientView">
     <PatientView patientId={id} />
   </ErrorBoundary>
   ```

4. **Optimizaciones de Rendimiento**:
   ```tsx
   // Componentes de lista deben usar React.memo
   export default memo(PatientList);
   
   // Usar keys estables en listas
   {patients.map(patient => (
     <PatientItem key={patient.id} patient={patient} />
   ))}
   ```

5. **Carga Diferida**:
   ```tsx
   // Usar SuspenseWrapper para componentes pesados
   const LazyComponent = lazy(() => import('./HeavyComponent'));
   
   <SuspenseWrapper>
     <LazyComponent />
   </SuspenseWrapper>
   ```

## Dependencias entre Componentes

- `PatientReviewPage` utiliza `PatientHeader`, `PatientHistory` y `PatientAnalysisContainer`
- `PatientAnalysisContainer` integra `DiagnosisPanel` y `RecommendationList`
- `AppLayout` contiene `SidebarNavigation`
- Componentes de error como `ErrorBoundary` y `ErrorManager` pueden envolver cualquier otro componente
- `LoadingFeedback` y `withLoadingFeedback` pueden utilizarse con cualquier componente que necesite manejo de estados de carga 