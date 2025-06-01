import React from 'react';
import { ThemeProvider as NextThemeProvider } from 'next-themes';

interface ThemeProviderProps {
  children: React.ReactNode;
}

const ThemeProvider = ({ children }: ThemeProviderProps) => {
  return (
    <NextThemeProvider 
      attribute="class" 
      defaultTheme="light" 
      enableSystem 
      disableTransitionOnChange
    >
      {children}
    </NextThemeProvider>
  );
};

export default ThemeProvider; 