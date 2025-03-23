import { DataTypes } from 'sequelize';
import { sequelize } from '../config';

// Modelo para resultados de pruebas psicológicas
const TestResult = sequelize.define('TestResult', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Nombre de la prueba psicológica'
  },
  score: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Puntuación o resultado cuantitativo'
  },
  testDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha de aplicación de la prueba'
  },
  interpretation: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Interpretación clínica de los resultados'
  },
  resultDetails: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Detalles estructurados de los resultados'
  },
  patientId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'patients',
      key: 'id'
    }
  },
  createdBy: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'test_results',
  timestamps: true
});

// No repetimos la definición de relaciones aquí, ya están en patient.ts

export { TestResult }; 