import { createClient } from 'npm:@supabase/supabase-js@2.118.0';
import { createDeleteHandler } from './handler.mjs';

// Supabase injects these values. No privileged key is stored in the app source.
Deno.serve(createDeleteHandler({
  createClient,
  env: Object.fromEntries([
    'SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEYS', 'SUPABASE_SECRET_KEYS',
    'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY',
  ].map(name => [name, Deno.env.get(name) ?? ''])),
}));
