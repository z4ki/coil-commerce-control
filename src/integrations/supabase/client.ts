// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://xibdzvwbvewshnquzmfl.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpYmR6dndidmV3c2hucXV6bWZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2MjM1NTIsImV4cCI6MjA2MjE5OTU1Mn0.tzVcS1J-Ay0ItjJ94_y_Jss1y8bl4i40mc5sHxOnIb0";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

// Create a Supabase client with auth enabled
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});