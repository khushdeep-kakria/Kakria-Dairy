import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { getAdminFromRequest } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import { ProductModel } from '@/models/Product';
import { ensureDbInitialized } from '@/lib/dbInit';
import { deleteFromCloudinary } from '@/lib/cloudinary';
import { updateMemoryProduct, findMemoryProduct } from '@/lib/memoryStore';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

function revalidateAllProductPages() {
  try {
    revalidatePath('/', 'layout');
    revalidatePath('/');
    revalidatePath('/categories');
    revalidatePath('/cart');
    revalidatePath('/checkout');
    revalidatePath('/api/products');
  } catch (err) {
    console.warn('revalidatePath warning:', err);
  }
  try {
    revalidateTag('products');
  } catch (err) {
    console.warn('revalidateTag warning:', err);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = getAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    const updates: Record<string, any> = {};
    if (body.name_en !== undefined) updates.name_en = body.name_en.trim();
    if (body.name_pa !== undefined) updates.name_pa = body.name_pa.trim();
    if (body.description_en !== undefined) updates.description_en = body.description_en.trim();
    if (body.description_pa !== undefined) updates.description_pa = body.description_pa.trim();
    if (body.category !== undefined) updates.category = body.category.trim();
    if (body.price_primary !== undefined) updates.price_primary = Number(body.price_primary);
    if (body.price_half !== undefined) {
      updates.price_half =
        body.price_half !== null && body.price_half !== '' ? Number(body.price_half) : undefined;
    }
    if (body.primary_unit_label_en !== undefined) updates.primary_unit_label_en = body.primary_unit_label_en;
    if (body.primary_unit_label_pa !== undefined) updates.primary_unit_label_pa = body.primary_unit_label_pa;
    if (body.half_unit_label_en !== undefined) updates.half_unit_label_en = body.half_unit_label_en;
    if (body.half_unit_label_pa !== undefined) updates.half_unit_label_pa = body.half_unit_label_pa;
    if (body.unit_type !== undefined) updates.unit_type = body.unit_type;
    if (body.has_half !== undefined) updates.has_half = Boolean(body.has_half);
    if (typeof body.image === 'string' && body.image.trim()) updates.image = body.image.trim();
    if (body.is_bestseller !== undefined) updates.is_bestseller = Boolean(body.is_bestseller);
    if (body.nutrition !== undefined) updates.nutrition = body.nutrition;
    if (body.inStock !== undefined) updates.inStock = Boolean(body.inStock);
    if (body.discontinued !== undefined) updates.discontinued = Boolean(body.discontinued);

    let updatedMongoProduct = null;
    try {
      await ensureDbInitialized();
      await connectToDatabase();

      const product = await ProductModel.findOne({ id });
      if (product) {
        if (updates.image && product.image && product.image !== updates.image) {
          deleteFromCloudinary(product.image);
        }
        Object.assign(product, updates);
        await product.save();
        updatedMongoProduct = product.toObject ? product.toObject() : product;
      }
    } catch (dbErr) {
      console.warn('[Admin Product PUT] DB update warning:', (dbErr as Error).message);
    }

    // Always update in-memory store
    const memoryUpdated = updateMemoryProduct(id, updates);

    // Always persist to data/products.json on disk
    try {
      const filePath = path.join(process.cwd(), 'data', 'products.json');
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const list = JSON.parse(fileContent);
        const idx = list.findIndex((p: any) => p.id === id);
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...updates };
          fs.writeFileSync(filePath, JSON.stringify(list, null, 2), 'utf8');
        }
      }
    } catch (fsErr) {
      console.warn('[Admin Product PUT] Local file sync warning:', (fsErr as Error).message);
    }

    revalidateAllProductPages();

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully.',
      product: updatedMongoProduct || memoryUpdated,
    });
  } catch (error) {
    console.error('[Admin Product PUT] Error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = getAdminFromRequest(req);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    try {
      await ensureDbInitialized();
      await connectToDatabase();

      // Mark as discontinued (soft delete preserves historical orders)
      const product = await ProductModel.findOne({ id });
      if (product) {
        product.discontinued = true;
        await product.save();
      }
    } catch (dbErr) {
      console.warn('[Admin Product DELETE] DB warning:', (dbErr as Error).message);
    }

    updateMemoryProduct(id, { discontinued: true });

    try {
      const filePath = path.join(process.cwd(), 'data', 'products.json');
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const list = JSON.parse(fileContent);
        const idx = list.findIndex((p: any) => p.id === id);
        if (idx >= 0) {
          list[idx].discontinued = true;
          fs.writeFileSync(filePath, JSON.stringify(list, null, 2), 'utf8');
        }
      }
    } catch (fsErr) {
      console.warn('[Admin Product DELETE] File persistence error:', (fsErr as Error).message);
    }

    revalidateAllProductPages();

    return NextResponse.json({
      success: true,
      message: `Product marked as discontinued.`,
    });
  } catch (error) {
    console.error('[Admin Product DELETE] Error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Failed to discontinue product' },
      { status: 500 }
    );
  }
}
