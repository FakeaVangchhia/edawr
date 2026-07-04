import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/utils/supabase-api";

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      return NextResponse.json({ detail: error.message }, { status: 400 });
    }

    return NextResponse.json(data || []);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from("products")
      .insert({
        name: body.name,
        sku: body.sku || null,
        barcode: body.barcode || null,
        category: body.category || "General",
        brand: body.brand || null,
        unit: body.unit || "unit",
        price: body.price || 0.00,
        cost_price: body.cost_price || 0.00,
        mrp: body.mrp || 0.00,
        stock: body.stock || 0,
        reorder_level: body.reorder_level || 0,
        status: body.status || "active",
        location: body.location || null,
        supplier_name: body.supplier_name || null,
        supplier_phone: body.supplier_phone || null,
        description: body.description || null,
        image_url: body.image_url || null,
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
