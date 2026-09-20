import HomePageClient from '@/components/HomePageClient';
import { getLiveProducts } from '@/lib/getLiveProducts';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function HomePage() {
  const initialProducts = await getLiveProducts();
  return <HomePageClient initialProducts={initialProducts} />;
}
