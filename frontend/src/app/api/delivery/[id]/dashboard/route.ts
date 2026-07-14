import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/utils/supabase-api";

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ detail: "Invalid delivery boy ID." }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // 1. Fetch user (rider)
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ detail: "Delivery rider not found." }, { status: 404 });
    }

    if (user.role !== "delivery") {
      return NextResponse.json({ detail: "User is not a delivery rider." }, { status: 400 });
    }

    // Default base coordinates if not present in schema
    const riderLat = typeof user.base_latitude === "number" ? user.base_latitude : 23.7272;
    const riderLng = typeof user.base_longitude === "number" ? user.base_longitude : 92.7178;
    const serviceRadius = typeof user.service_radius_km === "number" ? user.service_radius_km : 10.0;

    // 2. Fetch all orders
    const { data: rawOrders, error: ordersError } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("id", { ascending: false });

    if (ordersError) {
      return NextResponse.json({ detail: ordersError.message }, { status: 400 });
    }

    const formattedOrders = (rawOrders || []).map((order) => {
      const { order_items, ...rest } = order;
      
      // Fallback values for schema items if they are missing in remote db schema
      const customerName = order.customer_name || `Customer (${order.customer_phone.slice(-4)})`;
      const customerAddress = order.customer_address || "Bazar Bawn, Aizawl";
      const customerLat = typeof order.customer_latitude === "number" ? order.customer_latitude : 23.7272 + ((order.id % 5) - 2) * 0.005;
      const customerLng = typeof order.customer_longitude === "number" ? order.customer_longitude : 92.7178 + ((order.id % 7) - 3) * 0.005;

      const distance = haversineDistance(riderLat, riderLng, customerLat, customerLng);

      return {
        ...rest,
        customer_name: customerName,
        customer_address: customerAddress,
        customer_latitude: customerLat,
        customer_longitude: customerLng,
        offered_distance_km: typeof order.offered_distance_km === "number" ? order.offered_distance_km : distance,
        offered_to_delivery_boy_id: order.offered_to_delivery_boy_id || null,
        items: order_items || [],
      };
    });

    // 3. Filter orders
    // Active order is assigned to this rider and in Assigned state
    const activeOrder = formattedOrders.find(
      (o) => o.delivery_boy_id === userId && o.status === "Assigned"
    ) || null;

    // Recent orders are delivered by this rider
    const recentOrders = formattedOrders.filter(
      (o) => o.delivery_boy_id === userId && o.status === "Delivered"
    ).slice(0, 10);

    // Incoming orders are Pending, inside service radius, and not already assigned or offered to someone else
    const incomingOrders = formattedOrders.filter((o) => {
      if (o.status !== "Pending") return false;
      
      // If order is targeted for another rider
      if (o.offered_to_delivery_boy_id !== null && o.offered_to_delivery_boy_id !== userId) {
        return false;
      }
      
      // Within service radius check
      return o.offered_distance_km <= serviceRadius;
    });

    return NextResponse.json({
      incoming_orders: incomingOrders,
      active_order: activeOrder,
      recent_orders: recentOrders,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
