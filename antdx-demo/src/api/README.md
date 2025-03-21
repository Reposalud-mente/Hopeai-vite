# API de HopeAI

Este directorio contiene los módulos de comunicación con APIs y servicios externos utilizados por la aplicación HopeAI. Incluye clientes para backend, servicios de IA y utilidades para realizar peticiones HTTP.

## Cliente HTTP Base

### `apiClient`

Cliente HTTP base que proporciona funcionalidad para realizar peticiones a las APIs del backend.

```typescript
import { apiClient } from '../api/apiClient';

// Ejemplo de uso
const response = await apiClient.get('/patients/123');
const createdResource = await apiClient.post('/patients', newPatientData);
```

**Funciones principales:**
- `get(url, config?)`: Realiza peticiones GET
- `post(url, data, config?)`: Realiza peticiones POST
- `put(url, data, config?)`: Realiza peticiones PUT
- `delete(url, config?)`: Realiza peticiones DELETE
- `request(config)`: Permite realizar peticiones personalizadas

**Características:**
- Manejo automático de tokens de autenticación
- Interceptores para gestión de errores
- Timeout configurable para peticiones
- Transformación automática de datos

## Autenticación

### `auth`

Funciones para gestionar la autenticación y autorización de usuarios.

```typescript
import { login, logout, getAuthStatus, refreshToken } from '../api/auth';

// Iniciar sesión
const user = await login('username', 'password');

// Verificar estado de autenticación
const isAuthenticated = await getAuthStatus();

// Cerrar sesión
await logout();
```

**Funciones principales:**
- `login(username, password)`: Inicia sesión y obtiene token
- `logout()`: Cierra sesión y elimina tokens
- `getAuthStatus()`: Verifica si el usuario está autenticado
- `refreshToken()`: Actualiza el token de acceso usando el token de refresco
- `getUserProfile()`: Obtiene perfil del usuario autenticado

**Características:**
- Almacenamiento seguro de tokens en localStorage/sessionStorage
- Manejo de sesiones expiradas
- Verificación de permisos

## Gestión de Pacientes

### `patients`

Funciones para interactuar con la API de pacientes del backend.

```typescript
import { 
  getPatients, 
  getPatientById, 
  createPatient, 
  updatePatient 
} from '../api/patients';

// Obtener lista de pacientes
const patientsList = await getPatients();

// Obtener paciente específico
const patient = await getPatientById('123');

// Crear nuevo paciente
const newPatient = await createPatient({ name: 'María López', age: 35 });
```

**Funciones principales:**
- `getPatients(filters?)`: Obtiene lista de pacientes con filtros opcionales
- `getPatientById(id)`: Obtiene un paciente específico por su ID
- `createPatient(data)`: Crea un nuevo paciente
- `updatePatient(id, data)`: Actualiza información de un paciente
- `deletePatient(id)`: Elimina un paciente
- `getPatientHistory(id)`: Obtiene historial clínico del paciente

**Características:**
- Tipado completo con TypeScript
- Soporte para filtros y paginación
- Validación de datos antes del envío

## Análisis Clínico

### `clinicalAnalysis` y `clinicalAnalysisApi`

Módulos para interactuar con los servicios de análisis clínico del backend.

```typescript
import { 
  analyzePatientData, 
  getAnalysisHistory,
  getSuggestedDiagnoses
} from '../api/clinicalAnalysis';

// Analizar datos de un paciente
const analysis = await analyzePatientData(patientId, clinicalData);

// Obtener historial de análisis previos
const history = await getAnalysisHistory(patientId);
```

**Funciones principales:**
- `analyzePatientData(patientId, data)`: Realiza análisis de datos clínicos
- `getAnalysisById(id)`: Obtiene un análisis específico
- `getAnalysisHistory(patientId)`: Obtiene historial de análisis de un paciente
- `getSuggestedDiagnoses(symptoms)`: Obtiene diagnósticos sugeridos por síntomas
- `getRecommendations(diagnosisId)`: Obtiene recomendaciones para un diagnóstico
- `analyzePatientWithBackend(patient)`: Utiliza recursos del backend para análisis
- `testAnalysisEndpoint()`: Verifica disponibilidad y rendimiento del endpoint

**Características:**
- Soporte para procesamiento asíncrono de análisis complejos
- Gestión de resultados parciales y streaming
- Validación de coherencia clínica

## Integración con IA

### `ai`, `aiClient` y `aiPrompts`

Módulos para interactuar con los servicios de IA (DeepSeek) y gestionar los prompts.

```typescript
import { 
  fetchAIAnalysis, 
  chatWithPatientData,
  fetchAIAnalysisWithErrorHandling
} from '../api/ai';

// Obtener análisis de IA
const aiAnalysis = await fetchAIAnalysis(patientData);

// Interacción conversacional sobre datos de paciente
const response = await chatWithPatientData(patientId, question);
```

**Funciones principales:**
- `fetchAIAnalysis(data)`: Obtiene análisis mediante IA
- `chatWithPatientData(patientId, question)`: Realiza preguntas sobre un paciente
- `fetchAIAnalysisWithErrorHandling(data)`: Versión con manejo de errores integrado
- `getAIClient()`: Obtiene instancia configurada del cliente de IA
- `explainDiagnosis(diagnosisId)`: Obtiene explicación detallada de un diagnóstico
- `getPromptForClinicalAnalysis()`: Construye prompt para análisis clínico

**Características:**
- Integración con DeepSeek API (formato compatible con OpenAI)
- Estructuración de respuestas en formato JSON
- Sistema de retry con backoff exponencial
- Optimización de prompts para casos clínicos
- Gestión de contexto de conversación

## Gestión de Prompts

### `aiPrompts`

Módulo para gestionar y optimizar los prompts utilizados en las interacciones con la IA.

```typescript
import { 
  getSystemPrompt,
  getClinicalAnalysisPrompt,
  getDiagnosisExplanationPrompt
} from '../api/aiPrompts';

// Obtener prompt para análisis
const prompt = getClinicalAnalysisPrompt(patientData);
```

**Funciones principales:**
- `getSystemPrompt(context?)`: Obtiene prompt del sistema con contexto opcional
- `getClinicalAnalysisPrompt(data)`: Construye prompt para análisis clínico
- `getDiagnosisExplanationPrompt(diagnosis)`: Crea prompt para explicar diagnóstico
- `getRecommendationPrompt(diagnosis)`: Genera prompt para recomendaciones
- `formatPromptWithPatientData(template, data)`: Formatea template con datos

**Características:**
- Templates optimizados para razonamiento clínico
- Inyección de contexto clínico relevante
- Estructura para obtener respuestas en formato JSON
- Parámetros configurables según complejidad clínica

## Convenciones de Uso

1. **Gestión de errores**:
   ```typescript
   try {
     const data = await getPatientById('123');
     // Procesar los datos...
   } catch (error) {
     if (error.statusCode === 404) {
       // Manejar caso de paciente no encontrado
     } else {
       // Manejar otros errores
     }
   }
   ```

2. **Uso con React**:
   ```typescript
   const PatientView = ({ patientId }) => {
     const [patient, setPatient] = useState(null);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState(null);
     
     useEffect(() => {
       const fetchData = async () => {
         try {
           setLoading(true);
           const data = await getPatientById(patientId);
           setPatient(data);
         } catch (err) {
           setError(err);
         } finally {
           setLoading(false);
         }
       };
       
       fetchData();
     }, [patientId]);
     
     // Renderizado condicional según estado...
   };
   ```

3. **Uso con Hooks**:
   ```typescript
   // En un hook personalizado
   const usePatient = (patientId) => {
     // ... configuración de estado ...
     
     const fetchPatient = useCallback(async () => {
       try {
         setLoading(true);
         const data = await getPatientById(patientId);
         setPatient(data);
         return data;
       } catch (err) {
         setError(err);
         throw err;
       } finally {
         setLoading(false);
       }
     }, [patientId]);
     
     // ... resto del hook ...
   };
   ```

4. **Cancelación de Peticiones**:
   ```typescript
   // Usando AbortController
   const fetchData = async () => {
     const controller = new AbortController();
     const timeoutId = setTimeout(() => controller.abort(), 5000);
     
     try {
       const data = await apiClient.get('/endpoint', { 
         signal: controller.signal 
       });
       clearTimeout(timeoutId);
       return data;
     } catch (err) {
       if (err.name === 'AbortError') {
         console.log('Request was cancelled');
       }
       throw err;
     }
   };
   ```

## Dependencias entre Módulos

- `patients`, `clinicalAnalysis` y `auth` utilizan `apiClient` para peticiones HTTP
- `clinicalAnalysisApi` utiliza `clinicalAnalysis` y añade funcionalidad específica del backend
- `ai` utiliza `aiClient` para comunicación con DeepSeek API y `aiPrompts` para construcción de prompts
- Todos los módulos pueden utilizar los tipos definidos en `src/types` 