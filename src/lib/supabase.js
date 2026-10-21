import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://raxggstcrllcdibimlzk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_KS2mq4tYGsbYa9fdwIDCaA_8vUNQoRf';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
