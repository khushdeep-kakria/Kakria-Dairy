import { connectToDatabase } from '@/lib/mongodb';
import { AdminModel } from '@/models/Admin';
import { ProductModel } from '@/models/Product';
import { hashPassword } from '@/lib/auth';
import productsData from '@/data/products.json';

let isInitialized = false;
let lastAttempt = 0;
const RETRY_COOLDOWN_MS = 60000;

export async function ensureDbInitialized() {
  if (isInitialized) return;
  if (Date.now() - lastAttempt < RETRY_COOLDOWN_MS) return;
  lastAttempt = Date.now();

  try {
    await connectToDatabase();

    // 1. Seed Admin if none exists
    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'adminpassword123';

    const existingAdmin = await AdminModel.findOne({ username: adminUser.toLowerCase() });
    if (!existingAdmin) {
      const passwordHash = await hashPassword(adminPass);
      await AdminModel.create({
        username: adminUser.toLowerCase(),
        passwordHash,
      });
      console.log(`[DB Init] Seeded initial admin account: ${adminUser}`);
    }

    // 2. Seed Products if collection is empty
    const productCount = await ProductModel.countDocuments();
    if (productCount === 0 && Array.isArray(productsData) && productsData.length > 0) {
      console.log(`[DB Init] Seeding ${productsData.length} products from products.json into MongoDB...`);
      const docs = productsData.map((p) => ({
        id: p.id,
        name_en: p.name_en,
        name_pa: p.name_pa || '',
        description_en: p.description_en,
        description_pa: p.description_pa || '',
        category: p.category,
        price_primary: p.price_primary,
        price_half: p.price_half,
        primary_unit_label_en: p.primary_unit_label_en || '1 unit',
        primary_unit_label_pa: p.primary_unit_label_pa || '',
        half_unit_label_en: p.half_unit_label_en || '',
        half_unit_label_pa: p.half_unit_label_pa || '',
        unit_type: p.unit_type || 'piece',
        has_half: Boolean(p.has_half),
        image: p.image,
        is_bestseller: Boolean(p.is_bestseller),
        nutrition: p.nutrition || { fat: '—', carbs: '—', protein: '—', calories: '—' },
        inStock: true,
        discontinued: false,
      }));

      await ProductModel.insertMany(docs);
      console.log(`[DB Init] Successfully seeded ${docs.length} products.`);
    }

    isInitialized = true;
  } catch (err) {
    console.warn('[DB Init] Warning: DB initialization deferred or failed:', (err as Error).message);
  }
}
