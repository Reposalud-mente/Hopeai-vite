import React, { Suspense, ReactNode } from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

interface SuspenseWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Componente que proporciona un wrapper consistente para Suspense
 * Utilizado principalmente para componentes cargados con React.lazy
 */
const SuspenseWrapper: React.FC<SuspenseWrapperProps> = ({ 
  children, 
  fallback 
}) => {
  const defaultFallback = (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
      <Spin 
        indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} 
        tip="Cargando componente..." 
      />
    </div>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
};

export default SuspenseWrapper; 