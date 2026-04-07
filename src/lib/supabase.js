import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://afpijasmegfmpnchoawz.supabase.co'
const supabaseKey = 'sb_publishable_tAEUvLXZlg45oN60pyed_Q_faia-wiR'

export const supabase = createClient(supabaseUrl, supabaseKey)
