// One-time setup: creates the admin login for the portal.
//
// Usage (after filling in .env.local and running `npm install`):
//   node --env-file=.env.local scripts/seed-admin.mjs YourNewPassword123!
//
// Logs in at /login with username "datphoto!" and the password you pass here.

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.argv[2] || "password";

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Run with: node --env-file=.env.local scripts/seed-admin.mjs <password>"
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey);
const email = "admin@dat-photo-command-center.internal";

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

if (error) {
  console.error("Failed to create admin user:", error.message);
  process.exit(1);
}

console.log(`Admin user created (id: ${data.user.id}).`);
console.log(`Log in at /login with username "datphoto!" and the password you just set.`);
if (password === "password") {
  console.warn(
    "\nWarning: you're using the placeholder password \"password\". Change it before going live."
  );
}
