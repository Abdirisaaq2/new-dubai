import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { createAccountProfile } from "@/lib/createAccountProfile";

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: userError?.message || "User not found." },
      { status: 401 }
    );
  }

  const { error } = await createAccountProfile(user);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
