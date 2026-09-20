export interface NutritionInfo {
  fat: string;
  carbs: string;
  protein: string;
  calories: string;
}

export interface Product {
  id: string;
  category: 'ghee' | 'paneer' | 'khoya' | 'milk' | 'dahi' | 'lassi' | 'house-special' | 'white-butter';
  name_en: string;
  name_pa: string;
  description_en: string;
  description_pa: string;
  price_primary: number;
  price_half?: number;
  primary_unit_label_en: string;
  primary_unit_label_pa: string;
  half_unit_label_en?: string;
  half_unit_label_pa?: string;
  unit_type: 'kg' | 'litre' | 'piece' | 'cup';
  has_half: boolean;
  nutrition: NutritionInfo;
  image: string;
  is_bestseller?: boolean;
  inStock?: boolean;
  discontinued?: boolean;
}

export interface CartItem {
  productId: string;
  name_en: string;
  name_pa: string;
  category: string;
  size: 'full' | 'half';
  sizeLabel_en: string;
  sizeLabel_pa: string;
  weightInKg: number; // for calculating 5kg ghee promotion
  unitPrice: number;
  quantity: number;
  image: string;
}
