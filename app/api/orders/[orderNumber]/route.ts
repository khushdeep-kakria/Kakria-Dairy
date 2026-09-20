import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { OrderModel } from '@/models/Order';
import { ensureDbInitialized } from '@/lib/dbInit';
import {
  generateUpiUrl,
  generateUpiQrDataUrl,
  generateWhatsAppPaymentLink,
} from '@/lib/payment';
import { buildReceipt, buildWhatsAppLink } from '@/lib/orderUtils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(
  req: NextRequest,
  { params }: { params: { orderNumber: string } }
) {
  try {
    const { orderNumber } = params;
    if (!orderNumber) {
      return NextResponse.json({ success: false, error: 'Order number is required' }, { status: 400 });
    }

    let order: any = null;
    try {
      await ensureDbInitialized();
      await connectToDatabase();
      order = await OrderModel.findOne({ orderNumber }).lean();
    } catch (dbErr) {
      console.warn('[API /orders/[orderNumber]] DB query failed, checking memoryStore:', (dbErr as Error).message);
    }

    if (!order) {
      const { findMemoryOrder } = await import('@/lib/memoryStore');
      order = findMemoryOrder(orderNumber);
    }

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const upiDetails = {
      upiId: process.env.UPI_ID || '9915433324@naviaxis',
      payeeName: process.env.PAYEE_NAME || 'Kakria Dairy',
      amount: order.total,
      orderNumber: order.orderNumber,
    };

    const upiUrl = generateUpiUrl(upiDetails);
    const qrDataUrl = await generateUpiQrDataUrl(upiDetails);
    const receipt = buildReceipt(order);
    const whatsAppLink = buildWhatsAppLink(order);

    return NextResponse.json({
      success: true,
      order: {
        id: order.orderNumber,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        altPhone: order.altPhone,
        houseStreet: order.houseStreet,
        areaMohalla: order.areaMohalla,
        landmark: order.landmark,
        city: order.city || 'Kotkapura',
        state: order.state || 'Punjab',
        deliveryAddress: order.deliveryAddress,
        orderNotes: order.orderNotes,
        items: order.items,
        subtotal: order.subtotal,
        discount: order.discount,
        deliveryFee: order.deliveryFee,
        total: order.total,
        status: order.status,
        screenshotUrl: order.screenshotUrl || '',
        paymentMethod: order.paymentMethod,
        receipt,
        createdAt: order.createdAt,
      },
      upiId: upiDetails.upiId,
      upiUrl,
      qrDataUrl,
      whatsAppLink,
      receipt,
    });
  } catch (error) {
    console.error('[API /orders/[orderNumber] GET] Error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to fetch order' },
      { status: 500 }
    );
  }
}
