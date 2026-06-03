import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

function clearSupabaseCookies(request, response) {
  request.cookies.getAll().forEach((cookie) => {
    if (cookie.name.startsWith("sb-")) {
      response.cookies.set(cookie.name, "", {
        path: "/",
        maxAge: 0,
      });
    }
  });
}

async function signOut(request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const origin = new URL(request.url).origin;
  const response = NextResponse.redirect(`${origin}/login`, { status: 303 });
  clearSupabaseCookies(request, response);

  return response;
}

export async function POST(request) {
  return signOut(request);
}

export async function GET(request) {
  return signOut(request);
}
