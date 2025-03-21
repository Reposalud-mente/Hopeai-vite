import React from 'react';
import LoadingFeedback from './LoadingFeedback';

interface WithLoadingProps {
  loading?: boolean;
  error?: Error | null;
  success?: boolean;
  loadingText?: string;
  errorText?: string;
  successText?: string;
  compact?: boolean;
  showRetry?: boolean;
  onRetry?: () => void;
}

/**
 * HOC que envuelve un componente con feedback de carga
 */
const withLoadingFeedback = <P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    compact?: boolean,
    defaultLoadingText?: string,
    defaultErrorText?: string,
    defaultSuccessText?: string
  }
) => {
  const WithLoading: React.FC<P & WithLoadingProps> = (props) => {
    const {
      loading = false,
      error = null,
      success = false,
      loadingText,
      errorText,
      successText,
      compact = options?.compact || false,
      showRetry = false,
      onRetry,
      ...componentProps
    } = props;

    return (
      <LoadingFeedback
        loading={loading}
        error={error}
        success={success}
        loadingText={loadingText || options?.defaultLoadingText}
        errorText={errorText || options?.defaultErrorText}
        successText={successText || options?.defaultSuccessText}
        compact={compact}
        showRetry={showRetry}
        onRetry={onRetry}
      >
        <Component {...componentProps as P} />
      </LoadingFeedback>
    );
  };

  return WithLoading;
};

export default withLoadingFeedback; 