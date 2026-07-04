import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/utils/supabase-api";

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { data: orders, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("id", { ascending: false });

    if (error) {
      return NextResponse.json({ detail: error.message }, { status: 400 });
    }

    const formattedOrders = (orders || []).map((order) => {
      const { order_items, ...rest } = order;
      return {
        ...rest,
        items: order_items || [],
      };
    });

    return NextResponse.json(formattedOrders);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
