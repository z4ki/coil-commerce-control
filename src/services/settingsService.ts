import { supabase } from '@/integrations/supabase/client';
import type { AppSettings, CompanyProfile } from '@/types/index';
import { tauriApi } from '@/lib/tauri-api';
import { core } from '@tauri-apps/api';


interface DbSettings {
  id: string;
  company_name: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  company_logo: string | null;
  tax_rate: number;
  currency: string;
  nif: string | null;
  nis: string | null;
  rc: string | null;
  ai: string | null;
  rib: string | null;
  updated_at: string | null;
}

interface UpdateSettingsInput {
  company?: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    logo?: string;
    nif?: string;
    nis?: string;
    rc?: string;
    ai?: string;
    rib?: string;
  };
  currency?: string;
}

// Default settings
const defaultCompanySettings: CompanyProfile = {
  name: 'My Company',
  address: 'Company Address',
  phone: 'Phone Number',
  email: 'company@example.com',
  nif: '',
  nis: '',
  rc: '',
  ai: '',
  rib: ''
};

const defaultSettings: AppSettings = {
  company: defaultCompanySettings,
  language: 'fr',
  theme: 'light',
  currency: 'DZD'
};

export const getSettings = async (): Promise<AppSettings> => {
  try {
    const data = await tauriApi.settings.get();
    const d = data as any;
    // Defensive mapping: always return a complete AppSettings object
    return {
      company: {
        name: d.company_name || '',
        address: d.company_address || '',
        phone: d.company_phone || '',
        email: d.company_email || '',
        nif: d.nif || '',
        nis: d.nis || '',
        rc: d.rc || '',
        ai: d.ai || '',
        rib: d.rib || '',
        taxId: d.nif || '',
        logo: d.company_logo || ''
      },
      language: d.language || 'fr',
      theme: d.theme || 'light',
      currency: d.currency || 'DZD',
      notifications: d.notifications ?? true,
      darkMode: d.dark_mode ?? false,
      user_id: d.user_id || '',
      id: d.id || ''
    };
  } catch (error) {
    console.error('Error in getSettings:', error);
    // Always return a complete default object
    return {
      company: {
        name: '',
        address: '',
        phone: '',
        email: '',
        nif: '',
        nis: '',
        rc: '',
        ai: '',
        rib: '',
        taxId: '',
        logo: ''
      },
      language: 'fr',
      theme: 'light',
      currency: 'DZD',
      notifications: true,
      darkMode: false,
      user_id: '',
      id: ''
    };
  }
};

export const updateSettings = async (settings: UpdateSettingsInput): Promise<AppSettings> => {
  try {
    // Flatten company fields for backend
    const updates: any = {
      currency: settings.currency,
    };
    if (settings.company) {
      if (settings.company.name !== undefined) updates.company_name = settings.company.name;
      if (settings.company.address !== undefined) updates.company_address = settings.company.address;
      if (settings.company.phone !== undefined) updates.company_phone = settings.company.phone;
      if (settings.company.email !== undefined) updates.company_email = settings.company.email;
      if (settings.company.logo !== undefined) updates.company_logo = settings.company.logo;
      if (settings.company.nif !== undefined) updates.nif = settings.company.nif;
      if (settings.company.nis !== undefined) updates.nis = settings.company.nis;
      if (settings.company.rc !== undefined) updates.rc = settings.company.rc;
      if (settings.company.ai !== undefined) updates.ai = settings.company.ai;
      if (settings.company.rib !== undefined) updates.rib = settings.company.rib;
    }
    const updated = await tauriApi.settings.update(updates);
    return updated as AppSettings;
  } catch (error) {
    console.error('Error in updateSettings:', error);
    throw error;
  }
};

// Helper function to map database fields to AppSettings type
const mapSettingsFromDb = (data: DbSettings): AppSettings => {
  return {
    company: {
      name: data.company_name || defaultCompanySettings.name,
      address: data.company_address || defaultCompanySettings.address,
      phone: data.company_phone || defaultCompanySettings.phone,
      email: data.company_email || defaultCompanySettings.email,
      logo: data.company_logo || undefined,
      nif: data.nif || defaultCompanySettings.nif,
      nis: data.nis || defaultCompanySettings.nis,
      rc: data.rc || defaultCompanySettings.rc,
      ai: data.ai || defaultCompanySettings.ai,
      rib: data.rib || defaultCompanySettings.rib
    },
    language: 'fr',
    theme: 'light',
    currency: data.currency || defaultSettings.currency
  };
};

// Create default settings
const createDefaultSettings = async (): Promise<AppSettings> => {
  try {
    const defaultDbSettings = {
      company_name: defaultCompanySettings.name,
      company_address: defaultCompanySettings.address,
      company_phone: defaultCompanySettings.phone,
      company_email: defaultCompanySettings.email,
      company_logo: null,
      tax_rate: 0.19,
      currency: defaultSettings.currency,
      nif: defaultCompanySettings.nif,
      nis: defaultCompanySettings.nis,
      rc: defaultCompanySettings.rc,
      ai: defaultCompanySettings.ai,
      rib: defaultCompanySettings.rib
    };
    
    const { data, error } = await supabase
      .from('settings')
      .insert(defaultDbSettings)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating default settings:', error);
      return defaultSettings;
    }
    
    return mapSettingsFromDb(data);
  } catch (error) {
    console.error('Error in createDefaultSettings:', error);
    return defaultSettings;
  }
};

export const exportDb = async (exportPath?: string): Promise<string> => {
  try {
    // Call the Tauri command for exporting the database
    return await (tauriApi as any).settings.export_db(exportPath);
  } catch (error) {
    console.error('Error exporting database:', error);
    throw error;
  }
};

export const importDb = async ({ import_path }: { import_path: string }): Promise<string> => {
  try {
    return await core.invoke('import_db', { import_path });
  } catch (error) {
    console.error('Error importing database:', error);
    throw error;
  }
};
