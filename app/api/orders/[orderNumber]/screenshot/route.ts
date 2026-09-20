import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { OrderModel } from '@/models/Order';
import { uploadToCloudinary, isCloudinaryConfigured } from '@/lib/cloudinary';
import { ensureDbInitialized } from '@/lib/dbInit';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function POST(
  req: NextRequest,
  { params }: { params: { orderNumber: string } }
) {
  try {
    const { orderNumber } = params;
    if (!orderNumber) {
      return NextResponse.json({ success: false, error: 'Order number is required.' }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get('screenshot') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No screenshot file was provided.' }, { status: 400 });
    }

    // 1. File type validation (jpg, jpeg, png, webp)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file format. Only JPG, PNG, and WebP images are accepted.' },
        { status: 400 }
      );
    }

    // 2. File size validation: max 5 MB (5 * 1024 * 1024 bytes)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 5 MB. Please upload a smaller image.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let screenshotUrl = '';

    // 3. Upload to Cloudinary if configured
    if (isCloudinaryConfigured) {
      try {
        const uploaded = await uploadToCloudinary(buffer, 'kakria-payment-screenshots');
        if (uploaded) {
          screenshotUrl = uploaded;
        }
      } catch (cloudErr) {
        console.warn('[Screenshot Upload] Cloudinary upload error:', (cloudErr as Error).message);
      }
    }

    // 4. Fallback: Save locally into public/uploads/screenshots/ or base64 Data URL
    if (!screenshotUrl) {
      try {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'screenshots');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const ext = file.name.split('.').pop() || 'jpg';
        const filename = `${orderNumber}-${Date.now()}.${ext}`;
        const filePath = path.join(uploadsDir, filename);
        fs.writeFileSync(filePath, buffer);
        screenshotUrl = `/uploads/screenshots/${filename}`;
      } catch (fsErr) {
        console.warn('[Screenshot Upload] Local save error, using base64 data URI:', (fsErr as Error).message);
        screenshotUrl = `data:${file.type};base64,${buffer.toString('base64')}`;
      }
    }

    // 5. Update Order status to verification_pending and attach screenshotUrl
    let dbAvailable = false;
    try {
      await ensureDbInitialized();
      await connectToDatabase();
      dbAvailable = true;
    } catch (e) {
      console.warn('[Screenshot Upload] DB unavailable, updating memoryStore:', (e as Error).message);
    }

    const { findMemoryOrder, updateMemoryOrder } = await import('@/lib/memoryStore');
    let order: any = null;

    if (dbAvailable) {
      order = await OrderModel.findOne({ orderNumber });
    }

    if (!order) {
      order = findMemoryOrder(orderNumber);
    }

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found.' }, { status: 404 });
    }

    order.screenshotUrl = screenshotUrl;
    order.status = 'verification_pending';

    if (dbAvailable && typeof order.save === 'function') {
      await order.save();
    } else {
      updateMemoryOrder(orderNumber, { screenshotUrl, status: 'verification_pending' });
    }

    const savedOrder = typeof order.toObject === 'function' ? order.toObject() : order;

    return NextResponse.json({
      success: true,
      message: 'Screenshot uploaded successfully. Status updated to verification_pending.',
      screenshotUrl,
      status: 'verification_pending',
      orderNumber,
      order: savedOrder,
    });
  } catch (error) {
    console.error('[Screenshot Upload] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to upload screenshot.' },
      { status: 500 }
    );
  }
}
