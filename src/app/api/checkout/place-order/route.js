import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { createClient } from "@/lib/supabaseServer";

function getMissingSchemaColumn(error) {
  const message = error?.message || "";
  return message.match(/Could not find the '([^']+)' column/)?.[1] || null;
}

function removeColumn(payload, column) {
  if (Array.isArray(payload)) {
    return payload.map((item) => {
      const next = { ...item };
      delete next[column];
      return next;
    });
  }

  const next = { ...payload };
  delete next[column];
  return next;
}

async function insertWithSchemaFallback(admin, table, payload, { selectSingle = false } = {}) {
  let cleanPayload = payload;
  const removedColumns = new Set();

  for (let attempt = 0; attempt < 10; attempt += 1) {
    let query = admin.from(table).insert(cleanPayload);

    if (selectSingle) {
      query = query.select().single();
    }

    const result = await query;

    if (!result.error) {
      return result;
    }

    const missingColumn = getMissingSchemaColumn(result.error);

    if (!missingColumn || removedColumns.has(missingColumn)) {
      return result;
    }

    removedColumns.add(missingColumn);
    cleanPayload = removeColumn(cleanPayload, missingColumn);
  }

  return {
    data: null,
    error: new Error(`Schema columns are not matching ${table} table.`),
  };
}

async function cleanupPartialCheckout(admin, { orderId, invoiceNo }) {
  if (orderId) {
    await admin.from("order_items").delete().eq("order_id", orderId);
    await admin.from("orders").delete().eq("id", orderId);
  }

  if (invoiceNo) {
    await admin.from("payments").delete().eq("order_invoice_no", invoiceNo);
  }
}

export async function POST(request) {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Login ayaa loo baahan yahay." }, { status: 401 });
  }

  const { form } = await request.json();

  if (
    !form?.fullName ||
    !form?.phone ||
    !form?.address ||
    !form?.city ||
    !form?.payNumber ||
    !form?.transactionRef
  ) {
    return NextResponse.json(
      { error: "Fadlan buuxi dhammaan xogta muhiimka ah." },
      { status: 400 }
    );
  }

  const { data: cartItems, error: cartError } = await admin
    .from("cart_items")
    .select("*")
    .eq("user_id", user.id);

  if (cartError) {
    return NextResponse.json({ error: cartError.message }, { status: 400 });
  }

  if (!cartItems || cartItems.length === 0) {
    return NextResponse.json({ error: "Cart-kaagu waa madhan yahay." }, { status: 400 });
  }

  const productIds = [...new Set(cartItems.map((item) => item.product_id).filter(Boolean))];

  const { data: products, error: productsError } = await admin
    .from("products")
    .select("id, name, price, category, image_url, stock")
    .in("id", productIds);

  if (productsError) {
    return NextResponse.json({ error: productsError.message }, { status: 400 });
  }

  const productMap = new Map((products || []).map((product) => [String(product.id), product]));
  const requestedByProduct = new Map();

  for (const item of cartItems) {
    const product = productMap.get(String(item.product_id));
    const quantity = Number(item.quantity || 0);

    if (!product || quantity <= 0) {
      return NextResponse.json(
        { error: "Cart-ka waxaa ku jira product aan sax ahayn." },
        { status: 400 }
      );
    }

    requestedByProduct.set(
      String(item.product_id),
      Number(requestedByProduct.get(String(item.product_id)) || 0) + quantity
    );
  }

  for (const [productId, requestedQty] of requestedByProduct.entries()) {
    const product = productMap.get(productId);
    const stock = Number(product?.stock ?? 0);

    if (stock <= 0 || requestedQty > stock) {
      return NextResponse.json(
        {
          error: `${product?.name || "Product"} stock kuma filna. Available: ${stock}.`,
        },
        { status: 400 }
      );
    }
  }

  const subtotal = cartItems.reduce((sum, item) => {
    const product = productMap.get(String(item.product_id));
    return sum + Number(product?.price || 0) * Number(item.quantity || 0);
  }, 0);
  const delivery = cartItems.length > 0 ? 5 : 0;
  const total = subtotal + delivery;
  const invoiceNo = `INV-${Date.now()}`;

  const { data: orderData, error: orderError } = await insertWithSchemaFallback(
    admin,
    "orders",
    {
      user_id: user.id,
      invoice_no: invoiceNo,
      customer_name: form.fullName,
      customer_phone: form.phone,
      total_amount: total,
      payment_method: form.paymentMethod,
      payment_status: "Paid",
      order_status: "Pending",
    },
    { selectSingle: true }
  );

  if (orderError) {
    await cleanupPartialCheckout(admin, { invoiceNo });
    return NextResponse.json({ error: orderError.message }, { status: 400 });
  }

  const { error: paymentError } = await insertWithSchemaFallback(admin, "payments", {
    user_id: user.id,
    order_id: orderData.id,
    order_invoice_no: invoiceNo,
    invoice_no: invoiceNo,
    customer_name: form.fullName,
    customer_phone: form.phone,
    payment_method: form.paymentMethod,
    amount: total,
    transaction_ref: form.transactionRef,
    payment_status: "Paid",
  });

  if (paymentError) {
    await cleanupPartialCheckout(admin, { orderId: orderData.id, invoiceNo });
    return NextResponse.json({ error: paymentError.message }, { status: 400 });
  }

  const orderItemsPayload = cartItems.map((item) => {
    const product = productMap.get(String(item.product_id));
    const quantity = Number(item.quantity || 0);
    const price = Number(product?.price || 0);

    return {
      order_id: orderData.id,
      product_id: item.product_id,
      product_name: product?.name || "Product",
      image_url: product?.image_url,
      color: item.color,
      size: item.size,
      quantity,
      price,
      unit_price: price,
      total_price: price * quantity,
    };
  });

  const { error: orderItemsError } = await insertWithSchemaFallback(
    admin,
    "order_items",
    orderItemsPayload
  );

  if (orderItemsError) {
    await cleanupPartialCheckout(admin, { orderId: orderData.id, invoiceNo });
    return NextResponse.json({ error: orderItemsError.message }, { status: 400 });
  }

  for (const [productId, requestedQty] of requestedByProduct.entries()) {
    const product = productMap.get(productId);
    const nextStock = Math.max(0, Number(product?.stock ?? 0) - requestedQty);

    const { error: stockUpdateError } = await admin
      .from("products")
      .update({ stock: nextStock })
      .eq("id", productId);

    if (stockUpdateError) {
      await cleanupPartialCheckout(admin, { orderId: orderData.id, invoiceNo });
      return NextResponse.json({ error: stockUpdateError.message }, { status: 400 });
    }
  }

  const { error: cartDeleteError } = await admin
    .from("cart_items")
    .delete()
    .eq("user_id", user.id);

  if (cartDeleteError) {
    await cleanupPartialCheckout(admin, { orderId: orderData.id, invoiceNo });
    return NextResponse.json({ error: cartDeleteError.message }, { status: 400 });
  }

  return NextResponse.json({
    invoiceNo,
    transactionRef: form.transactionRef,
    amount: total,
    paymentMethod: form.paymentMethod,
    fullName: form.fullName,
  });
}
