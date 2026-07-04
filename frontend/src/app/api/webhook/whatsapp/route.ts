import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/utils/supabase-api";
import { Product } from "@/types";

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const { phone, message } = body;

    if (!phone || !message) {
      return NextResponse.json({ detail: "Phone and message are required." }, { status: 400 });
    }

    // 1. Save the inbound message
    await supabase.from("messages").insert({
      phone,
      direction: "inbound",
      content: message,
    });

    const normalizedMsg = message.trim().toLowerCase();

    // 2. Check if it's the welcome/catalog command
    if (normalizedMsg === "/dawr" || normalizedMsg === "dawr") {
      const reply = "Welcome back to eDawr! Here is our online catalog: https://edawr.in. You can select items and prepare your order there.";
      
      await supabase.from("messages").insert({
        phone,
        direction: "outbound",
        content: reply,
      });

      return NextResponse.json({ message: reply });
    }

    // 3. Parse message for orders
    // Format: "2 milk, 1 bread" or "2x milk; 1x bread"
    const parts = message.split(/[,;\n]+/);
    const parsedItems: { name: string; quantity: number }[] = [];

    for (const part of parts) {
      const trimmedPart = part.trim();
      if (!trimmedPart) continue;

      const match = trimmedPart.match(/^\s*(\d+)\s*(?:x|X)?\s+(.+?)\s*$/) || 
                    trimmedPart.match(/^\s*(.+?)\s+(?:x|X)?\s*(\d+)\s*$/);
      if (match) {
        let quantity = 1;
        let name = "";
        
        if (isNaN(Number(match[1]))) {
          // Format like "milk 2"
          name = match[1].trim();
          quantity = parseInt(match[2], 10);
        } else {
          // Format like "2 milk"
          quantity = parseInt(match[1], 10);
          name = match[2].trim();
        }
        
        if (name && quantity > 0) {
          parsedItems.push({ name, quantity });
        }
      }
    }

    if (parsedItems.length === 0) {
      const reply = "Sorry, we couldn't parse your message as an order. Reply with '/dawr' to view our catalog, or list products like: '2 milk, 1 bread'.";
      await supabase.from("messages").insert({
        phone,
        direction: "outbound",
        content: reply,
      });
      return NextResponse.json({ error: reply }, { status: 400 });
    }

    // Fetch all active products to match in memory
    const { data: products, error: prodErr } = await supabase
      .from("products")
      .select("*")
      .in("status", ["active", "Active"]);

    if (prodErr || !products) {
      return NextResponse.json({ detail: "Database error fetching products" }, { status: 500 });
    }

    const matchedItems: { product: Product; quantity: number }[] = [];
    const unmatchedNames: string[] = [];

    for (const item of parsedItems) {
      // Find a product that contains the item name (case-insensitive)
      const matchedProd = products.find(p => 
        p.name.toLowerCase().includes(item.name.toLowerCase()) ||
        item.name.toLowerCase().includes(p.name.toLowerCase())
      );

      if (matchedProd) {
        matchedItems.push({ product: matchedProd, quantity: item.quantity });
      } else {
        unmatchedNames.push(item.name);
      }
    }

    if (matchedItems.length === 0) {
      const reply = `Sorry, we couldn't find any matching products for: "${unmatchedNames.join(", ")}". Try checking the name on our catalog at https://edawr.in.`;
      await supabase.from("messages").insert({
        phone,
        direction: "outbound",
        content: reply,
      });
      return NextResponse.json({ error: reply }, { status: 404 });
    }

    // Create the order
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        customer_phone: phone,
        status: "Pending",
      })
      .select()
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ detail: "Database error creating order" }, { status: 500 });
    }

    let totalPrice = 0;
    const itemsDescription: string[] = [];

    // Create order items & update stock
    for (const item of matchedItems) {
      const itemPrice = Number(item.product.price);
      const itemTotal = itemPrice * item.quantity;
      totalPrice += itemTotal;
      itemsDescription.push(`${item.quantity}x ${item.product.name} (₹${itemPrice.toFixed(2)})`);

      // Insert order item
      await supabase.from("order_items").insert({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        name: item.product.name,
        price: itemPrice,
      });

      // Update product stock
      const newStock = Math.max(0, item.product.stock - item.quantity);
      await supabase
        .from("products")
        .update({ stock: newStock })
        .eq("id", item.product.id);
    }

    let reply = `Thank you! Your order #${order.id} has been received.\n\nItems:\n- ${itemsDescription.join("\n- ")}\n\nTotal: ₹${totalPrice.toFixed(2)}\n\nWe will assign a delivery boy shortly.`;
    
    if (unmatchedNames.length > 0) {
      reply += `\n\n(Note: We couldn't match these items: "${unmatchedNames.join(", ")}")`;
    }

    // Save reply message
    await supabase.from("messages").insert({
      phone,
      direction: "outbound",
      content: reply,
    });

    return NextResponse.json({ message: reply });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
