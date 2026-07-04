import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/utils/supabase-api";

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ detail: "No file was uploaded." }, { status: 400 });
    }

    // Try to ensure the bucket exists
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      if (!buckets?.some((b) => b.name === "product-images")) {
        await supabase.storage.createBucket("product-images", {
          public: true,
        });
      }
    } catch {
      // Ignore privilege errors for listing/creating buckets
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ detail: uploadError.message }, { status: 400 });
    }

    const { data: publicUrlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName);

    return NextResponse.json({ image_url: publicUrlData.publicUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
