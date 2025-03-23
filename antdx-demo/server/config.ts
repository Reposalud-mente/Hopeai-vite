import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Configuración para cargar variables de entorno
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Configuración para la conexión a PostgreSQL
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'hopeai_db',
  logging: console.log,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Configuración para la API de DeepSeek
const deepSeekConfig = {
  apiKey: process.env.DEEPSEEK_API_KEY || 'sk-key',
  apiUrl: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1',
  model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
  timeout: process.env.DEEPSEEK_TIMEOUT ? parseInt(process.env.DEEPSEEK_TIMEOUT, 10) : 60000,
  maxTokens: process.env.DEEPSEEK_MAX_TOKENS ? parseInt(process.env.DEEPSEEK_MAX_TOKENS, 10) : 2048
};

// Función para probar la conexión
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida correctamente.');
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error);
    return false;
  }
};

// Configuración general de la aplicación
export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  jwtSecret: process.env.JWT_SECRET || 'secreto-desarrollo',
  environment: process.env.NODE_ENV || 'development',
  deepSeek: deepSeekConfig
};

export { sequelize, testConnection }; 