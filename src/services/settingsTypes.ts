export interface CompanyProfile {
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

export interface AppSettings {
  id?: string;
  company: CompanyProfile;
  language: 'en' | 'fr';
  theme: 'light' | 'dark';
  currency: string;
  notifications?: boolean;
  darkMode?: boolean;
  user_id?: string;
}

// Database types
export interface DbAppSettings {
  id: string;
  user_id: string;
  company_name: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  company_nif?: string;
  company_nis?: string;
  company_rc?: string;
  company_ai?: string;
  company_rib?: string;
  company_logo?: string;
  language: 'en' | 'fr';
  theme: 'light' | 'dark';
  currency: string;
  notifications: boolean;
  dark_mode: boolean;
  created_at: string;
  updated_at?: string;
}

export const mapDbSettingsToSettings = (dbSettings: DbAppSettings): AppSettings => ({
  id: dbSettings.id,
  user_id: dbSettings.user_id,
  company: {
    name: dbSettings.company_name,
    address: dbSettings.company_address,
    phone: dbSettings.company_phone,
    email: dbSettings.company_email,
    nif: dbSettings.company_nif,
    nis: dbSettings.company_nis,
    rc: dbSettings.company_rc,
    ai: dbSettings.company_ai,
    rib: dbSettings.company_rib,
    logo: dbSettings.company_logo,
  },
  language: dbSettings.language,
  theme: dbSettings.theme,
  currency: dbSettings.currency,
  notifications: dbSettings.notifications,
  darkMode: dbSettings.dark_mode,
});

export const mapSettingsToDb = (settings: Partial<AppSettings>): Partial<DbAppSettings> => ({
  company_name: settings.company?.name,
  company_address: settings.company?.address,
  company_phone: settings.company?.phone,
  company_email: settings.company?.email,
  company_nif: settings.company?.nif,
  company_nis: settings.company?.nis,
  company_rc: settings.company?.rc,
  company_ai: settings.company?.ai,
  company_rib: settings.company?.rib,
  company_logo: settings.company?.logo,
  language: settings.language,
  theme: settings.theme,
  currency: settings.currency,
  notifications: settings.notifications,
  dark_mode: settings.darkMode,
});
