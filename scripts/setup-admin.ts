import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const email = process.argv[2] || "tech@atriafoundation.org";
const password = process.argv[3] || "@helloworlD";
const orgName = process.argv[4] || "Atria Foundation";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  // Check if user exists
  const { data: existing } = await admin.auth.admin.listUsers();
  const user = existing.users.find((u) => u.email === email);

  if (user) {
    console.log(`User already exists: ${email} (id: ${user.id})`);
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
    console.log(`User created: ${email} (id: ${data.user.id})`);
  }

  // Fetch final user (existing or newly created)
  const { data: users } = await admin.auth.admin.listUsers();
  const targetUser = users.users.find((u) => u.email === email);
  if (!targetUser) {
    console.error("User not found after creation check");
    process.exit(1);
  }

  // Check if org already exists
  const { data: orgs } = await admin
    .from("organizations")
    .select("*")
    .eq("name", orgName)
    .maybeSingle();

  if (orgs) {
    console.log(`Org already exists: ${orgName} (id: ${orgs.id})`);

    // Ensure user is admin member
    const { data: member } = await admin
      .from("members")
      .select("*")
      .eq("org_id", orgs.id)
      .eq("user_id", targetUser.id)
      .maybeSingle();

    if (!member) {
      const { error: memberError } = await admin.from("members").insert({
        user_id: targetUser.id,
        org_id: orgs.id,
        role: "admin",
      });
      if (memberError) {
        console.error("Failed to add member:", memberError.message);
      } else {
        console.log(`Added ${email} as admin to ${orgName}`);
      }
    } else {
      // Update role to admin if not already
      if (member.role !== "admin") {
        await admin.from("members").update({ role: "admin" }).eq("id", member.id);
        console.log(`Updated ${email} role to admin in ${orgName}`);
      } else {
        console.log(`${email} is already admin of ${orgName}`);
      }
    }
  } else {
    // Create org
    const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const { data: newOrg, error: orgError } = await admin
      .from("organizations")
      .insert({ name: orgName, slug, created_by: targetUser.id })
      .select("id")
      .single();

    if (orgError) {
      console.error("Failed to create org:", orgError.message);
      process.exit(1);
    }
    console.log(`Org created: ${orgName} (id: ${newOrg.id})`);

    // Add creator as admin
    const { error: memberError } = await admin.from("members").insert({
      user_id: targetUser.id,
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
