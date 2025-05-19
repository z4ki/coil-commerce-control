import React, { createContext, useContext, useState, useEffect } from 'react';

interface InvoicePrefix {
  value: string;
  isDefault: boolean;
}

interface InvoiceSettings {
  prefixes: InvoicePrefix[];
  defaultPrefix: string;
}

interface InvoiceSettingsContextType {
  settings: InvoiceSettings;
  addPrefix: (prefix: string) => void;
  removePrefix: (prefix: string) => void;
  setDefaultPrefix: (prefix: string) => void;
  getDefaultPrefix: () => string;
}

const defaultSettings: InvoiceSettings = {
  prefixes: [{ value: 'FAC', isDefault: true }],
  defaultPrefix: 'FAC',
};

const InvoiceSettingsContext = createContext<InvoiceSettingsContextType | undefined>(undefined);

export const InvoiceSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<InvoiceSettings>(() => {
    const savedSettings = localStorage.getItem('invoiceSettings');
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('invoiceSettings', JSON.stringify(settings));
  }, [settings]);

  const addPrefix = (prefix: string) => {
    if (!settings.prefixes.some(p => p.value === prefix)) {
      const isFirst = settings.prefixes.length === 0;
      setSettings(prev => ({
        ...prev,
        prefixes: [...prev.prefixes, { value: prefix, isDefault: isFirst }],
        defaultPrefix: isFirst ? prefix : prev.defaultPrefix,
      }));
    }
  };

  const removePrefix = (prefix: string) => {
    setSettings(prev => {
      const newPrefixes = prev.prefixes.filter(p => p.value !== prefix);
      const removedDefault = prefix === prev.defaultPrefix;
      return {
        ...prev,
        prefixes: newPrefixes,
        defaultPrefix: removedDefault && newPrefixes.length > 0 ? newPrefixes[0].value : prev.defaultPrefix,
      };
    });
  };

  const setDefaultPrefix = (prefix: string) => {
    setSettings(prev => ({
      ...prev,
      prefixes: prev.prefixes.map(p => ({
        ...p,
        isDefault: p.value === prefix,
      })),
      defaultPrefix: prefix,
    }));
  };

  const getDefaultPrefix = () => settings.defaultPrefix;

  return (
    <InvoiceSettingsContext.Provider value={{
      settings,
      addPrefix,
      removePrefix,
      setDefaultPrefix,
      getDefaultPrefix,
    }}>
      {children}
    </InvoiceSettingsContext.Provider>
  );
};

export const useInvoiceSettings = () => {
  const context = useContext(InvoiceSettingsContext);
  if (context === undefined) {
    throw new Error('useInvoiceSettings must be used within an InvoiceSettingsProvider');
  }
  return context;
}; 