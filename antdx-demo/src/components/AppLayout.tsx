import React, { useState } from 'react';
import { Layout, Button, theme, Breadcrumb } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined, HomeOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import SidebarNavigation from './SidebarNavigation';
import { NavigationProvider, useNavigation } from '../context/NavigationContext';

const { Header, Sider, Content } = Layout;

interface AppLayoutProps {
  children: React.ReactNode;
}

// Componente interno que utiliza el hook de navegación
const AppLayoutContent: React.FC<AppLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { token } = theme.useToken();
  const { breadcrumbs } = useNavigation();

  return (
    <Layout style={{ minHeight: '100vh', width: '100%', display: 'flex' }} className="app-layout">
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        style={{
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
          height: '100vh',
          overflow: 'auto',
          position: 'sticky',
          top: 0,
          left: 0,
          zIndex: 10
        }}
        width={200}
        collapsedWidth={80}
      >
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? '0' : '0 16px',
          color: token.colorPrimary,
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          {!collapsed && "HopeAI"}
        </div>
        <SidebarNavigation />
      </Sider>
      <Layout style={{ width: '100%', minWidth: 0 }}>
        <Header style={{ 
          padding: '0 16px', 
          background: token.colorBgContainer,
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
          position: 'sticky',
          top: 0,
          zIndex: 9,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '16px',
                width: 64,
                height: 64,
                marginRight: 8
              }}
            />
            
            {/* Migas de pan */}
            <Breadcrumb items={breadcrumbs.map((item, index) => ({
              title: index === 0 
                ? <Link to={item.path}><HomeOutlined /></Link> 
                : <Link to={item.path}>{item.title}</Link>
            }))} />
          </div>
        </Header>
        <Content style={{ 
          margin: '24px 16px', 
          padding: 24, 
          background: token.colorBgContainer,
          borderRadius: token.borderRadius,
          minHeight: 280,
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

/**
 * AppLayout proporciona la estructura base de la aplicación con navegación lateral.
 * Incluye un sidebar colapsable, migas de pan y área de contenido principal.
 */
const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <NavigationProvider>
      <AppLayoutContent>
        {children}
      </AppLayoutContent>
    </NavigationProvider>
  );
};

export default AppLayout;
