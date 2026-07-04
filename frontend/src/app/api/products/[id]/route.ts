import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/utils/supabase-api";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from("products")
      .update({
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
      .eq("id", id)
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ detail: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
