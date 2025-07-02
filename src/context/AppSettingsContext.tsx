import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSettings, updateSettings } from '@/services/settingsService';

interface CompanyProfile {
  name: string;
  address: string;
  phone: string;
  email: string;
  nif?: string;
  nis?: string;
  rc?: string;
  ai?: string;
  rib?: string;
  taxId?: string;
  logo?: string;
}

interface AppSettings {
  id?: string;
  company: CompanyProfile;
  language: 'en' | 'fr';
  theme: 'light' | 'dark';
  currency: string;
  notifications?: boolean;
  darkMode?: boolean;
  user_id?: string;
  invoice: {
    nextNumber: number;
    paymentTerms: number;
  };
}

interface AppSettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  updateCompanyProfile: (profile: Partial<CompanyProfile>) => void;
}

const defaultSettings: AppSettings = {
  id: '',
  language: 'fr',
  theme: 'light',
  currency: 'DZD',
  notifications: true,
  darkMode: false,
  company: {
    name: 'Groupe HA',
    email: 'contact@groupeha.com',
    phone: '+213 XX XX XX XX',
    address: '123 Zone Industrielle, Alger, Algérie',
    nif: '',
    nis: '',
    rc: '',
    ai: '',
    rib: '',
    taxId: '',
    logo: ''
  },
  user_id: '',
  invoice: {
    nextNumber: 1,
    paymentTerms: 30,
  },
};

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

export const AppSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    // Initialize with default settings
    return defaultSettings;
  });

  // Load settings from database on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const dbSettings = await getSettings();
        // Defensive merge: always provide all fields, fallback to defaults
        setSettings(prev => ({
          ...defaultSettings,
          ...dbSettings,
          company: {
            ...defaultSettings.company,
            ...(dbSettings.company || {}),
            taxId: dbSettings.company?.nif ?? '',
            nif: dbSettings.company?.nif ?? '',
            nis: dbSettings.company?.nis ?? '',
            rc: dbSettings.company?.rc ?? '',
            ai: dbSettings.company?.ai ?? '',
            rib: dbSettings.company?.rib ?? '',
            logo: dbSettings.company?.logo ?? '',
          },
          invoice: {
            ...defaultSettings.invoice,
            ...(dbSettings.invoice || {}),
          },
        }));
      } catch (error) {
        console.error('Error loading settings:', error);
        setSettings(defaultSettings); // fallback to defaults
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    // Apply theme
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Apply language
    document.documentElement.lang = settings.language;
  }, [settings]);

  const updateAppSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }));
  };

  const updateCompanyProfile = async (profile: Partial<CompanyProfile>) => {
    try {
      // Update database
      await updateSettings({ company: profile });
      
      // Update local state
      setSettings(prev => ({
        ...prev,
        company: {
          ...prev.company,
          ...profile
        }
      }));
    } catch (error) {
      console.error('Error updating company profile:', error);
      throw error;
    }
  };

  return (
    <AppSettingsContext.Provider value={{
      settings,
      updateSettings: updateAppSettings,
      updateCompanyProfile,
    }}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (context === undefined) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
}; 