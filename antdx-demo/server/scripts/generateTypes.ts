import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Model, ModelCtor, DataTypes } from 'sequelize';
// We need sequelize for initialization of models
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { sequelize } from '../config';

// Importar todos los modelos
import { Patient } from '../models/patient';
import { TestResult } from '../models/testResult';
import { ClinicalQuery } from '../models/clinicalQuery';

// Para ES modules, debemos calcular __dirname manualmente
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mapeo de tipos Sequelize a TypeScript
const typeMapping: Record<string, string> = {
  'INTEGER': 'number',
  'BIGINT': 'number',
  'FLOAT': 'number',
  'DOUBLE': 'number',
  'DECIMAL': 'number',
  'STRING': 'string',
  'TEXT': 'string',
  'DATE': 'Date',
  'BOOLEAN': 'boolean',
  'JSON': 'Record<string, unknown>',
  'JSONB': 'Record<string, unknown>',
  'ARRAY': 'Array<unknown>', // Esto se procesará especialmente
  'UUID': 'string',
};

// Función para obtener el tipo TypeScript a partir del tipo Sequelize
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getTypeScriptType(attribute: Record<string, any>): string {
  const type = attribute.type.constructor.name;
  
  // Procesar tipos Array
  if (type === 'ArrayType') {
    const itemType = attribute.type.options.type.constructor.name;
    return `Array<${typeMapping[itemType] || 'unknown'}>`;
  }
  
  // Intentar usar el nombre del tipo directamente
  if (typeMapping[type]) {
    return typeMapping[type];
  }
  
  // Buscar por clave en DataTypes
  for (const key in DataTypes) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (attribute.type instanceof (DataTypes as any)[key]) {
      return typeMapping[key] || 'unknown';
    }
  }
  
  return 'unknown';
}

// Función para generar la interfaz TypeScript a partir de un modelo
function generateInterface(model: ModelCtor<Model>): string {
  const modelName = model.name;
  const attributes = model.getAttributes();
  
  let interfaceStr = `export interface I${modelName} {\n`;
  
  for (const [attrName, attribute] of Object.entries(attributes)) {
    // Omitir atributos createdAt, updatedAt si no se quieren incluir
    // if (attrName === 'createdAt' || attrName === 'updatedAt') continue;
    
    const tsType = getTypeScriptType(attribute);
    const isOptional = attribute.allowNull === true;
    const optionalMark = isOptional ? '?' : '';
    
    // Agregar comentario del atributo si existe
    if (attribute.comment) {
      interfaceStr += `  /** ${attribute.comment} */\n`;
    }
    
    interfaceStr += `  ${attrName}${optionalMark}: ${tsType};\n`;
  }
  
  interfaceStr += '}\n\n';
  return interfaceStr;
}

// Función principal para generar tipos
async function generateTypes(): Promise<void> {
  try {
    // Asegúrate de que el directorio existe
    const typesDir = path.resolve(__dirname, '../../src/types/generated');
    if (!fs.existsSync(typesDir)) {
      fs.mkdirSync(typesDir, { recursive: true });
    }
    
    // Generar archivo de definición de tipos
    let content = `/**
 * ESTE ARCHIVO ES GENERADO AUTOMÁTICAMENTE
 * NO MODIFICAR MANUALMENTE
 * 
 * Generado el: ${new Date().toISOString()}
 */

`;
    
    // Mapeo de modelos
    const models = [
      { model: Patient },
      { model: TestResult },
      { model: ClinicalQuery },
    ];
    
    // Generar interfaces para cada modelo
    for (const { model } of models) {
      content += generateInterface(model);
    }
    
    // Escribir el archivo de tipos
    const outputPath = path.resolve(typesDir, 'sequelize-models.ts');
    fs.writeFileSync(outputPath, content);
    
    console.log(`Tipos generados exitosamente en: ${outputPath}`);
  } catch (error) {
    console.error('Error al generar tipos:', error);
  }
}

// Ejecutar la generación
generateTypes().then(() => {
  console.log('Proceso de generación de tipos completado.');
  process.exit(0);
}).catch(err => {
  console.error('Error en el proceso de generación de tipos:', err);
  process.exit(1);
}); 