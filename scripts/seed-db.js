/**
 * One-time seed script for MongoDB Atlas
 * Usage: node scripts/seed-db.js
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Simple .env parser
function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    });
  }
}

loadEnv();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI is not defined in .env file.');
  process.exit(1);
}

const ProductSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name_en: { type: String, required: true },
    name_pa: { type: String, default: '' },
    description_en: { type: String, required: true },
    description_pa: { type: String, default: '' },
    category: { type: String, required: true },
    price_primary: { type: Number, required: true },
    price_half: { type: Number },
    primary_unit_label_en: { type: String, default: '1 unit' },
    primary_unit_label_pa: { type: String, default: '' },
    half_unit_label_en: { type: String, default: '' },
    half_unit_label_pa: { type: String, default: '' },
    unit_type: { type: String, default: 'piece' },
    has_half: { type: Boolean, default: false },
    image: { type: String, required: true },
    is_bestseller: { type: Boolean, default: false },
    nutrition: { type: Object, default: {} },
    inStock: { type: Boolean, default: true },
    discontinued: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const AdminSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully.');

    // 1. Seed Admin
    const adminUser = (process.env.ADMIN_USERNAME || 'admin').toLowerCase();
    const adminPass = process.env.ADMIN_PASSWORD || 'adminpassword123';

    const existingAdmin = await Admin.findOne({ username: adminUser });
    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(adminPass, salt);
      await Admin.create({ username: adminUser, passwordHash });
      console.log(`✅ Admin account created: ${adminUser}`);
    } else {
      console.log(`ℹ️ Admin account already exists: ${adminUser}`);
    }

    // 2. Seed Products
    const productsJsonPath = path.resolve(__dirname, '../data/products.json');
    if (fs.existsSync(productsJsonPath)) {
      const raw = fs.readFileSync(productsJsonPath, 'utf8');
      const products = JSON.parse(raw);
      console.log(`Found ${products.length} products in data/products.json`);

      let inserted = 0;
      let updated = 0;

      for (const p of products) {
        const updateData = {
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
          nutrition: p.nutrition || {},
          inStock: true,
          discontinued: false,
        };

        const res = await Product.updateOne({ id: p.id }, { $set: updateData }, { upsert: true });
        if (res.upsertedCount > 0) inserted++;
        else updated++;
      }

      console.log(`✅ Products sync complete: ${inserted} added, ${updated} updated.`);
    } else {
      console.warn('⚠️ data/products.json not found, skipping product seed.');
    }

    console.log('All done!');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
