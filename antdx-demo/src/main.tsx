import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.js'
import './index.css'

// Add global error handler
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  // Show a visible error message on screen
  const errorDiv = document.createElement('div');
  errorDiv.style.position = 'fixed';
  errorDiv.style.top = '0';
  errorDiv.style.left = '0';
  errorDiv.style.right = '0';
  errorDiv.style.padding = '20px';
  errorDiv.style.background = '#ffcccb';
  errorDiv.style.color = 'darkred';
  errorDiv.style.zIndex = '9999';
  errorDiv.style.textAlign = 'center';
  errorDiv.innerHTML = `<strong>Error:</strong> ${event.error?.message || 'Unknown error'}`;
  document.body.prepend(errorDiv);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
