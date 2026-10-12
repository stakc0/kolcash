import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qpporyusxezornnwqxsl.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6InFwcG9yeXVzeGV6b3JubndxeHNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3Mjk3MDAsImV4cCI6MjEwMjMwNTcwMH0.9j7x8-9PX-nq1FNDq_ghdQHxTuNVq8_CxilsqhJcppk';

export const kolcashDb = createClient(supabaseUrl, supabaseAnonKey);
