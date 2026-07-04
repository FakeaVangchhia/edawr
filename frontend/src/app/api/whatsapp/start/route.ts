import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/utils/supabase-api";

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json({ detail: "Phone number is required." }, { status: 400 });
    }

    const content = "Welcome to eDawr! You can open our catalog here: https://edawr.in. Or reply with your order (e.g. '2 milk, 1 bread').";

    const { error } = await supabase
      .from("messages")
      .insert({
        phone,
        direction: "outbound",
        content,
      });

    if (error) {
      return NextResponse.json({ detail: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, phone });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
