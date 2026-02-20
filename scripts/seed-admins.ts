/**
 * Seed 2 admin users by email.
 * Set SEED_ADMIN_EMAIL_1 and SEED_ADMIN_EMAIL_2 in .env.local (or env).
 * Run: npx tsx scripts/seed-admins.ts
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email1 = process.env.SEED_ADMIN_EMAIL_1;
const email2 = process.env.SEED_ADMIN_EMAIL_2;

if (!url || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
  );
  process.exit(1);
}

if (!email1 || !email2) {
  console.error("Set SEED_ADMIN_EMAIL_1 and SEED_ADMIN_EMAIL_2 in .env.local");
  process.exit(1);
}

const emails = [email1, email2].filter(Boolean);

async function main() {
  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: listData } = await supabase.auth.admin.listUsers({
    perPage: 1000,
  });
  const users = listData?.users ?? [];
  const toPromote = users.filter((u) => u.email && emails.includes(u.email));
  const ids = toPromote.map((u) => u.id);

  if (ids.length === 0) {
    console.log("No users found with emails:", emails);
    console.log("Sign up those users first, then run this script again.");
    process.exit(0);
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role: "admin", updated_at: new Date().toISOString() })
    .in("id", ids);

  if (error) {
    console.error("Failed to update profiles:", error.message);
    process.exit(1);
  }

  console.log("Set role=admin for:", toPromote.map((u) => u.email).join(", "));
}

main();
