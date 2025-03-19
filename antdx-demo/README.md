# HopeAI - Demo de AntDesign X

Esta es una demo que muestra cómo usar los componentes de AntDesign X para crear una aplicación de asistente clínico para profesionales de psicología y psiquiatría.

## Configuración del MVP con Base de Datos Real

### Requisitos Previos

- Node.js (v18 o superior)
- PNPM (instalable con `npm install -g pnpm`)
- PostgreSQL (instalado y en ejecución)

### Configuración de PostgreSQL

1. Asegúrate de tener PostgreSQL instalado y en ejecución
2. Crea una base de datos para HopeAI:

```sql
CREATE DATABASE hopeai_db;
```

3. Configura el archivo `.env` con las credenciales correctas:

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_NAME=hopeai_db
```

### Instalación

1. Clona este repositorio
2. Instala las dependencias:

```bash
pnpm install
```

### Ejecución del MVP

Para iniciar tanto el servidor como el cliente:

```bash
pnpm start
```

Esto iniciará:
- Backend API Express en http://localhost:3001
- Frontend Vite en http://localhost:5173

### Estructura de Carpetas

```
/antdx-demo
  /server             # Servidor Express y configuración de BD
    config.js         # Configuración de Sequelize
    server.js         # Servidor Express
    /models           # Modelos de Sequelize
      patient.js      # Modelo Patient y TestResult
  /src
    /api              # Clientes API para frontend
    /components       # Componentes React
    /context          # Proveedores de contexto
    /hooks            # Hooks personalizados
```

### Endpoints de API Disponibles

- `GET /api/patients` - Obtener todos los pacientes
- `GET /api/patients/:id` - Obtener un paciente por ID con sus pruebas
- `PUT /api/patients/:id` - Actualizar datos de un paciente
- `PUT /api/patients/:id/evaluation-draft` - Actualizar borrador de evaluación
- `POST /api/patients/:id/test-results` - Añadir un resultado de prueba

### Configuración de AI

La aplicación utiliza la API de DeepSeek para inteligencia artificial. En el archivo `.env` ya tienes configuradas las claves necesarias para el funcionamiento básico.

### Pruebas

Para verificar que todo funciona correctamente:

1. Accede a http://localhost:5173 en tu navegador
2. Verifica que aparecen los pacientes cargados desde la base de datos
3. Selecciona un paciente para ver su historial
4. Prueba la escritura de un borrador y el guardado
5. Utiliza el asistente IA para realizar consultas

### Solución de Problemas

Si encuentras errores:

1. Verifica que PostgreSQL esté en ejecución
2. Comprueba que las credenciales en .env son correctas
3. Revisa los logs del servidor para posibles errores de conexión
4. Si la API no responde, asegúrate de que el puerto 3001 está disponible
