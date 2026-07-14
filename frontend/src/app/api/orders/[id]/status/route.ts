import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/utils/supabase-api";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id, 10);
    if (isNaN(orderId)) {
      return NextResponse.json({ detail: "Invalid order ID." }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ detail: "status is required." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("orders")
      .update({
        status,
      })
      .eq("id", orderId)
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
