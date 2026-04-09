import dotenv from 'dotenv';
dotenv.config();

const DB_MODE = process.env.DB_MODE || 'supabase';

let supabaseClient = null;
let pgPool = null;

async function initSupabase() {
  const { createClient } = await import('@supabase/supabase-js');
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SUPABASE_ANON_KEY');
  supabaseClient = createClient(url, key);
  return supabaseClient;
}

async function initPg() {
  const { default: pg } = await import('pg');
  const { Pool } = pg;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('Missing DATABASE_URL for PostgreSQL mode');
  pgPool = new Pool({ connectionString, ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false });
  return pgPool;
}

export async function getDb() {
  if (DB_MODE === 'postgres') {
    if (!pgPool) await initPg();
    return pgPool;
  }
  if (!supabaseClient) await initSupabase();
  return supabaseClient;
}

export function isPostgresMode() {
  return DB_MODE === 'postgres';
}

export function getSupabaseWithToken(accessToken) {
  if (DB_MODE === 'postgres') return null;
  const { createClient } = require('@supabase/supabase-js');
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}
