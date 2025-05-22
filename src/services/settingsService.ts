import { supabase } from '@/integrations/supabase/client';
import { AppSettings, CompanySettings } from '@/types';

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
  };
  currency?: string;
}

// Default settings
const defaultCompanySettings: CompanySettings = {
  name: 'My Company',
  address: 'Company Address',
  phone: 'Phone Number',
  email: 'company@example.com',
  nif: '',
  nis: '',
  rc: '',
  ai: ''
};

const defaultSettings: AppSettings = {
  company: defaultCompanySettings,
  language: 'fr',
  theme: 'light',
  currency: 'DZD'
};

export const getSettings = async (): Promise<AppSettings> => {
  try {
    // Fetch settings
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No settings found, create default settings
        return createDefaultSettings();
      }
      console.error('Error fetching settings:', error);
      return defaultSettings;
    }
    
    const mappedSettings = mapSettingsFromDb(data);
    
    // Ensure all required company settings fields exist
    return {
      ...mappedSettings,
      company: {
        ...defaultCompanySettings,
        ...mappedSettings.company
      }
    };
  } catch (error) {
    console.error('Error in getSettings:', error);
    return defaultSettings;
  }
};

export const updateSettings = async (settings: UpdateSettingsInput): Promise<AppSettings> => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('settings')
      .update({
        company_name: settings.company?.name,
        company_address: settings.company?.address,
        company_phone: settings.company?.phone,
        company_email: settings.company?.email,
        company_logo: settings.company?.logo,
        currency: settings.currency,
        nif: settings.company?.nif,
        nis: settings.company?.nis,
        rc: settings.company?.rc,
        ai: settings.company?.ai,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
    
    return mapSettingsFromDb(data);
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
      ai: data.ai || defaultCompanySettings.ai
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
      tax_rate: 0.19,
      currency: defaultSettings.currency
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
