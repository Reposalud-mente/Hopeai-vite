import React from 'react';
import { Menu } from 'antd';
import { HomeOutlined, UserOutlined, BarChartOutlined } from '@ant-design/icons';
import { useNavigation } from '../hooks/useNavigation';
import type { NavigationRoute } from '../context/NavigationContext';

/**
 * SidebarNavigation proporciona los enlaces de navegación principal de la aplicación.
 * Utiliza el hook de navegación para gestionar las rutas y la navegación.
 */
const SidebarNavigation: React.FC = () => {
  const { 
    navigateTo, 
    selectedKeys, 
    openKeys, 
    setOpenKeys 
  } = useNavigation();

  const navigationItems: NavigationRoute[] = [
    {
      key: 'dashboard',
      icon: <HomeOutlined />,
      label: 'Dashboard',
      path: '/'
    },
    {
      key: 'patients',
      icon: <UserOutlined />,
      label: 'Pacientes',
      path: '/pacientes'
    },
    {
      key: 'analysis',
      icon: <BarChartOutlined />,
      label: 'Análisis',
      path: '/analisis'
    }
  ];

  const handleMenuClick = (key: string) => {
    const item = navigationItems.find(item => item.key === key);
    if (item) {
      // Primero intentamos usar la navegación React Router
      navigateTo(item.path);
      
      // Como alternativa, utilizamos window.location directamente para garantizar la navegación
      // Esto nos ayudará a diagnosticar si el problema es con react-router o con el componente
      setTimeout(() => {
        if (window.location.pathname !== item.path) {
          window.location.href = item.path;
        }
      }, 100);
    }
  };

  const handleOpenChange = (keys: string[]) => {
    setOpenKeys(keys);
  };

  const menuItems = navigationItems.map(item => ({
    key: item.key,
    icon: item.icon,
    label: item.label
  }));

  return (
    <Menu
      theme="light"
      mode="inline"
      selectedKeys={selectedKeys}
      openKeys={openKeys}
      items={menuItems}
      onClick={({ key }) => {
        console.log('Clic en el elemento de menú:', key);
        handleMenuClick(key);
      }}
      onOpenChange={handleOpenChange}
    />
  );
};

export default SidebarNavigation;
