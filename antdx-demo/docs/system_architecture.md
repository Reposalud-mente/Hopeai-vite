# Arquitectura del Sistema HopeAI

## Visión General

HopeAI es una aplicación de asistencia clínica para profesionales de salud mental que integra una interfaz moderna con capacidades avanzadas de IA para asistir en diagnósticos, tratamientos y gestión de pacientes. La arquitectura sigue un patrón de diseño modular con separación clara de responsabilidades.

## Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + Vite)                          │
├─────────────┬─────────────────┬───────────────────┬────────────────────┤
│   Páginas   │   Componentes   │      Hooks        │      Contexto      │
│  --------   │  ------------   │  -------------    │  --------------    │
│ - Dashboard │ - PatientHeader │ - usePatient      │ - PatientContext   │
│ - Pacientes │ - DiagnosisPanel│ - useClinicalData │ - ErrorContext     │
│ - Análisis  │ - ClinicalEditor│ - useAnalysisStream│- AuthContext      │
└──────┬──────┴─────────┬───────┴────────┬──────────┴─────────┬──────────┘
       │                │                │                     │
       │   ┌────────────▼─────────────────────────────────────▼────────┐  
       │   │                      Servicios Frontend                    │
       │   │    -----------------------------------------------         │
       │   │   │ patientService │ aiService │ authService │ etc...     │
       │   └───┬───────────────────────────────────────────────────────┘
       │       │
┌──────▼───────▼───────────────────────────────────────────────────────────┐
│                               API / Backend                                │
├────────────────┬───────────────────┬────────────────────┬────────────────┤
│    Express     │    Controladores  │     Servicios      │    Modelos      │
│    -------     │    ------------   │     --------       │    -------      │
│  - Middleware  │  - PatientController  - PatientService │  - Patient      │
│  - Rutas       │  - AuthController     - AuthService    │  - User         │
│  - Validación  │  - TestController     - TestService    │  - TestResult   │
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
│         DeepSeek API        │              Otros Servicios                │
│        ------------         │              --------------                 │
│  - Análisis Clínico         │  - Servicios de Autenticación              │
│  - Generación de Respuestas │  - Almacenamiento de Archivos              │
│  - Razonamiento Clínico     │  - Servicios de Notificación               │
└─────────────────────────────┴─────────────────────────────────────────────┘
```

## Componentes Principales

### 1. Frontend (React + Vite)

Interfaz de usuario basada en React y Ant Design que proporciona experiencia moderna y receptiva.

#### Módulos Clave:
- **Componentes**: Elementos de UI reutilizables
  - `PatientHeader`: Visualiza información básica del paciente
  - `DiagnosisPanel`: Muestra diagnósticos con justificación
  - `ClinicalEditor`: Editor avanzado para notas clínicas
  - `RecommendationList`: Presenta recomendaciones de tratamiento

- **Hooks Personalizados**: Encapsulan lógica reutilizable
  - `usePatient`: Gestión del paciente actual
  - `useClinicalData`: Datos clínicos compartidos
  - `useAnalysisStream`: Streaming de análisis en tiempo real
  - `useError`: Sistema centralizado de manejo de errores

- **Contexto**: Gestión de estado global
  - `PatientContext`: Estado global de pacientes
  - `ErrorContext`: Gestión centralizada de errores
  - `AuthContext`: Estado de autenticación

### 2. Servicios Frontend

Capa de abstracción entre la UI y las API, responsable de la lógica de negocio del cliente.

- **patientService**: Gestiona operaciones CRUD de pacientes con caché
- **aiService**: Interfaz con DeepSeek API para análisis clínico
- **authService**: Manejo de autenticación y sesiones
- **analyticsService**: Recopilación de métricas y análisis de uso

### 3. Backend (Express)

Servidor API RESTful que proporciona endpoints para operaciones CRUD y lógica de negocio.

#### Componentes:
- **Controladores**: Gestionan requests y responses
  - `PatientController`: Operaciones CRUD de pacientes
  - `AuthController`: Autenticación y autorización
  - `TestController`: Gestión de pruebas psicológicas

- **Servicios**: Contienen lógica de negocio
  - `PatientService`: Operaciones de pacientes
  - `AuthService`: Lógica de autenticación
  - `TestService`: Procesamiento de pruebas

- **Modelos**: Representación de entidades de base de datos
  - `Patient`: Datos de pacientes
  - `User`: Usuarios del sistema
  - `TestResult`: Resultados de pruebas psicológicas

### 4. Capa de Persistencia

PostgreSQL con Sequelize-Typescript para ORM tipado que proporciona modelado de datos seguro.

- **Entidades Principales**:
  - Pacientes
  - Usuarios/Terapeutas
  - Resultados de Pruebas
  - Notas Clínicas
  - Diagnósticos
  - Tratamientos

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

### 1. Gestión de Pacientes
```
┌───────────┐    ┌───────────────┐    ┌──────────────┐    ┌──────────────┐
│  Interfaz │    │ patientService│    │   API REST   │    │  Base de     │
│  Usuario  │───▶│    (caché)    │───▶│   Express    │───▶│    Datos     │
└───────────┘    └───────────────┘    └──────────────┘    └──────────────┘
```

### 2. Análisis Clínico
```
┌──────────┐   ┌───────────┐   ┌──────────────┐   ┌───────────┐   ┌──────────┐
│ Interfaz │   │ aiService │   │  DeepSeek    │   │ LangChain/│   │ Interfaz │
│ Usuario  │──▶│  (caché)  │──▶│     API      │──▶│ LangGraph │──▶│ Usuario  │
└──────────┘   └───────────┘   └──────────────┘   └───────────┘   └──────────┘
```

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