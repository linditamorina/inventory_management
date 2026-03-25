import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Krijojmë një klient që punon saktë në Browser (Client Side)
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)