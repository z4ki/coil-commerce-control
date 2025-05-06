
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, ShoppingBag, FileText, BarChart2, Settings } from 'lucide-react';

const MobileNav = () => {
  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Clients', path: '/clients', icon: Users },
    { name: 'Sales', path: '/sales', icon: ShoppingBag },
    { name: 'Invoices', path: '/invoices', icon: FileText },
    { name: 'Reports', path: '/reports', icon: BarChart2 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2">
      <ul className="flex justify-around">
        {navItems.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center px-2 py-1 ${
                  isActive ? 'text-primary' : 'text-gray-500'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.name}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default MobileNav;
