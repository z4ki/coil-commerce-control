import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  BarChart2, Users, FileText, CircleDollarSign, ShoppingBag, Home, Settings 
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const Sidebar = () => {
  const { t } = useLanguage();
  
  const navItems = [
    { name: t('dashboard.title'), path: '/', icon: Home },
    { name: t('clients.title'), path: '/clients', icon: Users },
    { name: t('sales.title'), path: '/sales', icon: ShoppingBag },
    { name: t('general.invoices'), path: '/invoices', icon: FileText },
    { name: t('general.reports'), path: '/reports', icon: BarChart2 },
    { name: t('general.settings'), path: '/settings', icon: Settings },
  ];

  return (
    <div className="w-64 h-full bg-sidebar text-sidebar-foreground flex flex-col overflow-hidden">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-3">
          <img src="/lovable-uploads/9e20d722-b154-48fe-9e9d-616d64585926.png" alt="Logo" className="h-8" />
          <h1 className="text-lg font-bold">GROUPE HA</h1>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="px-2 space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink 
                to={item.path} 
                className={({ isActive }) => 
                  `flex items-center px-4 py-2.5 rounded-md transition-colors text-sm ${
                    isActive 
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                      : 'hover:bg-sidebar-accent/50'
                  }`
                }
              >
                <item.icon className="mr-3 h-4 w-4" />
                <span>{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* User profile */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center">
            <span className="font-medium text-sidebar-primary-foreground">A</span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">{t('general.adminUser')}</p>
            <p className="text-xs opacity-70">contact@groupeha.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
