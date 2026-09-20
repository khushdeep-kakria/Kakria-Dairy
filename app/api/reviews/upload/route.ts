import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary, isCloudinaryConfigured } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    // Validate size (max 3 MB)
    if (file.size > 3 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 3 MB limit. Please select a smaller photo.' },
        { status: 400 }
      );
    }

    // Validate mime type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files (JPEG, PNG, WEBP) are allowed.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (isCloudinaryConfigured) {
      const url = await uploadToCloudinary(buffer, 'kakria_reviews');
      return NextResponse.json({ success: true, url });
    }

    // Fallback data URI if Cloudinary is not configured
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;
    return NextResponse.json({ success: true, url: base64 });
  } catch (err: any) {
    console.error('Review upload error:', err);
    return NextResponse.json({ error: 'Failed to upload photo.' }, { status: 500 });
  }
}
