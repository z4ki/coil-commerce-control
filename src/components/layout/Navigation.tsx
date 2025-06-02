import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useLocation } from 'react-router-dom';
import { Home, ShoppingCart, FileText, Users, FileSpreadsheet, Settings } from 'lucide-react';

const Navigation = () => {
  const { t } = useLanguage();
  const location = useLocation();

  const menuItems = [
    {
      to: '/',
      icon: <Home className="h-4 w-4" />,
      label: t('nav.dashboard')
    },
    {
      to: '/sales',
      icon: <ShoppingCart className="h-4 w-4" />,
      label: t('nav.sales')
    },
    {
      to: '/invoices',
      icon: <FileText className="h-4 w-4" />,
      label: t('nav.invoices')
    },
    {
      to: '/clients',
      icon: <Users className="h-4 w-4" />,
      label: t('nav.clients')
    },
    {
      to: '/reports',
      icon: <FileSpreadsheet className="h-4 w-4" />,
      label: t('nav.reports')
    },
    {
      to: '/settings',
      icon: <Settings className="h-4 w-4" />,
      label: t('nav.settings')
    }
  ];
  return (
    <nav className="flex flex-col space-y-2">
      {menuItems.map((item) => (
        <a
          key={item.to}
          href={item.to}
          className={`flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-muted ${
            location.pathname === item.to ? 'bg-muted' : ''
          }`}
        >
          {item.icon}
          <span>{item.label}</span>
        </a>
      ))}
    </nav>
  );
};

export default Navigation; 