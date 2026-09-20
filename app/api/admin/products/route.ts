import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { ProductModel } from '@/models/Product';
import { ensureDbInitialized } from '@/lib/dbInit';
import productsFallback from '@/data/products.json';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(req: NextRequest) {
  try {
    const admin = getAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await ensureDbInitialized();
    await connectToDatabase();

    // Auto seed if empty
    const count = await ProductModel.countDocuments();
    if (count === 0 && Array.isArray(productsFallback) && productsFallback.length > 0) {
      console.log('[Admin Products GET] Products collection empty. Seeding catalog...');
      const docs = productsFallback.map((p) => ({
        ...p,
        name_pa: p.name_pa || '',
        description_pa: p.description_pa || '',
        primary_unit_label_en: p.primary_unit_label_en || '1 unit',
        primary_unit_label_pa: p.primary_unit_label_pa || '',
        half_unit_label_en: p.half_unit_label_en || '',
        half_unit_label_pa: p.half_unit_label_pa || '',
        unit_type: p.unit_type || 'piece',
        has_half: Boolean(p.has_half),
        is_bestseller: Boolean(p.is_bestseller),
        nutrition: p.nutrition || { fat: '—', carbs: '—', protein: '—', calories: '—' },
        inStock: true,
        discontinued: false,
      }));
      await ProductModel.insertMany(docs);
    }

    // Admin sees ALL products: in-stock, out-of-stock, and discontinued
    const products = await ProductModel.find().sort({ category: 1, createdAt: 1 }).lean();

    if (products && products.length > 0) {
      return NextResponse.json({ success: true, products });
    }

    const { getMemoryProducts } = await import('@/lib/memoryStore');
    return NextResponse.json({
      success: true,
      products: getMemoryProducts(true),
    });
  } catch (error) {
    console.warn('[Admin Products GET] DB unavailable, serving fallback data:', (error as Error).message);
    const { getMemoryProducts } = await import('@/lib/memoryStore');
    return NextResponse.json({
      success: true,
      products: getMemoryProducts(true),
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = getAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      id,
      name_en,
      name_pa,
      description_en,
      description_pa,
      category,
      price_primary,
      price_half,
      primary_unit_label_en,
      primary_unit_label_pa,
      half_unit_label_en,
      half_unit_label_pa,
      unit_type,
      has_half,
      image,
      is_bestseller,
      nutrition,
      inStock,
    } = body;

    if (!name_en || !description_en || !category || price_primary === undefined || !image) {
      return NextResponse.json(
        { success: false, error: 'Name, Description, Category, Price, and Image are required.' },
        { status: 400 }
      );
    }

    await ensureDbInitialized();
    await connectToDatabase();

    const cleanId =
      id && id.trim()
        ? id.trim().toLowerCase().replace(/\s+/g, '-')
        : `${category.trim().toLowerCase()}-${name_en.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;

    const existing = await ProductModel.findOne({ id: cleanId });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `Product with ID "${cleanId}" already exists.` },
        { status: 400 }
      );
    }

    const newProduct = await ProductModel.create({
      id: cleanId,
      name_en: name_en.trim(),
      name_pa: (name_pa || '').trim(),
      description_en: description_en.trim(),
      description_pa: (description_pa || '').trim(),
      category: category.trim(),
      price_primary: Number(price_primary),
      price_half: price_half !== undefined && price_half !== null && price_half !== '' ? Number(price_half) : undefined,
      primary_unit_label_en: primary_unit_label_en || '1 unit',
      primary_unit_label_pa: primary_unit_label_pa || '',
      half_unit_label_en: half_unit_label_en || '',
      half_unit_label_pa: half_unit_label_pa || '',
      unit_type: unit_type || 'kg',
      has_half: Boolean(has_half),
      image: image.trim(),
      is_bestseller: Boolean(is_bestseller),
      nutrition: nutrition || { fat: '—', carbs: '—', protein: '—', calories: '—' },
      inStock: inStock !== undefined ? Boolean(inStock) : true,
      discontinued: false,
    });

    try {
      const { revalidatePath, revalidateTag } = await import('next/cache');
      revalidatePath('/', 'layout');
      revalidatePath('/');
      revalidatePath('/categories');
      revalidatePath('/cart');
      revalidatePath('/checkout');
      revalidatePath('/api/products');
      try { revalidateTag('products'); } catch {}
    } catch (revalErr) {
      console.warn('Revalidation warning:', revalErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Product created successfully.',
      product: newProduct,
    });
  } catch (error) {
    console.error('[Admin Product POST] Error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to create product' },
      { status: 500 }
    );
  }
}
