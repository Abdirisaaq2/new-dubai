import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, email, phone, role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/login");
  }

  if (profile.status !== "active") {
    redirect("/login");
  }

  if (profile.role === "admin") {
    redirect("/admin");
  }

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("created_at", { ascending: false });

  /*
    IMPORTANT:
    Dashboard-ka wuxuu soo qaadanayaa slide kasta oo is_active = true ah.
    active_slide khasab ma aha.
    Kan ugu dambeeyay ayaa DashboardClient dooranaya.
  */
  const { data: slides, error: slidesError } = await supabase
    .from("slides")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (slidesError) {
    console.log("Slides error:", slidesError.message);
  }

  console.log("Slides data:", slides);

  return (
    <DashboardClient
      profile={profile}
      products={products || []}
      categories={categories || []}
      slides={slides || []}
    />
  );
}