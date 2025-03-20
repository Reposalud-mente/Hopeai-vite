import { DataTypes } from 'sequelize';
import { sequelize } from '../config.js';

// Modelo para pacientes
const Patient = sequelize.define('Patient', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Nueva Paciente'
  },
  evaluationDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  psychologist: {
    type: DataTypes.STRING,
    allowNull: true
  },
  consultReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  evaluationDraft: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'patients',
  timestamps: true
});

// Modelo para resultados de pruebas psicológicas
const TestResult = sequelize.define('TestResult', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  score: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  interpretation: {
    type: DataTypes.STRING,
    allowNull: true
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  patientId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'patients',
      key: 'id'
    }
  }
}, {
  tableName: 'test_results',
  timestamps: true
});

// Establecer relación
Patient.hasMany(TestResult, { 
  foreignKey: 'patientId', 
  as: 'testResults'
});
TestResult.belongsTo(Patient, { foreignKey: 'patientId' });

export { Patient, TestResult }; 