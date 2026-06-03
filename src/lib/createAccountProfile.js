import { createAdminClient } from "@/lib/supabaseAdmin";

export async function createAccountProfile(user) {
  if (!user?.id || !user?.email) {
    return { error: new Error("User not found.") };
  }

  const metadata = user.user_metadata || {};
  const supabaseAdmin = createAdminClient();

  return supabaseAdmin.from("profiles").upsert(
    {
      id: user.id,
      username: metadata.username || "",
      email: user.email,
      phone: metadata.phone || "",
      gender: metadata.gender || "",
      role: metadata.role || "user",
      status: metadata.status || "active",
    },
    { onConflict: "id" }
  );
}
