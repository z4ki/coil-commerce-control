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

  // ... rest of the code ...

  return (
    // ... rest of the component code ...
  );
};

export default Navigation; 