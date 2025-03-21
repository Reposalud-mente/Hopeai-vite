# Servicios de HopeAI

Este directorio contiene los servicios de negocio de la aplicación HopeAI. Los servicios encapsulan la lógica de negocio principal y actúan como intermediarios entre los componentes de UI y las APIs del sistema.

## Servicio de Pacientes

### `patientService`

Servicio para la gestión completa de pacientes, incluido su historial clínico, evaluaciones y seguimiento.

```typescript
import { patientService } from '../services/patientService';

// Ejemplo de uso
const patients = await patientService.getAllPatients();
const patientDetails = await patientService.getPatientDetails('123');
await patientService.updatePatientRecord('123', { diagnóstico: 'Actualizado' });
```

**Funciones principales:**
- `getAllPatients(filters?)`: Obtiene lista de pacientes con opciones de filtrado
- `getPatientDetails(id)`: Obtiene información detallada de un paciente específico
- `createPatient(data)`: Registra un nuevo paciente en el sistema
- `updatePatientRecord(id, data)`: Actualiza la ficha clínica del paciente
- `getPatientHistory(id)`: Recupera historial completo del paciente
- `archivePatient(id)`: Archiva un paciente (no lo elimina)
- `addClinicalNote(patientId, note)`: Añade nota clínica al expediente
- `searchPatientsByKeyword(keyword)`: Busca pacientes por palabra clave

**Características:**
- Validación completa de datos clínicos
- Manejo de historial de cambios en registros
- Gestión de documentos anexos y resultados de pruebas
- Integración con análisis clínico e IA

## Servicio de IA

### `aiService`

Servicio que gestiona las interacciones con los modelos de IA para análisis clínico, diagnóstico asistido y recomendaciones de tratamiento.

```typescript
import { aiService } from '../services/aiService';

// Ejemplo de uso
const analysis = await aiService.analyzeClinicalData(patientData);
const diagnosisExplanation = await aiService.explainDiagnosis(diagnosisCode);
const treatmentSuggestions = await aiService.getSuggestedTreatments(diagnosisCode);
```

**Funciones principales:**
- `analyzeClinicalData(data)`: Analiza datos clínicos mediante IA
- `explainDiagnosis(code)`: Genera explicación detallada de un diagnóstico
- `getSuggestedTreatments(diagnosis)`: Proporciona opciones de tratamiento basadas en evidencia
- `generateClinicalSummary(patientId)`: Genera resumen clínico del caso
- `evaluateSymptomSeverity(symptoms)`: Evalúa gravedad de síntomas
- `predictTreatmentOutcomes(patientId, treatmentPlan)`: Predice posibles resultados del tratamiento
- `analyzeTreatmentProgress(patientId, timeline)`: Analiza progreso del tratamiento
- `generateClinicalQuestions(patientData)`: Genera preguntas clínicas relevantes

**Características:**
- Integración con DeepSeek API mediante aiClient
- Procesamiento de lenguaje natural para datos clínicos
- Análisis basado en criterios DSM-5/CIE-11
- Generación de cadenas de razonamiento clínico
- Manejo avanzado de errores con respuestas de fallback
- Optimización de prompts según contexto clínico

## Servicio de Autenticación

### `authService`

Servicio para gestionar la autenticación, autorización y perfiles de usuario en la aplicación.

```typescript
import { authService } from '../services/authService';

// Ejemplo de uso
await authService.login('usuario@clinica.com', 'contraseña');
const isLoggedIn = authService.isAuthenticated();
const userProfile = authService.getCurrentUser();
```

**Funciones principales:**
- `login(email, password)`: Autentica al usuario en el sistema
- `logout()`: Cierra la sesión del usuario
- `isAuthenticated()`: Verifica si el usuario tiene sesión activa
- `getCurrentUser()`: Obtiene información del usuario actual
- `getToken()`: Obtiene token para peticiones autenticadas
- `updateUserProfile(data)`: Actualiza información del perfil
- `resetPassword(email)`: Inicia flujo de reinicio de contraseña
- `verifySession()`: Verifica validez de la sesión actual

**Características:**
- Almacenamiento seguro de sesión
- Manejo de tokens JWT
- Renovación automática de sesiones
- Control de permisos por rol
- Gestión de perfiles de usuario

## Servicio de Analítica

### `analyticsService`

Servicio para recopilar, analizar y visualizar datos estadísticos sobre pacientes, tratamientos y resultados clínicos.

```typescript
import { analyticsService } from '../services/analyticsService';

// Ejemplo de uso
const patientMetrics = await analyticsService.getPatientMetrics();
const treatmentEffectiveness = await analyticsService.analyzeEffectiveness('F41.1');
const clinicKPIs = await analyticsService.getClinicKPIs(startDate, endDate);
```

**Funciones principales:**
- `getPatientMetrics(filters?)`: Obtiene métricas demográficas de pacientes
- `getClinicKPIs(dateRange)`: Calcula indicadores clave de rendimiento clínico
- `analyzeEffectiveness(diagnosisCode)`: Analiza efectividad de tratamientos
- `getDiagnosisDistribution()`: Obtiene distribución de diagnósticos
- `getSessionMetrics(clinicianId?)`: Obtiene métricas de sesiones terapéuticas
- `getTreatmentOutcomes(treatmentType)`: Analiza resultados de tipos de tratamiento
- `generateReportData(reportType, params)`: Genera datos para informes específicos
- `trackPatientProgress(patientId, metrics)`: Registra progreso de un paciente

**Características:**
- Generación dinámica de gráficos y visualizaciones
- Exportación de datos en múltiples formatos (CSV, Excel, PDF)
- Análisis comparativo de resultados
- Seguimiento de métricas clínicas estandarizadas
- Paneles personalizables según rol y especialidad

## Arquitectura de Servicios

Los servicios están diseñados siguiendo un enfoque de capas para separar claramente las responsabilidades:

1. **Capa de Presentación**
   - Componentes React utilizan servicios mediante hooks personalizados
   - Los componentes no interactúan directamente con APIs o módulos de bajo nivel

2. **Capa de Servicios**
   - Los servicios encapsulan la lógica de negocio compleja
   - Orquestan la comunicación entre componentes y APIs
   - Manejan validaciones, transformaciones y reglas de negocio

3. **Capa de API/Datos**
   - Módulos API gestionan la comunicación con el backend
   - Clientes específicos (HTTP, IA) implementan protocolos de comunicación

## Patrones de Uso

### Integración con React

```typescript
// En un componente React
const PatientDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadPatients = async () => {
      try {
        setLoading(true);
        const data = await patientService.getAllPatients();
        setPatients(data);
      } catch (error) {
        // Manejo de error
      } finally {
        setLoading(false);
      }
    };
    
    loadPatients();
  }, []);
  
  // Renderizado...
};
```

### Uso en Hooks Personalizados

```typescript
// Hook personalizado para gestionar pacientes
export const usePatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchPatients = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const data = await patientService.getAllPatients(filters);
      setPatients(data);
      return data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const createNewPatient = useCallback(async (patientData) => {
    try {
      setLoading(true);
      const newPatient = await patientService.createPatient(patientData);
      setPatients(prev => [...prev, newPatient]);
      return newPatient;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  return {
    patients,
    loading,
    error,
    fetchPatients,
    createNewPatient,
    // Otras funciones...
  };
};
```

### Combinación de Servicios

```typescript
// Ejemplo de uso combinado de servicios
const AnalysisDashboard = () => {
  const { patientId } = useParams();
  const [analysisData, setAnalysisData] = useState(null);
  
  const performAnalysis = async () => {
    try {
      // Primero obtener detalles del paciente
      const patientDetails = await patientService.getPatientDetails(patientId);
      
      // Luego realizar análisis con IA
      const analysis = await aiService.analyzeClinicalData(patientDetails);
      
      // Registrar actividad analítica
      await analyticsService.trackAnalysisActivity(patientId, analysis.id);
      
      setAnalysisData(analysis);
    } catch (error) {
      // Manejo de error
    }
  };
  
  // Resto del componente...
};
```

## Relación con Módulos de API

Los servicios utilizan los módulos de API como capa de abstracción para comunicación externa:

- `patientService` utiliza `patients.ts` para operaciones CRUD de pacientes
- `aiService` utiliza `ai.ts`, `aiClient.ts` y `aiPrompts.ts` para interacciones con IA
- `authService` utiliza `auth.ts` para gestión de autenticación
- `analyticsService` utiliza `apiClient.ts` para peticiones personalizadas

Esta separación permite:
1. Reutilizar la lógica de comunicación HTTP
2. Centralizar el manejo de errores y validaciones
3. Facilitar pruebas unitarias mediante mocking
4. Cambiar implementaciones sin afectar la lógica de negocio 