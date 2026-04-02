/**
 * RLS verification script — step 3 of the RLS hardening checklist.
 *
 * What it does:
 *   Creates a Supabase client using the ANON key (the same key the application
 *   uses at runtime) and attempts to INSERT a dummy row into `public.observations`.
 *
 * Expected result:
 *   The INSERT is rejected with a Postgres RLS violation (error code 42501 or a
 *   "permission denied" message). That proves the anon role has no INSERT
 *   privilege and the RLS policy is working correctly.
 *
 * If the INSERT succeeds:
 *   RLS is misconfigured. The anon role has more permissions than intended.
 *   Stop and escalate to the CTO before proceeding.
 *
 * Usage:
 *   node scripts/verify-rls-insert.mjs
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from
 * .env.local in the project root. No extra dependencies required.
 */

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ── Resolve project root ──────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// ── Parse .env.local manually (no dotenv dependency) ─────────────────────────

function loadEnvLocal(projectRoot) {
  const envPath = join(projectRoot, '.env.local');
  let raw;
  try {
    raw = readFileSync(envPath, 'utf8');
  } catch {
    throw new Error(
      `.env.local not found at ${envPath}. ` +
        'Copy .env.local.example to .env.local and fill in your Supabase values.'
    );
  }

  const vars = {};
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    // Skip blank lines and comments
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    vars[key] = value;
  }
  return vars;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const env = loadEnvLocal(projectRoot);

  const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
  const supabaseAnonKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      'ERROR: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing from .env.local.'
    );
    process.exit(1);
  }

  console.log('Supabase URL:', supabaseUrl);
  console.log('Using anon key (first 12 chars):', supabaseAnonKey.slice(0, 12) + '...');
  console.log('');
  console.log('Attempting INSERT into public.observations with the anon key...');
  console.log('');

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Minimal dummy row — only id is required to attempt the insert.
  // We don't need valid data; we just need the server to evaluate RLS.
  const { data, error } = await supabase
    .from('observations')
    .insert({ id: '00000000-0000-0000-0000-000000000000', study_title: 'RLS test — delete me' });

  console.log('--- Raw Supabase response ---');
  console.log('data:', data);
  console.log('error:', error);
  console.log('----------------------------');
  console.log('');

  if (error) {
    const msg = error.message ?? '';
    const code = error.code ?? '';

    if (
      msg.toLowerCase().includes('permission denied') ||
      msg.toLowerCase().includes('violates row-level security') ||
      code === '42501'
    ) {
      console.log('PASS — INSERT was correctly blocked by RLS.');
      console.log('The anon role cannot write to observations. RLS is working as intended.');
    } else {
      console.log('UNEXPECTED ERROR — INSERT failed, but not due to an RLS violation.');
      console.log('Investigate the error above before proceeding.');
      process.exit(1);
    }
  } else {
    console.log('FAIL — INSERT succeeded. The anon role has write access to observations.');
    console.log('RLS is misconfigured. Escalate to the CTO before proceeding.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
