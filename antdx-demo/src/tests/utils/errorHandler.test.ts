import { describe, it, expect } from 'vitest';
import { BaseError, APIError, AIError, UIError } from '../../utils/errorHandler';
import { ErrorSeverity, ErrorSource } from '../../context/ErrorContext';

describe('Error Classes', () => {
  describe('BaseError', () => {
    it('should create base error with correct properties', () => {
      const error = new BaseError(
        'Test error message',
        ErrorSeverity.WARNING,
        ErrorSource.UNKNOWN,
        { test: 'context' }
      );
      
      expect(error.message).toBe('Test error message');
      expect(error.name).toBe('BaseError');
      expect(error.severity).toBe(ErrorSeverity.WARNING);
      expect(error.source).toBe(ErrorSource.UNKNOWN);
      expect(error.context).toEqual({ test: 'context' });
    });
    
    it('should convert to ErrorData correctly', () => {
      const error = new BaseError('Test error', ErrorSeverity.ERROR, ErrorSource.UI);
      const errorData = error.toErrorData();
      
      expect(errorData.message).toBe('Test error');
      expect(errorData.severity).toBe(ErrorSeverity.ERROR);
      expect(errorData.source).toBe(ErrorSource.UI);
      expect(errorData.stack).toBeDefined();
    });
  });
  
  describe('APIError', () => {
    it('should create API error with correct properties', () => {
      const error = new APIError('API error', 404);
      
      expect(error.message).toBe('API error');
      expect(error.name).toBe('APIError');
      expect(error.status).toBe(404);
      expect(error.severity).toBe(ErrorSeverity.WARNING); // 4xx codes are warnings
      expect(error.source).toBe(ErrorSource.API);
    });
    
    it('should determine severity based on status code', () => {
      const error1 = new APIError('API error', 500);
      const error2 = new APIError('API error', 404);
      const error3 = new APIError('API error', 200); // Invalid but still handled
      
      expect(error1.severity).toBe(ErrorSeverity.ERROR); // 5xx = error
      expect(error2.severity).toBe(ErrorSeverity.WARNING); // 4xx = warning
      expect(error3.severity).toBe(ErrorSeverity.INFO); // other = info
    });
  });
  
  describe('AIError', () => {
    it('should create AI error with correct properties', () => {
      const error = new AIError(
        'AI error message',
        'rate_limit_exceeded',
        'model_overloaded',
        ErrorSeverity.ERROR,
        { model: 'deepseek' }
      );
      
      expect(error.message).toBe('AI error message');
      expect(error.name).toBe('AIError');
      expect(error.errorType).toBe('rate_limit_exceeded');
      expect(error.errorCode).toBe('model_overloaded');
      expect(error.severity).toBe(ErrorSeverity.ERROR);
      expect(error.source).toBe(ErrorSource.AI);
      expect(error.context).toEqual({ 
        errorType: 'rate_limit_exceeded',
        errorCode: 'model_overloaded',
        model: 'deepseek'
      });
    });
  });
  
  describe('UIError', () => {
    it('should create UI error with correct properties', () => {
      const error = new UIError(
        'UI error message',
        'TestComponent',
        ErrorSeverity.WARNING,
        { action: 'button_click' }
      );
      
      expect(error.message).toBe('UI error message');
      expect(error.name).toBe('UIError');
      expect(error.component).toBe('TestComponent');
      expect(error.severity).toBe(ErrorSeverity.WARNING);
      expect(error.source).toBe(ErrorSource.UI);
      expect(error.context).toEqual({ 
        component: 'TestComponent',
        action: 'button_click'
      });
    });
  });
}); 