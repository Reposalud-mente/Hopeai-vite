import './App.css'
import { PatientProvider } from './context/PatientContext'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import ErrorManager from './components/ErrorManager'
import { ConfigProvider, theme } from 'antd'
import esES from 'antd/es/locale/es_ES'
import React, { lazy } from 'react'
import SuspenseWrapper from './components/SuspenseWrapper'

// Componentes de diseño
import AppLayout from './components/AppLayout'

// Importación lazy de páginas principales
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const PatientsListPage = lazy(() => import('./pages/PatientsListPage'))
const AnalysisPage = lazy(() => import('./pages/AnalysisPage'))
const PatientDetailsPage = lazy(() => import('./pages/PatientDetailsPage'))
const NewPatientPage = lazy(() => import('./pages/NewPatientPage'))

function App() {
  return (
    <ConfigProvider 
      locale={esES}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#3B82F6',
          borderRadius: 6,
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        },
        components: {
          Layout: {
            bodyBg: '#f5f5f5',
            headerBg: '#ffffff',
            headerHeight: 64,
            siderBg: '#ffffff'
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
      <PatientProvider>
        <div className="app-container">
          <Router>
            <Routes>
              <Route path="/" element={
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
              <Route path="/analisis" element={
                <AppLayout>
                  <SuspenseWrapper>
                    <AnalysisPage />
                  </SuspenseWrapper>
                </AppLayout>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
          <ErrorManager autoNotify={true} />
        </div>
      </PatientProvider>
    </ConfigProvider>
  )
}

export default App
