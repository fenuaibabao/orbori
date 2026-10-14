import { fetchPrices } from '@/lib/stripe';
import { Pricing } from './Pricing';

export const dynamic = 'force-dynamic';

export default async function PlusPage() {
  const prices = await fetchPrices();
  return <Pricing prices={prices} />;
}
