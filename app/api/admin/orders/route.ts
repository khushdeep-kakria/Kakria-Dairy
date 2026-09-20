import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { OrderModel } from '@/models/Order';
import { ensureDbInitialized } from '@/lib/dbInit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(req: NextRequest) {
  try {
    const admin = getAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    let orders: any[] = [];
    try {
      await ensureDbInitialized();
      await connectToDatabase();

      const { searchParams } = new URL(req.url);
      const status = searchParams.get('status');
      const search = searchParams.get('search');
      const dateFrom = searchParams.get('dateFrom');
      const dateTo = searchParams.get('dateTo');

      const query: Record<string, any> = {};

      if (status && status !== 'all') {
        query.status = status;
      }

      if (search && search.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        query.$or = [
          { orderNumber: regex },
          { customerName: regex },
          { customerPhone: regex },
          { utr: regex },
        ];
      }

      if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) {
          query.createdAt.$gte = new Date(dateFrom);
        }
        if (dateTo) {
          const endOfDay = new Date(dateTo);
          endOfDay.setHours(23, 59, 59, 999);
          query.createdAt.$lte = endOfDay;
        }
      }

      const limitParam = parseInt(searchParams.get('limit') || '50', 10);
      const limit = isNaN(limitParam) ? 50 : Math.min(Math.max(1, limitParam), 200);

      orders = await OrderModel.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
    } catch (e) {
      console.warn('[Admin Orders] DB unavailable, reading from memoryStore:', (e as Error).message);
      const { memoryOrders } = await import('@/lib/memoryStore');
      orders = memoryOrders.slice(0, 50);
    }

    return NextResponse.json(
      { success: true, orders },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        },
      }
    );
  } catch (error) {
    console.error('[Admin Orders GET] Error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
