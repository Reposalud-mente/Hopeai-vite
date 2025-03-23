import { DataTypes } from 'sequelize';
import { sequelize } from '../config';
import { TestResult } from './testResult';

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

// Establecer relación con TestResult
Patient.hasMany(TestResult, { 
  foreignKey: 'patientId', 
  as: 'testResults'
});
TestResult.belongsTo(Patient, { foreignKey: 'patientId' });

export { Patient }; 