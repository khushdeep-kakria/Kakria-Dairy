import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ProductModel } from '@/models/Product';
import { ensureDbInitialized } from '@/lib/dbInit';
import { getAdminFromRequest } from '@/lib/auth';
import { getMemoryProducts } from '@/lib/memoryStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
};

export async function GET(req: NextRequest) {
  const admin = getAdminFromRequest(req);

  try {
    await ensureDbInitialized();
    await connectToDatabase();

    const query = admin ? {} : { discontinued: { $ne: true } };

    const products = await ProductModel.find(query)
      .select('id name_en name_pa description_en description_pa category price_primary price_half primary_unit_label_en primary_unit_label_pa half_unit_label_en half_unit_label_pa unit_type has_half image is_bestseller inStock discontinued nutrition')
      .sort({ category: 1, createdAt: 1 })
      .lean();

    if (products && products.length > 0) {
      return NextResponse.json(
        { success: true, products, isAdmin: Boolean(admin) },
        { headers: NO_CACHE_HEADERS }
      );
    }

    const resList = getMemoryProducts(Boolean(admin));
    return NextResponse.json(
      { success: true, products: resList, isAdmin: Boolean(admin) },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error) {
    console.warn('[API /products] DB unavailable, serving fallback data:', (error as Error).message);
    const resList = getMemoryProducts(Boolean(admin));

    return NextResponse.json(
      { success: true, products: resList, isAdmin: Boolean(admin) },
      { headers: NO_CACHE_HEADERS }
    );
  }
}
