// Promotes an existing profile to 'admin' using the Supabase service role key
// (bypasses RLS, which normally blocks employees from changing their own role).
// Usage: npm run make-admin -- you@example.com
import { createClient } from '@supabase/supabase-js';

const email = process.argv[2];

if (!email) {
  console.error('Usage: npm run make-admin -- <email>');
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in your environment (.env.local).'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const { data, error } = await supabase
  .from('profiles')
  .update({ role: 'admin' })
  .eq('email', email)
  .select('email, role')
  .single();

if (error) {
  console.error(`Failed to promote ${email}:`, error.message);
  process.exit(1);
}

console.log(`${data.email} is now role: ${data.role}`);
