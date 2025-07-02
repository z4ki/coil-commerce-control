import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  BarChart2, Users, FileText, CircleDollarSign, ShoppingBag, Home, Settings, Shield 
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
    { name: t('general.auditLog'), path: '/audit-log', icon: Shield },
    { name: t('general.settings'), path: '/settings', icon: Settings },
  ];

  return (
    <div className="w-64 h-full bg-sidebar text-sidebar-foreground flex flex-col overflow-hidden">
      {/* Logo */}
      <div className="flex items-center justify-center py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-3">
          <img src="/images/logo_HA_Sales_Manager.png" alt="Logo" className="h-32" />
          {/* <h1 className="text-lg font-bold">GROUPE HA</h1> */}
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
      
      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex flex-col items-center text-center">
          <p className="text-sm  font-medium">GROUPE<span className="text-red-600"> HA </span>@Azizi</p>
          <p className="text-xs text-red-600 mt-1 font-semibold italic ">"Colors That Last, Quality That Endures"</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
