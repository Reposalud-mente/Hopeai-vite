import './App.css'
import { PatientProvider } from './context/PatientContext'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import ErrorManager from './components/ErrorManager'
import { ConfigProvider, theme, App as AntApp, message, Spin } from 'antd'
import esES from 'antd/es/locale/es_ES'
import React, { lazy, Suspense, useEffect, FC } from 'react'
import notificationService from './utils/notificationService'
import { ErrorBoundary } from './components/ErrorBoundary'

// Componentes de diseño
import AppLayout from './components/AppLayout'

// Importación lazy de páginas principales
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const PatientsListPage = lazy(() => import('./pages/PatientsListPage'))
const NewPatientPage = lazy(() => import('./pages/NewPatientPage'))
const PatientDetailsPage = lazy(() => import('./pages/PatientDetailsPage'))
const ClinicalAnalysisPage = lazy(() => import('./pages/ClinicalAnalysisPage'))

// Envoltorio para Suspense
const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Spin size="large" tip="Cargando..." />
    </div>
  }>
    {children}
  </Suspense>
)

function App() {
  // Configuración global de mensajes (para fallback)
  message.config({
    top: 80,
    duration: 3,
    maxCount: 3,
  });

  return (
    <ErrorBoundary>
      <ConfigProvider 
        locale={esES}
        theme={{
          algorithm: theme.defaultAlgorithm,
          token: {
            colorPrimary: '#0075FF',
            borderRadius: 6,
            colorSuccess: '#52c41a',
            colorWarning: '#faad14',
            colorError: '#ff4d4f',
            colorInfo: '#1890ff',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          },
          components: {
            Layout: {
              bodyBg: '#f0f2f5',
              headerBg: '#ffffff',
              headerHeight: 64,
              siderBg: '#ffffff',
            },
            Menu: {
              itemBg: 'transparent',
              itemSelectedBg: '#f0f7ff',
              itemHoverBg: '#f0f7ff',
            },
            Card: {
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
            }
          }
        }}
      >
        <AntApp>
          {/* Hook para inicializar el servicio de notificaciones con App.message */}
          <MessageInitializer />
          <PatientProvider>
            <div className="app-container">
              <Router>
                <Routes>
                  {/* Redirección directa de / a /dashboard usando Route con elemento Navigate */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />

                  <Route path="/dashboard" element={
                    <AppLayout>
                      <SuspenseWrapper>
                        <DashboardPage />
                      </SuspenseWrapper>
                    </AppLayout>
                  } />
                  <Route path="/pacientes" element={
                    <AppLayout>
                      <SuspenseWrapper>
                        <PatientsListPage />
                      </SuspenseWrapper>
                    </AppLayout>
                  } />
                  <Route path="/pacientes/nuevo" element={
                    <AppLayout>
                      <SuspenseWrapper>
                        <NewPatientPage />
                      </SuspenseWrapper>
                    </AppLayout>
                  } />
                  <Route path="/pacientes/:id" element={
                    <AppLayout>
                      <SuspenseWrapper>
                        <PatientDetailsPage />
                      </SuspenseWrapper>
                    </AppLayout>
                  } />
                  <Route path="/pacientes/:patientId/analisis-interactivo" element={
                    <AppLayout>
                      <SuspenseWrapper>
                        <ClinicalAnalysisPage />
                      </SuspenseWrapper>
                    </AppLayout>
                  } />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Router>
              <ErrorManager autoNotify={true} />
            </div>
          </PatientProvider>
        </AntApp>
      </ConfigProvider>
    </ErrorBoundary>
  )
}

// Componente para inicializar el servicio de notificaciones con App.message
const MessageInitializer: FC = () => {
  const { message: messageApi } = AntApp.useApp();
  
  useEffect(() => {
    // Inicializar el servicio de notificaciones con la instancia de message de App
    notificationService.init(messageApi);
  }, [messageApi]);
  
  return null;
}

export default App
