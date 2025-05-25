import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSettings, updateSettings } from '@/services/settingsService';

interface CompanyProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  taxId: string;
  nis: string;
  rc: string;
  ai: string;
  rib: string;
}

interface InvoiceSettings {
  nextNumber: number;
  paymentTerms: number;
  defaultNotes: string;
  autoPdfGeneration: boolean;
}

interface AppSettings {
  language: 'en' | 'fr';
  currency: 'DZD';
  darkMode: boolean;
  notifications: boolean;
  company: CompanyProfile;
  invoice: InvoiceSettings;
}

interface AppSettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  updateCompanyProfile: (profile: Partial<CompanyProfile>) => void;
  updateInvoiceSettings: (settings: Partial<InvoiceSettings>) => void;
}

const defaultSettings: AppSettings = {
  language: 'fr',
  currency: 'DZD',
  darkMode: false,
  notifications: true,
  company: {
    name: 'Groupe HA',
    email: 'contact@groupeha.com',
    phone: '+213 XX XX XX XX',
    address: '123 Zone Industrielle, Alger, Algérie',
    taxId: '12345678901234',
    nis: '98765432109876',
    rc: 'RC-XXXX-XXXX',
    ai: 'AI-XXXX-XXXX',
    rib: 'RIB-XXXX-XXXX'
  },
  invoice: {
    nextNumber: 10001,
    paymentTerms: 30,
    defaultNotes: 'Merci pour votre confiance. Veuillez effectuer le paiement dans les délais spécifiés.',
    autoPdfGeneration: true
  }
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
        setSettings(prev => ({
          ...prev,
          company: {
            ...dbSettings.company,
            taxId: dbSettings.company.nif || '', // Map NIF to taxId
          },
          currency: 'DZD'
        }));
      } catch (error) {
        console.error('Error loading settings:', error);
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

  const updateInvoiceSettings = (invoiceSettings: Partial<InvoiceSettings>) => {
    setSettings(prev => ({
      ...prev,
      invoice: {
        ...prev.invoice,
        ...invoiceSettings
      }
    }));
  };

  return (
    <AppSettingsContext.Provider value={{
      settings,
      updateSettings: updateAppSettings,
      updateCompanyProfile,
      updateInvoiceSettings,
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