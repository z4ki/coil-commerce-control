
import { supabase } from '@/integrations/supabase/client';
import { AppSettings } from '@/types';

export const getSettings = async (): Promise<AppSettings | null> => {
  // Get current user id first
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('user_id', session.user.id)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching settings:', error);
    throw error;
  }
  
  if (!data) return null;
  
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
    ai: data.ai,
    user_id: data.user_id
  };
};

export const createSettings = async (settings: Omit<AppSettings, 'id'>): Promise<AppSettings> => {
  const { data, error } = await supabase
    .from('settings')
    .insert({
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
      ai: settings.ai
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating settings:', error);
    throw error;
  }
  
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
    ai: data.ai,
    user_id: data.user_id
  };
};

export const updateSettings = async (settings: Partial<Omit<AppSettings, 'id'>>): Promise<AppSettings> => {
  // Get current user id first
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('No authenticated user');
  
  // Check if settings exist for this user
  const { data: existingSettings } = await supabase
    .from('settings')
    .select('id')
    .eq('user_id', session.user.id)
    .maybeSingle();
  
  let result;
  
  if (existingSettings) {
    const updateData: any = {};
    
    if (settings.companyName !== undefined) updateData.company_name = settings.companyName;
    if (settings.companyAddress !== undefined) updateData.company_address = settings.companyAddress;
    if (settings.companyPhone !== undefined) updateData.company_phone = settings.companyPhone;
    if (settings.companyEmail !== undefined) updateData.company_email = settings.companyEmail;
    if (settings.companyLogo !== undefined) updateData.company_logo = settings.companyLogo;
    if (settings.taxRate !== undefined) updateData.tax_rate = settings.taxRate;
    if (settings.currency !== undefined) updateData.currency = settings.currency;
    if (settings.nif !== undefined) updateData.nif = settings.nif;
    if (settings.nis !== undefined) updateData.nis = settings.nis;
    if (settings.rc !== undefined) updateData.rc = settings.rc;
    if (settings.ai !== undefined) updateData.ai = settings.ai;
    
    const { data, error } = await supabase
      .from('settings')
      .update(updateData)
      .eq('id', existingSettings.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
    
    result = data;
  } else {
    // Create settings if they don't exist
    const newSettings = {
      company_name: settings.companyName || 'Company Name',
      company_address: settings.companyAddress || 'Address',
      company_phone: settings.companyPhone || 'Phone',
      company_email: settings.companyEmail || 'email@example.com',
      company_logo: settings.companyLogo,
      tax_rate: settings.taxRate || 0.19,
      currency: settings.currency || 'DZD',
      nif: settings.nif,
      nis: settings.nis,
      rc: settings.rc,
      ai: settings.ai
    };
    
    const { data, error } = await supabase
      .from('settings')
      .insert(newSettings)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating settings:', error);
      throw error;
    }
    
    result = data;
  }
  
  return {
    id: result.id,
    companyName: result.company_name,
    companyAddress: result.company_address,
    companyPhone: result.company_phone,
    companyEmail: result.company_email,
    companyLogo: result.company_logo,
    taxRate: result.tax_rate,
    currency: result.currency,
    nif: result.nif,
    nis: result.nis,
    rc: result.rc,
    ai: result.ai,
    user_id: result.user_id
  };
};
