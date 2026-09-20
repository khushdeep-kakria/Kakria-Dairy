import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ProductModel } from '@/models/Product';
import { OrderModel } from '@/models/Order';
import { ensureDbInitialized } from '@/lib/dbInit';
import {
  generateUpiUrl,
  generateUpiQrDataUrl,
} from '@/lib/payment';
import { formatAddress, buildReceipt, buildWhatsAppLink } from '@/lib/orderUtils';
import productsFallback from '@/data/products.json';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

interface OrderItemInput {
  productId: string;
  size: 'full' | 'half';
  quantity: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerName,
      customerPhone,
      altPhone,
      houseStreet,
      areaMohalla,
      landmark,
      city,
      state,
      isKotkapuraConfirmed,
      deliveryAddress,
      orderNotes,
      items,
    } = body;

    // 1. Validation
    if (!customerName || typeof customerName !== 'string' || !customerName.trim()) {
      return NextResponse.json({ success: false, error: 'Customer name is required' }, { status: 400 });
    }
    const cleanPhone = (customerPhone || '').replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return NextResponse.json({ success: false, error: 'A valid 10-digit phone number is required' }, { status: 400 });
    }

    // Enforce Kotkapura town rule strictly on the server
    const normalizedCity = (city || '').trim().toLowerCase();
    if (normalizedCity !== 'kotkapura' || !isKotkapuraConfirmed) {
      return NextResponse.json(
        { success: false, error: 'Sorry, we deliver only within Kotkapura town' },
        { status: 400 }
      );
    }

    // Require houseStreet and areaMohalla
    if (!houseStreet || typeof houseStreet !== 'string' || !houseStreet.trim()) {
      return NextResponse.json(
        { success: false, error: 'House/Street is required' },
        { status: 400 }
      );
    }
    if (!areaMohalla || typeof areaMohalla !== 'string' || !areaMohalla.trim()) {
      return NextResponse.json(
        { success: false, error: 'Area/Mohalla is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Cart is empty' }, { status: 400 });
    }

    const cleanHouseStreet = houseStreet.trim();
    const cleanAreaMohalla = areaMohalla.trim();
    const cleanLandmark = (landmark || '').trim();
    const cleanCity = 'Kotkapura';
    const cleanState = 'Punjab';

    const formattedAddress = formatAddress({
      houseStreet: cleanHouseStreet,
      areaMohalla: cleanAreaMohalla,
      landmark: cleanLandmark,
      city: cleanCity,
      state: cleanState,
      deliveryAddress: deliveryAddress?.trim(),
    });

    const productIds = items.map((i: OrderItemInput) => i.productId);
    let dbProducts: any[] = [];
    try {
      await ensureDbInitialized();
      await connectToDatabase();
      dbProducts = await ProductModel.find({ id: { $in: productIds } }).lean();
    } catch (dbErr) {
      console.warn('[API /orders POST] DB lookup failed, falling back to products.json:', (dbErr as Error).message);
    }

    if (!dbProducts || dbProducts.length === 0) {
      dbProducts = productsFallback.filter((p) => productIds.includes(p.id)) as any;
    }

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    // 3. Verify stock, discontinued & build verified items list
    const verifiedItems = [];
    let subtotal = 0;
    let gheeWeightKg = 0;
    let gheeSubtotal = 0;

    for (const item of (items as OrderItemInput[])) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { success: false, error: `Product not found: ${item.productId}` },
          { status: 400 }
        );
      }

      if (product.discontinued) {
        return NextResponse.json(
          { success: false, error: `"${product.name_en}" has been discontinued.` },
          { status: 400 }
        );
      }

      if (product.inStock === false) {
        return NextResponse.json(
          { success: false, error: `"${product.name_en}" is currently out of stock.` },
          { status: 400 }
        );
      }

      const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
      const isHalf = item.size === 'half' && Boolean(product.has_half);

      // Server determines price - never trust client
      const unitPrice =
        isHalf && product.price_half ? product.price_half : product.price_primary;
      const linePrice = unitPrice * qty;

      subtotal += linePrice;

      if (product.category === 'ghee') {
        const weight = (isHalf ? 0.5 : 1.0) * qty;
        gheeWeightKg += weight;
        gheeSubtotal += linePrice;
      }

      verifiedItems.push({
        productId: product.id,
        name_en: product.name_en,
        name_pa: product.name_pa || '',
        size: isHalf ? ('half' as const) : ('full' as const),
        sizeLabel_en: isHalf ? (product.half_unit_label_en || '500g') : (product.primary_unit_label_en || '1 kg'),
        sizeLabel_pa: isHalf ? (product.half_unit_label_pa || '500 ਗ੍ਰਾਮ') : (product.primary_unit_label_pa || '1 ਕਿੱਲੋ'),
        unitPrice,
        quantity: qty,
        price: linePrice,
        image: product.image,
      });
    }

    // 4. Server-side discount & delivery computation
    const isFreeDelivery = subtotal >= 300 || subtotal === 0;
    const deliveryFee = isFreeDelivery ? 0 : 50;

    const hasGheeDiscount = gheeWeightKg >= 5;
    const gheeDiscount = hasGheeDiscount ? Math.round(gheeSubtotal * 0.05) : 0;

    const hasOrderDiscount = subtotal >= 1000;
    let orderDiscount = 0;

    if (hasGheeDiscount && hasOrderDiscount) {
      const nonGheeSubtotal = subtotal - gheeSubtotal;
      orderDiscount = Math.round(nonGheeSubtotal * 0.05);
    } else if (hasOrderDiscount) {
      orderDiscount = Math.round(subtotal * 0.05);
    }

    const totalDiscount = gheeDiscount + orderDiscount;
    const grandTotal = Math.max(0, subtotal - totalDiscount + deliveryFee);

    // 5. Generate Order Number with non-guessable nano ID
    const nanoPart = Math.random().toString(36).substring(2, 8).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderNumber = `KD-${Date.now().toString(36).toUpperCase()}-${nanoPart}`;

    // 6. Save order in MongoDB with status "pending_payment" (with memory fallback if DB auth fails)
    let orderDoc: any;
    try {
      orderDoc = await OrderModel.create({
        orderNumber,
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        altPhone: (altPhone || '').trim(),
        houseStreet: cleanHouseStreet,
        areaMohalla: cleanAreaMohalla,
        landmark: cleanLandmark,
        city: cleanCity,
        state: cleanState,
        deliveryAddress: formattedAddress,
        orderNotes: (orderNotes || '').trim(),
        items: verifiedItems,
        subtotal,
        discount: totalDiscount,
        deliveryFee,
        total: grandTotal,
        status: 'pending_payment',
        paymentMethod: 'UPI QR',
      });
    } catch (dbErr) {
      console.warn('[API /orders POST] MongoDB save failed, saving to in-memory store:', (dbErr as Error).message);
      const now = new Date();
      orderDoc = {
        _id: `mem-${Date.now()}`,
        orderNumber,
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        altPhone: (altPhone || '').trim(),
        houseStreet: cleanHouseStreet,
        areaMohalla: cleanAreaMohalla,
        landmark: cleanLandmark,
        city: cleanCity,
        state: cleanState,
        deliveryAddress: formattedAddress,
        orderNotes: (orderNotes || '').trim(),
        items: verifiedItems,
        subtotal,
        discount: totalDiscount,
        deliveryFee,
        total: grandTotal,
        status: 'pending_payment',
        paymentMethod: 'UPI QR',
        createdAt: now,
        updatedAt: now,
      };
      const { addMemoryOrder } = await import('@/lib/memoryStore');
      addMemoryOrder(orderDoc);
    }

    // 7. Generate UPI payment URL & Dynamic QR Code
    const upiDetails = {
      upiId: process.env.UPI_ID || '9915433324@naviaxis',
      payeeName: process.env.PAYEE_NAME || 'Kakria Dairy',
      amount: grandTotal,
      orderNumber,
    };

    const upiUrl = generateUpiUrl(upiDetails);
    const qrDataUrl = await generateUpiQrDataUrl(upiDetails);
    const receipt = buildReceipt(orderDoc);
    const whatsAppLink = buildWhatsAppLink(orderDoc);

    return NextResponse.json({
      success: true,
      orderNumber,
      total: grandTotal,
      status: orderDoc.status,
      upiId: upiDetails.upiId,
      upiUrl,
      qrDataUrl,
      whatsAppLink,
      receipt,
      order: {
        orderNumber: orderDoc.orderNumber,
        customerName: orderDoc.customerName,
        customerPhone: orderDoc.customerPhone,
        altPhone: orderDoc.altPhone,
        houseStreet: orderDoc.houseStreet,
        areaMohalla: orderDoc.areaMohalla,
        landmark: orderDoc.landmark,
        city: orderDoc.city,
        state: orderDoc.state,
        deliveryAddress: orderDoc.deliveryAddress,
        items: orderDoc.items,
        total: orderDoc.total,
        status: orderDoc.status,
        receipt,
        createdAt: orderDoc.createdAt,
      },
    });
  } catch (error) {
    console.error('[API /orders POST] Error creating order:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to create order' },
      { status: 500 }
    );
  }
}
