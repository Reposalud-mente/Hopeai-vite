import React, { useState, useEffect } from 'react';
import { FloatButton, Badge } from 'antd';
import { BugOutlined } from '@ant-design/icons';
import { useError, ErrorSeverity } from '../context/ErrorContext';
import { ErrorLogDrawer, showErrorNotification } from './ErrorDisplay';

interface ErrorManagerProps {
  autoNotify?: boolean;
  notifyMinSeverity?: ErrorSeverity;
}

/**
 * ErrorManager component for displaying and managing errors
 * This should be placed at the root level of the application
 */
const ErrorManager: React.FC<ErrorManagerProps> = ({
  autoNotify = true,
  notifyMinSeverity = ErrorSeverity.ERROR,
}) => {
  const { errors, lastError } = useError();
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Auto-notify for new errors that meet the severity threshold
  useEffect(() => {
    if (
      autoNotify && 
      lastError && 
      !lastError.handled && 
      isSeverityAtLeast(lastError.severity, notifyMinSeverity)
    ) {
      showErrorNotification(lastError);
    }
  }, [lastError, autoNotify, notifyMinSeverity]);
  
  // Count errors by severity
  const criticalCount = errors.filter(e => e.severity === ErrorSeverity.CRITICAL).length;
  const errorCount = errors.filter(e => e.severity === ErrorSeverity.ERROR).length;
  const warningCount = errors.filter(e => e.severity === ErrorSeverity.WARNING).length;
  
  // Determine button color based on the highest severity
  const buttonColor = criticalCount > 0 
    ? 'red' 
    : errorCount > 0 
      ? 'orange' 
      : warningCount > 0 
        ? 'yellow' 
        : 'default';

  // Function to open the error drawer
  const handleOpenDrawer = () => {
    setDrawerOpen(true);
  };
  
  // Function to close the error drawer
  const handleCloseDrawer = () => {
    setDrawerOpen(false);
  };

  // Only render the float button if there are errors
  return (
    <>
      {errors.length > 0 && (
        <FloatButton
          icon={<Badge count={errors.length} offset={[-5, 5]}><BugOutlined /></Badge>}
          type="primary"
          onClick={handleOpenDrawer}
          style={{ 
            backgroundColor: buttonColor !== 'default' ? buttonColor : undefined,
          }}
          tooltip="Ver errores"
        />
      )}
      
      <ErrorLogDrawer 
        open={drawerOpen} 
        onClose={handleCloseDrawer} 
      />
    </>
  );
};

// Helper function to check if a severity level is at least a minimum level
function isSeverityAtLeast(severity: ErrorSeverity, minSeverity: ErrorSeverity): boolean {
  const severityValues: Record<ErrorSeverity, number> = {
    [ErrorSeverity.INFO]: 0,
    [ErrorSeverity.WARNING]: 1,
    [ErrorSeverity.ERROR]: 2,
    [ErrorSeverity.CRITICAL]: 3,
  };
  
  return severityValues[severity] >= severityValues[minSeverity];
}

export default ErrorManager; 