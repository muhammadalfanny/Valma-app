import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qnmsasncjxykljccwvhg.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_WqoE_vDKbSZff9VVP-EJWw_glo_UkU4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
