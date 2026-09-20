import mongoose from 'mongoose';
import { ProductModel } from '@/models/Product';
import { Product } from '@/types/product';
import fs from 'fs';
import path from 'path';

export async function getLiveProducts(): Promise<Product[]> {
  try {
    // If MongoDB is actively connected, query live documents
    if (mongoose.connection.readyState === 1) {
      const products = await ProductModel.find({ discontinued: { $ne: true } })
        .select(
          'id name_en name_pa description_en description_pa category price_primary price_half primary_unit_label_en primary_unit_label_pa half_unit_label_en half_unit_label_pa unit_type has_half image is_bestseller inStock discontinued nutrition'
        )
        .sort({ category: 1, createdAt: 1 })
        .lean();

      if (products && products.length > 0) {
        return JSON.parse(JSON.stringify(products));
      }
    }
  } catch (err) {
    // Database query failed; fall back immediately
  }

  // Instant zero-delay read from data/products.json on disk
  try {
    const filePath = path.join(process.cwd(), 'data', 'products.json');
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, 'utf8');
      const list = JSON.parse(fileData);
      return list.filter((p: any) => !p.discontinued);
    }
  } catch (fileErr) {
    console.warn('[getLiveProducts] Disk read fallback error:', fileErr);
  }

  return [];
}
