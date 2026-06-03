import { NextResponse } from "next/server";
import { createClient as createBrowserSafeServerClient } from "@/lib/supabaseServer";
import { createAdminClient } from "@/lib/supabaseAdmin";

export async function GET() {
  const supabase = await createBrowserSafeServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: me } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (!me || me.role !== "admin" || me.status !== "active") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const adminClient = createAdminClient();

  const { data: profiles, error } = await adminClient
    .from("profiles")
    .select("id, username, email, phone, gender, role, status, created_at")
    .order("created_at", { ascending: false });

  const { data: authUsersData, error: authUsersError } =
    await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });

  if (error || authUsersError) {
    return NextResponse.json(
      { error: error?.message || authUsersError?.message },
      { status: 400 }
    );
  }

  const profilesById = new Map((profiles || []).map((profile) => [profile.id, profile]));
  const profileOnlyUsers = (profiles || []).filter(
    (profile) =>
      !authUsersData?.users?.some((authUser) => authUser.id === profile.id)
  );

  const authUsers = (authUsersData?.users || []).map((authUser) => {
    const profile = profilesById.get(authUser.id);
    const metadata = authUser.user_metadata || {};

    return {
      id: authUser.id,
      username:
        profile?.username ||
        metadata.username ||
        authUser.email?.split("@")[0] ||
        "Unknown User",
      email: profile?.email || authUser.email || "",
      phone: profile?.phone || metadata.phone || authUser.phone || "",
      gender: profile?.gender || metadata.gender || "",
      role: profile?.role || metadata.role || "user",
      status: profile?.status || metadata.status || "active",
      created_at: profile?.created_at || authUser.created_at,
    };
  });

  return NextResponse.json({ users: [...authUsers, ...profileOnlyUsers] });
}

export async function PATCH(request) {
  const supabase = await createBrowserSafeServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: me } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (!me || me.role !== "admin" || me.status !== "active") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, role, status } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "User id is required" }, { status: 400 });
  }

  const adminClient = createAdminClient();

  const { data: authUserData } = await adminClient.auth.admin.getUserById(
    String(id)
  );
  const authUser = authUserData?.user;

  const updates = { id: String(id) };
  if (authUser) {
    updates.id = authUser.id;
    updates.username =
      authUser.user_metadata?.username || authUser.email?.split("@")[0] || "";
    updates.email = authUser.email || "";
    updates.phone = authUser.user_metadata?.phone || authUser.phone || "";
    updates.gender = authUser.user_metadata?.gender || "";
  }
  if (role) updates.role = role;
  if (status) updates.status = status;

  const { data, error } = await adminClient
    .from("profiles")
    .upsert(updates, { onConflict: "id" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ user: data });
}
