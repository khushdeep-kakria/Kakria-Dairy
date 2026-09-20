import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { OrderModel, OrderStatus } from '@/models/Order';
import { ensureDbInitialized } from '@/lib/dbInit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function PUT(
  req: NextRequest,
  { params }: { params: { orderNumber: string } }
) {
  try {
    const admin = getAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { orderNumber } = params;
    const body = await req.json();
    const { action, status, reason } = body;

    let dbAvailable = false;
    let order: any = null;
    try {
      await ensureDbInitialized();
      await connectToDatabase();
      dbAvailable = true;
      order = await OrderModel.findOne({
        orderNumber: { $regex: new RegExp(`^${orderNumber.trim()}$`, 'i') },
      });
    } catch (e) {
      console.warn('[Admin Order Update] DB unavailable, operating on memoryStore:', (e as Error).message);
    }

    const { findMemoryOrder, updateMemoryOrder } = await import('@/lib/memoryStore');
    if (!order) {
      order = findMemoryOrder(orderNumber);
    }

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const updates: any = {};

    if (action === 'verify_payment') {
      order.status = 'paid';
      order.verifiedAt = new Date();
      updates.status = 'paid';
      updates.verifiedAt = order.verifiedAt;
    } else if (action === 'reject_payment') {
      order.status = 'rejected';
      order.rejectedReason = reason || 'Payment could not be verified.';
      updates.status = 'rejected';
      updates.rejectedReason = order.rejectedReason;
    } else if (action === 'update_status' && status) {
      const validStatuses: OrderStatus[] = [
        'pending_payment',
        'verification_pending',
        'paid',
        'preparing',
        'out_for_delivery',
        'delivered',
        'rejected',
        'cancelled',
      ];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ success: false, error: 'Invalid order status' }, { status: 400 });
      }
      order.status = status;
      updates.status = status;
    } else {
      return NextResponse.json({ success: false, error: 'Invalid action or status' }, { status: 400 });
    }

    if (dbAvailable) {
      await OrderModel.updateOne({ orderNumber: order.orderNumber }, { $set: updates });
    }
    updateMemoryOrder(order.orderNumber, updates);

    return NextResponse.json({
      success: true,
      message: `Order ${orderNumber} updated successfully.`,
      order,
    });
  } catch (error) {
    console.error('[Admin Order Update PUT] Error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to update order' },
      { status: 500 }
    );
  }
}
