import { supabase } from '@/integrations/supabase/client';
import { AppSettings } from '@/types';

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

export const getSettings = async (): Promise<AppSettings | null> => {
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
      throw error;
    }
    
    return mapSettingsFromDb(data);
  } catch (error) {
    console.error('Error in getSettings:', error);
    throw error;
  }
};

export const updateSettings = async (settings: Partial<AppSettings>): Promise<AppSettings> => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('settings')
      .update({
        company_name: settings.companyName,
        company_address: settings.companyAddress,
        company_phone: settings.companyPhone,
        company_email: settings.companyEmail,
        company_logo: settings.companyLogo,
        tax_rate: settings.taxRate,
        currency: settings.currency,
        nif: settings.nif,
        nis: settings.nis,
        rc: settings.rc,
        ai: settings.ai,
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
    id: data.id,
    companyName: data.company_name,
    companyAddress: data.company_address,
    companyPhone: data.company_phone,
    companyEmail: data.company_email,
    companyLogo: data.company_logo,
    taxRate: data.tax_rate,
    currency: data.currency,
    nif: data.nif,
    nis: data.nis,
    rc: data.rc,
    ai: data.ai
  };
};

// Create default settings
const createDefaultSettings = async (): Promise<AppSettings> => {
  try {
    const defaultSettings = {
      company_name: 'My Company',
      company_address: 'Company Address',
      company_phone: 'Phone Number',
      company_email: 'company@example.com',
      tax_rate: 0.19,
      currency: 'DZD'
    };
    
    const { data, error } = await supabase
      .from('settings')
      .insert(defaultSettings)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating default settings:', error);
      throw error;
    }
    
    return mapSettingsFromDb(data);
  } catch (error) {
    console.error('Error in createDefaultSettings:', error);
    throw error;
  }
};
