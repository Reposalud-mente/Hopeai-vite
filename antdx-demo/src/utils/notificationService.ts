import { notification, message } from 'antd';
import { ArgsProps } from 'antd/es/notification';
import { ReactNode } from 'react';
import type { MessageInstance } from 'antd/es/message/interface';

// Tipos de notificación
export type NotificationType = 'success' | 'info' | 'warning' | 'error';

// Opciones extendidas para notificaciones
export interface NotificationOptions extends Omit<ArgsProps, 'message' | 'description' | 'type'> {
  duration?: number;
  key?: string;
  closable?: boolean;
  onClick?: () => void;
}

// Opciones para mensajes toast simples
export interface MessageOptions {
  duration?: number;
  key?: string;
  onClick?: () => void;
}

// Control de frecuencia de notificaciones
interface ThrottleControl {
  lastShown: Record<string, number>;
  minInterval: number;
}

// Variable para almacenar la instancia del mensaje
let messageInstance: MessageInstance | typeof message = message;

/**
 * Servicio unificado de notificaciones para toda la aplicación
 * Proporciona una interfaz consistente para mostrar feedback al usuario
 */
class NotificationService {
  private throttleControl: ThrottleControl = {
    lastShown: {},
    minInterval: 500, // mínimo 500ms entre notificaciones del mismo tipo
  };

  // Método para inicializar con la instancia de App.message
  public init(instance: MessageInstance | typeof message): void {
    messageInstance = instance;
  }

  // Verificar si debe mostrar una notificación (evitar exceso)
  private shouldShow(key: string): boolean {
    const now = Date.now();
    const lastTime = this.throttleControl.lastShown[key] || 0;
    
    if (now - lastTime < this.throttleControl.minInterval) {
      return false;
    }
    
    this.throttleControl.lastShown[key] = now;
    return true;
  }

  /**
   * Muestra una notificación en la esquina de la pantalla
   * @param type Tipo de notificación (success, info, warning, error)
   * @param title Título de la notificación
   * @param description Descripción o contenido de la notificación
   * @param options Opciones adicionales
   */
  public notify(
    type: NotificationType,
    title: string,
    description?: ReactNode,
    options: NotificationOptions = {}
  ): void {
    const { duration = 4.5, key, closable = true, onClick, ...restOptions } = options;
    
    // Clave para throttling
    const throttleKey = key || `${type}-${title}`;
    if (!this.shouldShow(throttleKey)) return;

    // Programamos la notificación en la siguiente iteración del event loop
    setTimeout(() => {
      notification[type]({
        message: title,
        description,
        duration,
        key,
        closable,
        onClick,
        ...restOptions
      });
    }, 0);
  }

  /**
   * Muestra un mensaje toast simple
   * @param type Tipo de mensaje
   * @param content Contenido del mensaje
   * @param options Opciones adicionales
   */
  public toast(
    type: NotificationType,
    content: ReactNode,
    options: MessageOptions = {}
  ): void {
    const { duration = 3, key } = options;
    
    // Clave para throttling
    const throttleKey = key || `toast-${type}-${String(content)}`;
    if (!this.shouldShow(throttleKey)) return;

    // Utilizamos el mensaje dinámico
    setTimeout(() => {
      if (key) {
        messageInstance[type]({ content, key, duration });
      } else {
        messageInstance[type](content, duration);
      }
    }, 0);
  }

  /**
   * Muestra un mensaje de carga persistente
   * @param content Contenido del mensaje
   * @param key Clave única para el mensaje (necesaria para actualizarlo posteriormente)
   */
  public loadingToast(content: ReactNode, key: string): void {
    if (!this.shouldShow(`loading-${key}`)) return;
    
    setTimeout(() => {
      messageInstance.loading({ content, duration: 0, key });
    }, 0);
  }

  /**
   * Actualiza un mensaje de carga existente
   * @param type Nuevo tipo de mensaje
   * @param content Nuevo contenido
   * @param key Clave del mensaje a actualizar
   * @param duration Duración antes de desaparecer
   */
  public updateToast(
    type: NotificationType,
    content: ReactNode,
    key: string,
    duration: number = 3
  ): void {
    setTimeout(() => {
      messageInstance[type]({ content, key, duration });
    }, 0);
  }

  // Métodos de conveniencia
  public success(title: string, description?: ReactNode, options?: NotificationOptions): void {
    this.notify('success', title, description, options);
  }

  public info(title: string, description?: ReactNode, options?: NotificationOptions): void {
    this.notify('info', title, description, options);
  }

  public warning(title: string, description?: ReactNode, options?: NotificationOptions): void {
    this.notify('warning', title, description, options);
  }

  public error(title: string, description?: ReactNode, options?: NotificationOptions): void {
    this.notify('error', title, description, options);
  }

  public successToast(content: ReactNode, options?: MessageOptions): void {
    this.toast('success', content, options);
  }

  public infoToast(content: ReactNode, options?: MessageOptions): void {
    this.toast('info', content, options);
  }

  public warningToast(content: ReactNode, options?: MessageOptions): void {
    this.toast('warning', content, options);
  }

  public errorToast(content: ReactNode, options?: MessageOptions): void {
    this.toast('error', content, options);
  }
}

// Instancia singleton para usar en toda la aplicación
const notificationService = new NotificationService();

export default notificationService; 