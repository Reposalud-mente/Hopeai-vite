import { beforeAll, afterAll } from 'vitest';
import { sequelize } from '../config';

// Configuración global para todas las pruebas
beforeAll(async () => {
  try {
    // Primero, intentamos eliminar todas las tablas existentes
    await sequelize.getQueryInterface().dropAllTables();
    
    // Luego sincronizamos la base de datos
    await sequelize.sync({ force: true });
  } catch (error) {
    console.error('Error durante la inicialización de la base de datos de pruebas:', error);
    throw error;
  }
});

afterAll(async () => {
  try {
    // Limpiamos las tablas antes de cerrar
    await sequelize.getQueryInterface().dropAllTables();
    // Cerrar la conexión a la base de datos
    await sequelize.close();
  } catch (error) {
    console.error('Error durante la limpieza de la base de datos de pruebas:', error);
    throw error;
  }
}); 