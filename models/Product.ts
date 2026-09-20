import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProductNutrition {
  fat: string;
  carbs: string;
  protein: string;
  calories: string;
}

export interface IProduct extends Document {
  id: string;
  name_en: string;
  name_pa?: string;
  description_en: string;
  description_pa?: string;
  category: string;
  price_primary: number;
  price_half?: number;
  primary_unit_label_en: string;
  primary_unit_label_pa?: string;
  half_unit_label_en?: string;
  half_unit_label_pa?: string;
  unit_type?: string;
  has_half?: boolean;
  image: string;
  is_bestseller?: boolean;
  nutrition?: IProductNutrition;
  inStock: boolean;
  discontinued: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name_en: { type: String, required: true, trim: true },
    name_pa: { type: String, trim: true, default: '' },
    description_en: { type: String, required: true, trim: true },
    description_pa: { type: String, trim: true, default: '' },
    category: { type: String, required: true, trim: true, index: true },
    price_primary: { type: Number, required: true, min: 0 },
    price_half: { type: Number, min: 0 },
    primary_unit_label_en: { type: String, default: '1 unit' },
    primary_unit_label_pa: { type: String, default: '' },
    half_unit_label_en: { type: String, default: '' },
    half_unit_label_pa: { type: String, default: '' },
    unit_type: { type: String, default: 'piece' },
    has_half: { type: Boolean, default: false },
    image: { type: String, required: true },
    is_bestseller: { type: Boolean, default: false },
    nutrition: {
      fat: { type: String, default: '—' },
      carbs: { type: String, default: '—' },
      protein: { type: String, default: '—' },
      calories: { type: String, default: '—' },
    },
    inStock: { type: Boolean, default: true, index: true },
    discontinued: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
  }
);

ProductSchema.index({ discontinued: 1, category: 1, createdAt: 1 });
ProductSchema.index({ category: 1, createdAt: 1 });

export const ProductModel: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
