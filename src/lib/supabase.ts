import { createClient } from '@supabase/supabase-js';

import { cookieAuthStorage } from './cookie-auth-storage';

const SUPABASE_URL = 'https://nbfkibomkxvqyaoakmma.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZmtpYm9ta3h2cXlhb2FrbW1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MjY0NjIsImV4cCI6MjA2MTAwMjQ2Mn0._d4WZD7t7_7QwRf_2lTku_9xJsiv20WqN__7_vfI_tA';

// Session lives in cookies on .playwithprompts.com so the game and the course
// site (www) share one login. Same storage scheme on both apps.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: cookieAuthStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
