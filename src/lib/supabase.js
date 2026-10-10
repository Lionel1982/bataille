import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Si les variables manquent, on exporte null : le jeu reste jouable hors-ligne (vs IA).
export const supabase = (url && key) ? createClient(url, key) : null
export const online = !!supabase
