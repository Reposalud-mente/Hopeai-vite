import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.js'
import './index.css'
import { ErrorProvider } from './context/ErrorContext'
import { ErrorBoundary } from './components/ErrorBoundary'

// Add global error handler
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  // The visual error handling will now be managed by our ErrorContext system
});

// Capture unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // The visual error handling will now be managed by our ErrorContext system
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorProvider>
      <ErrorBoundary componentName="Aplicación">
        <App />
      </ErrorBoundary>
    </ErrorProvider>
  </React.StrictMode>,
)
