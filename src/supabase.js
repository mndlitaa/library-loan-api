require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const { SUPABASE_URL, SUPABASE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('PERINGATAN: SUPABASE_URL / SUPABASE_KEY belum diisi di environment.');
}

const supabase = createClient(SUPABASE_URL || 'http://localhost', SUPABASE_KEY || 'missing-key');

module.exports = supabase;
