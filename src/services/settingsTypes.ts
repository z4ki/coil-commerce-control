import { CompanySettings, AppSettings } from '@/types';
import { Database } from '@/types/supabase';

// Type aliases for better readability
export type DbAppSettings = Database['public']['Tables']['app_settings']['Row'];
export type DbAppSettingsInsert = Database['public']['Tables']['app_settings']['Insert'];
export type DbAppSettingsUpdate = Database['public']['Tables']['app_settings']['Update'];

// Mappers
export const mapDbSettingsToSettings = (dbSettings: DbAppSettings): AppSettings => ({
    id: dbSettings.id,
    company: {
        name: dbSettings.company_name,
        address: dbSettings.company_address,
        phone: dbSettings.company_phone,
        email: dbSettings.company_email,
        nif: dbSettings.company_nif || undefined,
        nis: dbSettings.company_nis || undefined,
        rc: dbSettings.company_rc || undefined,
        ai: dbSettings.company_ai || undefined,
        rib: dbSettings.company_rib || undefined,
        logo: dbSettings.company_logo || undefined,
    },
    language: dbSettings.language,
    theme: dbSettings.theme,
    currency: dbSettings.currency,
    notifications: dbSettings.notifications,
    darkMode: dbSettings.dark_mode,
    user_id: dbSettings.user_id
});

export const mapSettingsToDb = (settings: Partial<AppSettings>): DbAppSettingsUpdate => ({
    company_name: settings.company?.name,
    company_address: settings.company?.address,
    company_phone: settings.company?.phone,
    company_email: settings.company?.email,
    company_nif: settings.company?.nif || null,
    company_nis: settings.company?.nis || null,
    company_rc: settings.company?.rc || null,
    company_ai: settings.company?.ai || null,
    company_rib: settings.company?.rib || null,
    company_logo: settings.company?.logo || null,
    language: settings.language,
    theme: settings.theme,
    currency: settings.currency,
    notifications: settings.notifications,
    dark_mode: settings.darkMode,
    user_id: settings.user_id
});
