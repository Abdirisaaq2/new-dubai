import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { createClient } from "@/lib/supabaseServer";

const BUCKET_NAME = "product-images";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function cleanFileName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function ensureBucket(admin) {
  const { data } = await admin.storage.getBucket(BUCKET_NAME);

  if (data) return;

  await admin.storage.createBucket(BUCKET_NAME, {
    public: true,
    fileSizeLimit: MAX_FILE_SIZE,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  });
}

export async function POST(request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Login ayaa loo baahan yahay." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin" || profile.status !== "active") {
    return NextResponse.json({ error: "Admin access ayaa loo baahan yahay." }, { status: 403 });
  }

  const storageClient = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createAdminClient()
    : supabase;

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "Fadlan dooro image." }, { status: 400 });
  }

  if (!file.type?.startsWith("image/")) {
    return NextResponse.json({ error: "File-ku waa inuu image noqdaa." }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Image-ku waa inuu ka yaraadaa 5MB." }, { status: 400 });
  }

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    await ensureBucket(storageClient);
  }

  const safeName = cleanFileName(file.name) || "product-image";
  const extension = safeName.includes(".") ? safeName.split(".").pop() : "jpg";
  const path = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const { error } = await storageClient.storage.from(BUCKET_NAME).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    console.log(error);
    return NextResponse.json({ error: "Image upload ma shaqayn." }, { status: 400 });
  }

  const {
    data: { publicUrl },
  } = storageClient.storage.from(BUCKET_NAME).getPublicUrl(path);

  return NextResponse.json({ url: publicUrl });
}
