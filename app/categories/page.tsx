import CategoriesClient from '@/components/CategoriesClient';
import { getLiveProducts } from '@/lib/getLiveProducts';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function CategoriesPage() {
  const initialProducts = await getLiveProducts();
  return <CategoriesClient initialProducts={initialProducts} />;
}
