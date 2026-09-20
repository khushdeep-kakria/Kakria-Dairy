import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth';
import { uploadToCloudinary, isCloudinaryConfigured } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function POST(req: NextRequest) {
  try {
    const admin = getAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await req.json();
      const { imageBase64, imageUrl } = body;

      if (imageUrl && !imageBase64) {
        return NextResponse.json({
          success: true,
          url: imageUrl,
          source: 'direct_url',
        });
      }

      if (imageBase64) {
        let uploadedUrl = '';
        if (isCloudinaryConfigured) {
          try {
            uploadedUrl = await uploadToCloudinary(imageBase64);
          } catch (cloudErr) {
            console.warn('[Product Image Upload JSON] Cloudinary error, falling back to local:', (cloudErr as Error).message);
          }
        }

        if (!uploadedUrl) {
          try {
            const fs = await import('fs');
            const path = await import('path');
            const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'products');
            if (!fs.existsSync(uploadsDir)) {
              fs.mkdirSync(uploadsDir, { recursive: true });
            }
            const buffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
            const match = imageBase64.match(/^data:image\/(\w+);base64,/);
            const ext = match ? match[1] : 'png';
            const filename = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
            fs.writeFileSync(path.join(uploadsDir, filename), buffer);
            uploadedUrl = `/uploads/products/${filename}`;
          } catch (localErr) {
            console.warn('[Product Image Upload JSON] Local write failed:', (localErr as Error).message);
            uploadedUrl = imageBase64;
          }
        }

        return NextResponse.json({
          success: true,
          url: uploadedUrl,
          source: uploadedUrl.includes('cloudinary') ? 'cloudinary' : 'local',
        });
      }
    }

    // Handle multipart form-data
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      const directUrl = formData.get('imageUrl') as string | null;

      if (directUrl) {
        return NextResponse.json({
          success: true,
          url: directUrl,
          source: 'direct_url',
        });
      }

      if (!file) {
        return NextResponse.json(
          { success: false, error: 'No image file or URL provided.' },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      let uploadedUrl = '';

      if (isCloudinaryConfigured) {
        try {
          uploadedUrl = await uploadToCloudinary(buffer);
        } catch (cloudErr) {
          console.warn('[Product Image Upload] Cloudinary error, falling back to local:', (cloudErr as Error).message);
        }
      }

      if (!uploadedUrl) {
        try {
          const fs = await import('fs');
          const path = await import('path');
          const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'products');
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          const ext = file.name ? file.name.split('.').pop() : 'jpg';
          const filename = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext || 'jpg'}`;
          fs.writeFileSync(path.join(uploadsDir, filename), buffer);
          uploadedUrl = `/uploads/products/${filename}`;
        } catch (localErr) {
          console.warn('[Product Image Upload] Local write failed, using data URI:', (localErr as Error).message);
          uploadedUrl = `data:${file.type};base64,${buffer.toString('base64')}`;
        }
      }

      return NextResponse.json({
        success: true,
        url: uploadedUrl,
        source: uploadedUrl.includes('cloudinary') ? 'cloudinary' : 'local',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Unsupported Content-Type' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Product Image Upload] Error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Image upload failed' },
      { status: 500 }
    );
  }
}
