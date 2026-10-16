import { BETA } from '@/lib/beta';
import { fetchPrices, foundingLeft, FOUNDING } from '@/lib/stripe';
import { Pricing } from './Pricing';

export const dynamic = 'force-dynamic';

export default async function PlusPage() {
  const [prices, left] = await Promise.all([fetchPrices(), foundingLeft()]);
  return <Pricing prices={prices} beta={BETA} founding={left === null ? null : { left, total: FOUNDING.total }} />;
}
