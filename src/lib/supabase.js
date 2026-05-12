import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vikhckrerxqomlwvsdhh.supabase.co'
const supabaseKey = 'sb_publishable_leKqRra1C2YtNixw2vD5VA_b6OUWPx9'

export const supabase = createClient(supabaseUrl, supabaseKey)
