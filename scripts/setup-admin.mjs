import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

// Parse .env file manually
const envContent = readFileSync(".env", "utf-8");
const env: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing env vars. Check .env for NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const email = process.argv[2] || "tech@atriafoundation.org";
const password = process.argv[3] || "@helloworlD";
const orgName = process.argv[4] || "Atria Foundation";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  // Check if user exists
  const { data: existing } = await admin.auth.admin.listUsers();
  const existingUser = existing.users.find((u) => u.email === email);
  let userId: string;

  if (existingUser) {
    console.log(`User already exists: ${email} (id: ${existingUser.id})`);
    userId = existingUser.id;
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) {
      console.error("Failed to create user:", error.message);
      process.exit(1);
    }
    userId = data.user.id;
    console.log(`User created: ${email} (id: ${userId})`);
  }

  // Check if org already exists
  const { data: orgs } = await admin
    .from("organizations")
    .select("*")
    .eq("name", orgName)
    .maybeSingle();

  if (orgs) {
    console.log(`Org already exists: ${orgName} (id: ${orgs.id})`);

    const { data: member } = await admin
      .from("members")
      .select("*")
      .eq("org_id", orgs.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (!member) {
      const { error: memberError } = await admin.from("members").insert({
        user_id: userId,
        org_id: orgs.id,
        role: "admin",
      });
      if (memberError) {
        console.error("Failed to add member:", memberError.message);
      } else {
        console.log(`Added ${email} as admin to ${orgName}`);
      }
    } else if (member.role !== "admin") {
      await admin.from("members").update({ role: "admin" }).eq("id", member.id);
      console.log(`Updated ${email} role to admin in ${orgName}`);
    } else {
      console.log(`${email} is already admin of ${orgName}`);
    }
  } else {
    const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const { data: newOrg, error: orgError } = await admin
      .from("organizations")
      .insert({ name: orgName, slug, created_by: userId })
      .select("id")
      .single();

    if (orgError) {
      console.error("Failed to create org:", orgError.message);
      process.exit(1);
    }
    console.log(`Org created: ${orgName} (id: ${newOrg.id})`);

    const { error: memberError } = await admin.from("members").insert({
      user_id: userId,
      org_id: newOrg.id,
      role: "admin",
    });
    if (memberError) {
      console.error("Failed to add admin member:", memberError.message);
      process.exit(1);
    }
    console.log(`Added ${email} as admin to ${orgName}`);
  }

  console.log("Done. You can now log in at /login");
}

main();
