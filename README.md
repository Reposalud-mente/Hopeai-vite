# Arquitectura del Sistema HopeAI

## Visión General

HopeAI es una aplicación de asistencia clínica para profesionales de salud mental que integra una interfaz moderna con capacidades avanzadas de IA para asistir en diagnósticos, tratamientos y gestión de pacientes. La aplicación está diseñada para:
- Gestionar información de pacientes en un entorno clínico
- Analizar datos clínicos mediante IA para ayudar en diagnósticos basados en DSM-5/CIE-11
- Visualizar el proceso de razonamiento clínico mediante pasos estructurados
- Proporcionar recomendaciones personalizadas basadas en evidencia científica

## Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + Vite)                          │
├─────────────┬─────────────────┬───────────────────┬────────────────────┤
│   Páginas   │   Componentes   │      Hooks        │      Contexto      │
│  --------   │  ------------   │  -------------    │  --------------    │
│ - Dashboard │ - PatientList   │ - usePatient      │ - PatientContext   │
│ - Pacientes │ - PatientForm   │ - useClinicalAnalysis│- AnalysisContext │
│ - Análisis  │ - PatientHistory│ - useLoadingState │- NavigationContext │
│             │ - DiagnosisPanel│ - useErrorHandling│- ErrorContext      │
└──────┬──────┴─────────┬───────┴────────┬──────────┴─────────┬──────────┘
       │                │                │                     │
       │   ┌────────────▼─────────────────────────────────────▼────────┐  
       │   │                      Servicios Frontend                    │
       │   │    -----------------------------------------------         │
       │   │   │ patientService │ aiService │ notificationService      │
       │   └───┬───────────────────────────────────────────────────────┘
       │       │
┌──────▼───────▼───────────────────────────────────────────────────────────┐
│                               API / Backend                                │
├────────────────┬───────────────────┬────────────────────┬────────────────┤
│    Express     │    Controladores  │     Servicios      │    Modelos      │
│    -------     │    ------------   │     --------       │    -------      │
│  - Middleware  │  - PatientController  - PatientService │  - Patient      │
│  - Rutas       │  - AuthController     - AnalysisService│  - Evaluation   │
│  - Validación  │  - AnalysisController - AuthService    │  - Analysis     │
└────────┬───────┴──────┬────────────┴─────────┬──────────┴─────────┬──────┘
         │              │                      │                     │
┌────────▼──────────────▼──────────────────────▼─────────────────────▼─────┐
│                         Capa de Persistencia                              │
│        --------------------------------------------------------          │
│                     PostgreSQL + Sequelize-Typescript                     │
└─────────────────────────────────────────────────────────────────────┬────┘
                                                                       │
┌─────────────────────────────────────────────────────────────────────▼────┐
│                          Servicios Externos                               │
├─────────────────────────────┬─────────────────────────────────────────────┤
│         DeepSeek API        │              LangChain/LangGraph            │
│        ------------         │              ------------------             │
│  - Análisis Clínico         │  - Flujos de Razonamiento Clínico          │
│  - Generación de Respuestas │  - Cadenas de Pensamiento Estructurado     │
│  - Formatos JSON            │  - Criterios Diagnósticos DSM-5/CIE-11     │
└─────────────────────────────┴─────────────────────────────────────────────┘
```

## Stack Tecnológico

### Frontend
- **Framework**: React con Vite para construcción optimizada
- **UI**: Ant Design 5.24.4 y Ant Design X 1.0.6
- **Gestión de Estado**: Context API de React
- **Navegación**: React Router v6
- **Lenguaje**: TypeScript
- **Estilos**: CSS Modules y estilos integrados de Ant Design

### Backend
- **Framework**: Node.js con Express
- **API**: RESTful con endpoints para gestión de pacientes y análisis clínico
- **Seguridad**: JWT para autenticación

### Base de Datos
- **Motor**: PostgreSQL
- **ORM**: Sequelize-typescript para modelos tipados
- **Modelos**: Patient, Evaluation, Analysis, Recommendation

### Servicios de IA
- **API**: Integración con DeepSeek (compatible con OpenAI)
- **LLM Frameworks**: LangChain y LangGraph para construcción de flujos de razonamiento
- **Formato de Respuestas**: JSON estructurado para facilitar el procesamiento

## Componentes Principales

### 1. Frontend (React + Vite)

Interfaz de usuario basada en React y Ant Design que proporciona experiencia moderna y receptiva.

#### Módulos Clave:
- **Componentes**: Elementos de UI reutilizables
  - `AppLayout`: Layout principal con navegación lateral
  - `PatientList`: Lista de pacientes con búsqueda y filtros
  - `PatientForm`: Formulario para crear/editar pacientes
  - `PatientHistory`: Visualización de historial clínico
  - `DiagnosisPanel`: Visualización de diagnósticos sugeridos
  - `ThoughtChain`: Visualización de pasos de razonamiento clínico

- **Hooks Personalizados**: Encapsulan lógica reutilizable
  - `usePatient`: Obtención y manipulación de datos de pacientes
  - `useClinicalAnalysis`: Análisis clínico mediante IA
  - `useLoadingState`: Gestión de estados de carga con feedback visual
  - `useErrorHandling`: Manejo estructurado de errores
  - `useNavigation`: Navegación entre secciones de la aplicación

- **Contexto**: Gestión de estado global
  - `PatientContext`: Gestión de datos de pacientes con sistema de caché
  - `AnalysisContext`: Estado del análisis clínico actual
  - `NavigationContext`: Estado de navegación y breadcrumbs
  - `ErrorContext`: Gestión centralizada de errores

### 2. Servicios Frontend

Capa de abstracción entre la UI y las API, responsable de la lógica de negocio del cliente.

- **patientService**: Gestiona operaciones CRUD de pacientes con caché
- **aiService**: Interfaz con DeepSeek API para análisis clínico
- **notificationService**: Sistema centralizado de notificaciones
- **formValidation**: Reglas de validación consistentes

### 3. Backend (Express)

Servidor API RESTful que proporciona endpoints para operaciones CRUD y lógica de negocio.

#### Componentes:
- **Controladores**: Gestionan requests y responses
  - `PatientController`: Operaciones CRUD de pacientes
  - `AuthController`: Autenticación y autorización
  - `AnalysisController`: Gestión de análisis clínicos

- **Servicios**: Contienen lógica de negocio
  - `PatientService`: Operaciones de pacientes
  - `AnalysisService`: Procesamiento de análisis clínicos
  - `AuthService`: Lógica de autenticación

- **Modelos**: Representación de entidades de base de datos
  - `Patient`: Datos de pacientes
  - `Evaluation`: Evaluaciones clínicas
  - `Analysis`: Resultados de análisis

### 4. Capa de Persistencia

PostgreSQL con Sequelize-Typescript para ORM tipado que proporciona modelado de datos seguro.

- **Entidades Principales**:
  - Pacientes
  - Evaluaciones
  - Análisis
  - Recomendaciones

### 5. Integración con IA (DeepSeek + LangChain/LangGraph)

Sistema avanzado de procesamiento clínico basado en IA.

- **DeepSeek API**: Motor principal de IA
  - Procesamiento de lenguaje natural clínico
  - Generación de respuestas estructuradas (JSON)
  - Análisis de síntomas y criterios diagnósticos

- **LangChain/LangGraph**: Framework para flujos de razonamiento
  - Cadenas de pensamiento clínico
  - Razonamiento basado en criterios DSM-5/CIE-11
  - Flujos de trabajo para análisis incrementales

## Flujos de Datos Principales

### 1. Flujo de Análisis Clínico
```
┌──────────┐   ┌───────────┐   ┌──────────────┐   ┌───────────┐   ┌──────────┐
│ Interfaz │   │ aiService │   │  DeepSeek    │   │ LangChain/│   │ Interfaz │
│ Usuario  │──▶│           │──▶│     API      │──▶│ LangGraph │──▶│ Usuario  │
└──────────┘   └───────────┘   └──────────────┘   └───────────┘   └──────────┘
```

1. Usuario selecciona un paciente
2. Sistema carga historial clínico
3. Usuario solicita análisis clínico
4. Frontend envía datos clínicos al backend
5. Backend procesa mediante DeepSeek/LangGraph
6. Backend devuelve análisis estructurado
7. Frontend visualiza el proceso de razonamiento
8. Usuario puede interactuar con el análisis mediante preguntas

### 2. Flujo de Gestión de Pacientes
```
┌───────────┐    ┌───────────────┐    ┌──────────────┐    ┌──────────────┐
│  Interfaz │    │ patientService│    │   API REST   │    │  Base de     │
│  Usuario  │───▶│    (caché)    │───▶│   Express    │───▶│    Datos     │
└───────────┘    └───────────────┘    └──────────────┘    └──────────────┘
```

1. Usuario accede a la lista de pacientes
2. Sistema carga pacientes desde API con paginación
3. Usuario puede filtrar/buscar pacientes
4. Usuario puede crear/editar pacientes
5. Sistema valida y persiste cambios
6. Sistema actualiza la interfaz y muestra confirmaciones

## Sistemas Transversales

### Sistema de Notificaciones

Utilizamos `notificationService` para gestionar todas las notificaciones de usuario:
- Notificaciones toast para operaciones breves
- Notificaciones completas para información detallada
- Notificaciones de carga con estados actualizables

### Sistema de Validación

Utilizamos `formValidation` para proporcionar reglas consistentes de validación:
- Validaciones estándar para campos comunes
- Validaciones específicas del dominio clínico
- Mensajes de error en español

### Sistema de Carga

Utilizamos `useLoadingState` para gestionar estados de carga:
- Feedback visual consistente durante operaciones asíncronas
- Manejo automático de errores
- Mensajes personalizables por tipo de operación

### Optimización de Rendimiento

- Lazy loading para componentes pesados mediante `React.lazy`
- Memoización con `React.memo` para componentes puros
- `useMemo` y `useCallback` para cálculos costosos
- Sistema de caché para datos de pacientes con invalidación controlada

## Consideraciones Técnicas

### Seguridad
- Autenticación JWT con rotación de tokens
- Sanitización de entradas y validación
- Cifrado de datos sensibles en reposo
- Control de acceso basado en roles

### Rendimiento
- Estrategias de caché en múltiples niveles
- Carga diferida de componentes pesados
- Optimización de consultas a base de datos
- Streaming para operaciones de larga duración

### Escalabilidad
- Arquitectura modular para facilitar expansión
- Servicios independientes con responsabilidades claras
- Capa de abstracción para servicios externos
- Diseño que permite despliegue en contenedores

## Pipeline de Desarrollo

1. **Desarrollo Local**: Entorno Vite con hot reload
2. **Testing**: Jest y React Testing Library
3. **CI/CD**: GitHub Actions para pruebas y build automáticos
4. **Despliegue**: Proceso de build optimizado para producción

## Evolución Futura

1. **Módulo de Reportes**: Generación de informes clínicos
2. **Análisis Comparativo**: Comparación de evaluaciones a lo largo del tiempo
3. **Integración con DSM-5-TR**: Actualización a los últimos criterios diagnósticos
4. **Módulo de Supervisión**: Herramientas para supervisión clínica 
