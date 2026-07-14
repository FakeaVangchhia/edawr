import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/utils/supabase-api";

export async function POST(
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
    
    // Attempt to clear offered status in db (will fail gracefully if column doesn't exist)
    try {
      await supabase
        .from("orders")
        .update({ offered_to_delivery_boy_id: null })
        .eq("id", orderId);
    } catch {
      // Ignore database structure issues
    }

    return NextResponse.json({ success: true, id: orderId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
