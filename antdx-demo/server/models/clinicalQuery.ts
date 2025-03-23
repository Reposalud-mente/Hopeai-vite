import { DataTypes } from 'sequelize';
import { sequelize } from '../config';
import { Patient } from './patient';

// Modelo para consultas clínicas interactivas
const ClinicalQuery = sequelize.define('ClinicalQuery', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  question: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  answer: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  responseJson: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Respuesta estructurada en formato JSON'
  },
  confidenceScore: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'Nivel de confianza de la respuesta (0-1)'
  },
  references: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Referencias clínicas utilizadas'
  },
  isFavorite: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true
  },
  // Campos para el sistema de retroalimentación
  feedbackRating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Calificación de la respuesta (1-5)'
  },
  feedbackComment: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Comentario de retroalimentación'
  },
  feedbackTags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
    comment: 'Etiquetas de retroalimentación (útil, precisa, etc.)'
  },
  hasFeedback: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si se ha proporcionado retroalimentación'
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
  tableName: 'clinical_queries',
  timestamps: true
});

// Establecer relación con paciente
Patient.hasMany(ClinicalQuery, { 
  foreignKey: 'patientId', 
  as: 'clinicalQueries'
});
ClinicalQuery.belongsTo(Patient, { foreignKey: 'patientId' });

export { ClinicalQuery }; 