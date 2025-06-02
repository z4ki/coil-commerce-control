import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import { Helmet } from 'react-helmet';
import { Button } from '../ui/button';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
  headerAction?: React.ReactNode;
}

const MainLayout = ({ children, title, headerAction }: MainLayoutProps) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Déconnexion réussie');
    navigate('/login');
  };

  return (
    <>
      <Helmet>
        <title>{title} | HA SALES MANAGER</title>
      </Helmet>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Sidebar for desktop */}
        <div className="hidden md:flex">
          <Sidebar />
        </div>
        
        {/* Main content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="bg-white border-b border-border px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
              <div className="flex items-center gap-4">
                {headerAction}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </header>
          
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
          
          {/* Mobile navigation */}
          <div className="md:hidden">
            <MobileNav />
          </div>
        </div>
      </div>
    </>
  );
};

export default MainLayout;
