import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/utils/supabase-api";

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const { phone, content } = body;

    const { data, error } = await supabase
      .from("messages")
      .insert({
        phone,
        direction: "outbound",
        content,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ detail: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
