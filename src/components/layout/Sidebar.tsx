
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  BarChart2, Users, FileText, DollarSign, ShoppingBag, Home, Settings 
} from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Clients', path: '/clients', icon: Users },
    { name: 'Sales', path: '/sales', icon: ShoppingBag },
    { name: 'Invoices', path: '/invoices', icon: FileText },
    { name: 'Reports', path: '/reports', icon: BarChart2 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="w-64 h-full bg-sidebar text-sidebar-foreground flex flex-col overflow-hidden">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-3">
          <DollarSign size={28} className="text-sidebar-primary" />
          <h1 className="text-xl font-bold">PPGI Coils</h1>
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
                  `flex items-center px-4 py-3 rounded-md transition-colors ${
                    isActive 
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                      : 'hover:bg-sidebar-accent/50'
                  }`
                }
              >
                <item.icon className="mr-3 h-5 w-5" />
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
            <p className="text-sm font-medium">Admin User</p>
            <p className="text-xs opacity-70">admin@ppgicoils.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
