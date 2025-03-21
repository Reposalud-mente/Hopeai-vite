import { Rule } from 'antd/es/form';

/**
 * Utilidad para gestionar reglas de validación de formularios de manera consistente
 * Proporciona un conjunto de reglas predefinidas para usar con Ant Design Form
 */
class FormValidation {
  /**
   * Campo requerido
   * @param message Mensaje de error personalizado
   * @returns Regla de validación
   */
  public required(message = 'Este campo es obligatorio'): Rule {
    return { required: true, message };
  }

  /**
   * Validación de longitud mínima
   * @param min Longitud mínima
   * @param message Mensaje de error personalizado
   * @returns Regla de validación
   */
  public minLength(min: number, message?: string): Rule {
    return { min, message: message || `Debe tener al menos ${min} caracteres` };
  }

  /**
   * Validación de longitud máxima
   * @param max Longitud máxima
   * @param message Mensaje de error personalizado
   * @returns Regla de validación
   */
  public maxLength(max: number, message?: string): Rule {
    return { max, message: message || `No debe exceder ${max} caracteres` };
  }

  /**
   * Validación de email
   * @param message Mensaje de error personalizado
   * @returns Regla de validación
   */
  public email(message = 'Introduce un email válido'): Rule {
    return { 
      type: 'email', 
      message
    };
  }

  /**
   * Validación de número
   * @param message Mensaje de error personalizado
   * @returns Regla de validación
   */
  public number(message = 'Introduce un número válido'): Rule {
    return { 
      type: 'number', 
      message,
      transform: (value) => {
        if (value === '' || value === null || value === undefined) return null;
        return Number(value);
      }
    };
  }

  /**
   * Validación de rango numérico
   * @param min Valor mínimo
   * @param max Valor máximo
   * @param message Mensaje de error personalizado
   * @returns Regla de validación
   */
  public numberRange(min: number, max: number, message?: string): Rule {
    return { 
      type: 'number', 
      min, 
      max, 
      message: message || `Debe estar entre ${min} y ${max}`,
      transform: (value) => {
        if (value === '' || value === null || value === undefined) return null;
        return Number(value);
      }
    };
  }

  /**
   * Validación con expresión regular
   * @param pattern Expresión regular
   * @param message Mensaje de error personalizado
   * @returns Regla de validación
   */
  public pattern(pattern: RegExp, message: string): Rule {
    return { pattern, message };
  }

  /**
   * Validación personalizada
   * @param validator Función de validación
   * @returns Regla de validación
   */
  public custom(validator: (rule: Rule, value: unknown) => Promise<void> | void): Rule {
    return { validator };
  }

  /**
   * Conjunto común de reglas para validar nombres
   * @returns Array de reglas de validación
   */
  public nameRules(): Rule[] {
    return [
      this.required('El nombre es obligatorio'),
      this.minLength(2, 'El nombre debe tener al menos 2 caracteres'),
      this.maxLength(100, 'El nombre no debe exceder 100 caracteres')
    ];
  }

  /**
   * Conjunto común de reglas para validar edad
   * @returns Array de reglas de validación
   */
  public ageRules(): Rule[] {
    return [
      this.number('La edad debe ser un número'),
      this.numberRange(0, 120, 'La edad debe estar entre 0 y 120 años')
    ];
  }

  /**
   * Conjunto común de reglas para validar emails
   * @returns Array de reglas de validación
   */
  public emailRules(): Rule[] {
    return [
      this.required('El email es obligatorio'),
      this.email('Introduce un email válido')
    ];
  }

  /**
   * Conjunto común de reglas para validar teléfonos
   * @returns Array de reglas de validación
   */
  public phoneRules(): Rule[] {
    return [
      this.pattern(/^\+?[0-9]{8,15}$/, 'Introduce un número de teléfono válido')
    ];
  }

  /**
   * Conjunto común de reglas para validar notas cortas
   * @returns Array de reglas de validación
   */
  public shortNoteRules(): Rule[] {
    return [
      this.maxLength(500, 'La nota no debe exceder 500 caracteres')
    ];
  }

  /**
   * Conjunto común de reglas para validar notas clínicas
   * @returns Array de reglas de validación
   */
  public clinicalNoteRules(): Rule[] {
    return [
      this.required('La nota clínica es obligatoria'),
      this.minLength(10, 'La nota debe tener al menos 10 caracteres'),
      this.maxLength(5000, 'La nota no debe exceder 5000 caracteres')
    ];
  }
}

// Instancia singleton para usar en toda la aplicación
const formValidation = new FormValidation();

export default formValidation; 