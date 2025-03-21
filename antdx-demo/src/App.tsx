import './App.css'
import { PatientProvider } from './context/PatientContext'
import PatientReviewPage from './components/PatientReviewPage'
import ErrorManager from './components/ErrorManager'
import { ConfigProvider, theme } from 'antd'
import esES from 'antd/es/locale/es_ES'

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
          <PatientReviewPage />
          <ErrorManager autoNotify={true} />
        </div>
      </PatientProvider>
    </ConfigProvider>
  )
}

export default App
