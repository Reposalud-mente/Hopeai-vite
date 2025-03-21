# HopeAI: Patrones de Código

Este documento describe los patrones y convenciones de código utilizados en el proyecto HopeAI.

## Arquitectura General

### Estructura de Directorios

- **api/**: Clientes API y funciones de conexión con los servicios backend
- **assets/**: Recursos estáticos (imágenes, iconos)
- **components/**: Componentes React reutilizables
- **context/**: Contextos de React para gestión de estado global
- **hooks/**: Hooks personalizados
- **pages/**: Componentes a nivel de página
- **services/**: Servicios para lógica de negocio compleja
- **types/**: Definiciones de tipos TypeScript
- **utils/**: Utilidades y funciones auxiliares

## Patrones de Carga y Rendimiento

### Lazy Loading

Utilizamos `React.lazy` y `Suspense` para cargar componentes pesados de forma diferida:

```tsx
// Importación lazy de componentes
const DashboardPage = lazy(() => import('./pages/DashboardPage'))

// Envolvemos componentes lazy con SuspenseWrapper
<SuspenseWrapper>
  <DashboardPage />
</SuspenseWrapper>
```

### Memoización

Optimizamos el rendimiento con `React.memo` y hooks de memoización:

```tsx
// Componentes que no necesitan re-renderizarse frecuentemente
export default memo(MyComponent);

// Cálculos costosos en componentes
const expensiveValue = useMemo(() => calculateValue(a, b), [a, b]);

// Funciones de callback
const handleClick = useCallback(() => { doSomething() }, [dependency]);
```

## Gestión de Estado

### Context API

Utilizamos Context API de React para gestionar estado global:

```tsx
// Contexto para datos de pacientes
import { PatientContext } from '../context/PatientContext';
const { patients, getPatient } = useContext(PatientContext);
```

### Hooks Personalizados

Encapsulamos lógica reutilizable en hooks personalizados:

```tsx
// Obtener datos de pacientes
const { patient, isLoading, error } = usePatient(patientId);

// Gestionar estados de carga
const { isLoading, runWithLoading } = useLoadingState({
  operation: 'fetch',
  entity: 'patient'
});
```

## Manejo de Operaciones Asíncronas

### Loading States

Usamos `useLoadingState` para gestionar estados de carga:

```tsx
const { isLoading, runWithLoading } = useLoadingState();

const handleSubmit = async () => {
  await runWithLoading(async () => {
    // Operación asíncrona
  });
};
```

### Componentes de Feedback

Utilizamos `LoadingFeedback` y `withLoadingFeedback` para feedback visual:

```tsx
<LoadingFeedback
  loading={isLoading}
  error={error}
  loadingText="Cargando datos del paciente..."
>
  <PatientInfo patient={patient} />
</LoadingFeedback>
```

## Manejo de Errores

### Boundaries

Utilizamos `ErrorBoundary` para capturar errores en componentes:

```tsx
<ErrorBoundary componentName="PatientDetails">
  <PatientDetails id={id} />
</ErrorBoundary>
```

### Servicio Centralizado

Aprovechamos `useError` para captura centralizada:

```tsx
const { captureError } = useError();

try {
  // Operación riesgosa
} catch (error) {
  captureError(error, 'PatientPage');
}
```

## Notificaciones

Utilizamos `notificationService` para todas las notificaciones:

```tsx
import notificationService from '../utils/notificationService';

// Notificaciones pequeñas (toast)
notificationService.successToast('Operación completada');
notificationService.errorToast('Ha ocurrido un error');

// Notificaciones completas
notificationService.success('Éxito', 'El paciente ha sido creado');
notificationService.error('Error', 'No se pudo guardar el paciente');

// Notificaciones de carga
const operationKey = 'save-patient';
notificationService.loadingToast('Guardando paciente...', operationKey);
notificationService.updateToast('success', 'Paciente guardado', operationKey);
```

## Validación de Formularios

Utilizamos `formValidation` para reglas consistentes:

```tsx
import formValidation from '../utils/formValidation';

// En componentes de formulario
<Form.Item 
  name="name" 
  label="Nombre" 
  rules={formValidation.nameRules()}
>
  <Input />
</Form.Item>

<Form.Item 
  name="age" 
  label="Edad" 
  rules={formValidation.ageRules()}
>
  <InputNumber />
</Form.Item>

// Reglas personalizadas
<Form.Item 
  name="customField" 
  rules={[
    formValidation.required('Campo obligatorio'),
    formValidation.pattern(/^\d{4}$/, 'Debe ser un código de 4 dígitos')
  ]}
>
  <Input />
</Form.Item>
```

## Convenciones de Código

### Nombres

- **Componentes**: PascalCase (ej. `PatientList`)
- **Hooks**: camelCase con prefijo "use" (ej. `usePatient`)
- **Contextos**: PascalCase con sufijo "Context" (ej. `PatientContext`)
- **Utilidades**: camelCase (ej. `formatDate`)

### Estructura de Componentes

```tsx
import React, { useState } from 'react';
import { OtherDependency } from 'other-lib';

// Interfaz de props
interface MyComponentProps {
  // Props con su tipo
}

/**
 * Descripción del componente
 */
const MyComponent: React.FC<MyComponentProps> = ({ prop1, prop2 }) => {
  // Estado y hooks
  const [state, setState] = useState();
  
  // Funciones y handlers
  const handleSomething = () => {
    // lógica
  };
  
  // Renderizado
  return (
    <div>
      {/* JSX */}
    </div>
  );
};

export default MyComponent;
```

## Estándares de Comentarios

- Comentar **por qué** se hace algo, no qué se hace
- Documentar interfaces públicas con JSDoc
- Comentar secciones complejas o poco intuitivas
- Evitar comentarios obvios

## Buenas Prácticas

1. **Componentes pequeños y enfocados**
2. **Evitar duplicación de código**
3. **Separar lógica de presentación**
4. **Gestionar side-effects con useMemo y useCallback**
5. **Normalizar datos para evitar inconsistencias**
6. **Utilizar tipado estricto en TypeScript**
7. **Preferir hooks sobre clases para nuevos componentes** 