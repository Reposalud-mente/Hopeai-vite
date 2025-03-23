# Arquitectura y Patrones de HopeAI

Este documento describe la arquitectura y los patrones de implementación principales utilizados en HopeAI después de la fase de optimización.

## Estructura General

HopeAI sigue una arquitectura cliente-servidor con las siguientes características principales:

- **Frontend**: Aplicación React + TypeScript + Vite
- **Backend**: Servidor Express + Sequelize + PostgreSQL
- **API**: RESTful con contratos bien definidos
- **Generación de Tipos**: Automática desde modelos Sequelize

## Estructura de Directorios

```
/
├── src/                        # Código fuente del frontend
│   ├── api/                    # Clientes de API para comunicación con backend 
│   ├── components/             # Componentes React reutilizables
│   ├── context/                # Contextos React para estado global
│   ├── hooks/                  # Hooks personalizados para lógica compartida
│   ├── pages/                  # Componentes de página (rutas principales)
│   ├── services/               # Servicios para funcionalidad compartida
│   ├── types/                  # Definiciones de tipos TypeScript
│   │   └── generated/          # Tipos generados automáticamente
│   └── utils/                  # Utilidades y funciones helper
│
├── server/                     # Código fuente del backend
│   ├── ai/                     # Controladores e interfaces de IA
│   ├── config/                 # Configuración del servidor
│   ├── controllers/            # Controladores de API
│   ├── models/                 # Modelos de datos Sequelize
│   ├── routes/                 # Definición de rutas API
│   ├── scripts/                # Scripts de utilidad
│   └── services/               # Servicios compartidos del backend
```

## Patrones Principales

### 1. Generación Automática de Tipos

El sistema ahora utiliza generación automática de tipos desde los modelos Sequelize, manteniendo consistencia entre el backend y el frontend:

```bash
# Ejecutar generación de tipos
npm run generate:types
```

Esto crea interfaces TypeScript precisas y actualizadas en `src/types/generated/sequelize-models.ts` basadas en los modelos Sequelize.

### 2. Patrón Controller-Service-Router

El backend sigue un patrón MVC modificado:

- **Controllers**: Manejo de solicitudes/respuestas HTTP
- **Services**: Lógica de negocio
- **Routes**: Definición de endpoints
- **Models**: Definición de estructuras de datos

Ejemplo:
```typescript
// server/routes/patient.routes.ts
router.get('/:id', PatientController.getPatient);

// server/controllers/PatientController.ts
export const getPatient = async (req: Request, res: Response) => {
  try {
    const result = await PatientService.getPatient(req.params.id);
    return res.json({ success: true, data: result });
  } catch (error) {
    // Manejo de errores...
  }
};
```

### 3. Hooks Personalizados Consolidados

Los hooks personalizados siguen patrones consistentes:

#### useLoadingState

Hook compartido para gestionar estados de carga:

```typescript
const { isLoading, isError, error, runWithLoading } = useLoadingState({
  operation: 'fetch',
  entity: 'patient'
});

// Uso:
await runWithLoading(async () => {
  // Operación asíncrona
});
```

#### useError

Hook unificado para manejo de errores:

```typescript
const { captureError, errors, clearErrors } = useError();

try {
  // Código que puede lanzar error
} catch (error) {
  captureError(error, {
    severity: 'error',
    source: 'api'
  });
}
```

### 4. Componentes de UI Reutilizables

#### UserFlowOptimizer

Facilita la navegación entre vistas relacionadas con un paciente:

```tsx
<UserFlowOptimizer
  currentView="details"
  patient={patient}
  previousPath="/pacientes"
/>
```

#### PersistentViewState

Mantiene el estado de la UI entre navegaciones:

```tsx
<PersistentViewState
  viewId="patientDetails"
  onRestore={handleRestoreViewState}
>
  {/* Contenido de la página */}
</PersistentViewState>
```

### 5. Servicios Compartidos

#### exportService

Centraliza la funcionalidad para exportar datos:

```typescript
import { exportAsPdf, exportAsText, copyToClipboard, shareByEmail } from '../services/exportService';

// Uso
exportAsPdf(data, 'nombre_archivo.pdf');
```

## Contratos de API Estandarizados

Todas las respuestas de API siguen la estructura:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

## Generación de Documentación

- Código comentado usando JSDoc
- Guías técnicas en directorio /docs
- Comentarios significativos en puntos críticos

## Convenciones de Nombres

- **Componentes**: PascalCase (ej. `PatientForm.tsx`)
- **Hooks**: camelCase con prefijo `use` (ej. `useLoadingState.ts`)
- **Utilidades/Servicios**: camelCase (ej. `errorUtils.ts`)
- **Controladores**: Sufijo `Controller` (ej. `PatientController.ts`)
- **Rutas API**: Plural, kebab-case (ej. `/api/clinical-queries`)

## Mejores Prácticas

1. **Tipos sobre interfaces** para tipos simples
2. **Interfaces para objetos** complejos o extensibles
3. **Props explícitas** en componentes React
4. **Funciones pequeñas** con un único propósito
5. **Estado global mínimo**, preferir composición
6. **Manejo de errores** consistente
7. **Tests** para funcionalidad crítica
8. **Comentarios** para explicar "por qué", no "qué" 