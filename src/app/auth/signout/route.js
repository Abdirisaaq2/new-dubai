import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

export async function POST(request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const origin = new URL(request.url).origin;
  return NextResponse.redirect(`${origin}/login`);
}