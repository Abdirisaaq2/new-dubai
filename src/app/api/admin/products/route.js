import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { createClient } from "@/lib/supabaseServer";

async function requireActiveAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: NextResponse.json({ error: "Login ayaa loo baahan yahay." }, { status: 401 }),
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin" || profile.status !== "active") {
    return {
      error: NextResponse.json({ error: "Admin access ayaa loo baahan yahay." }, { status: 403 }),
    };
  }

  const db = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient()
    : supabase;

  return { db, supabase, usingServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) };
}

function cleanProductPayload(payload) {
  const name = String(payload?.name || "").trim();
  const category = String(payload?.category || "").trim();
  const imageUrl = String(payload?.image_url || "").trim();
  const price = Number(payload?.price);
  const stock = Number(payload?.stock);

  if (!name || !category || !imageUrl || Number.isNaN(price) || Number.isNaN(stock)) {
    return { error: "Fadlan buuxi Product Name, Price, Category, Stock iyo Image." };
  }

  return {
    product: {
      name,
      category,
      image_url: imageUrl,
      price,
      stock,
    },
  };
}

export async function POST(request) {
  const { db, supabase, usingServiceRole, error: authError } = await requireActiveAdmin();
  if (authError) return authError;

  const body = await request.json().catch(() => ({}));
  const { product, error } = cleanProductPayload(body);

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  let { data, error: insertError } = await db
    .from("products")
    .insert([product])
    .select()
    .single();

  if (insertError && usingServiceRole) {
    const retry = await supabase
      .from("products")
      .insert([product])
      .select()
      .single();
    data = retry.data;
    insertError = retry.error;
  }

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  return NextResponse.json({ product: data });
}

export async function GET() {
  const { db, supabase, usingServiceRole, error: authError } = await requireActiveAdmin();
  if (authError) return authError;

  let { data, error } = await db
    .from("products")
    .select("id, name, price, category, stock, image_url, created_at")
    .order("created_at", { ascending: false });

  if (error && usingServiceRole) {
    const retry = await supabase
      .from("products")
      .select("id, name, price, category, stock, image_url, created_at")
      .order("created_at", { ascending: false });
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ products: data || [] });
}

export async function PATCH(request) {
  const { db, supabase, usingServiceRole, error: authError } = await requireActiveAdmin();
  if (authError) return authError;

  const body = await request.json().catch(() => ({}));
  const id = body?.id;
  const { product, error } = cleanProductPayload(body);

  if (!id) {
    return NextResponse.json({ error: "Product id ayaa maqan." }, { status: 400 });
  }

  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  let { data, error: updateError } = await db
    .from("products")
    .update(product)
    .eq("id", id)
    .select()
    .single();

  if (updateError && usingServiceRole) {
    const retry = await supabase
      .from("products")
      .update(product)
      .eq("id", id)
      .select()
      .single();
    data = retry.data;
    updateError = retry.error;
  }

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({ product: data });
}

export async function DELETE(request) {
  const { db, supabase, usingServiceRole, error: authError } = await requireActiveAdmin();
  if (authError) return authError;

  const { id } = await request.json().catch(() => ({}));

  if (!id) {
    return NextResponse.json({ error: "Product id ayaa maqan." }, { status: 400 });
  }

  let { error } = await db.from("products").delete().eq("id", id);

  if (error && usingServiceRole) {
    const retry = await supabase.from("products").delete().eq("id", id);
    error = retry.error;
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
