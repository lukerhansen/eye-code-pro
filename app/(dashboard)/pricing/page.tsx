import { getStripePrices, getStripeProducts } from '@/lib/payments/stripe';
import { PricingCard } from './pricing-card';
import { SUBSCRIPTION_CONFIG } from '@/lib/config/subscription';

// Prices are fresh for one hour max
export const revalidate = 3600;

export default async function PricingPage() {
  const [prices, products] = await Promise.all([
    getStripePrices(),
    getStripeProducts(),
  ]);

  const basePlan = products.find((product) => product.name === 'Base');
  const basePrice = prices.find((price) => price.productId === basePlan?.id);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Start Your CodeSelect Journey
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Optimize your ophthalmology or optometry practice with our comprehensive insurance code platform. 
          Save time, reduce denials, and maximize your revenue.
        </p>
        <p className="text-lg text-gray-600 mt-4">
          Select the number of doctors in your practice to get started.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          A subscription is required to add doctors to your practice.
        </p>
      </div>
      
      <div className="flex justify-center">
        <div className="max-w-md">
          <PricingCard
            name="Professional"
            price={basePrice?.unitAmount || 1}
            interval={basePrice?.interval || 'month'}
            trialDays={SUBSCRIPTION_CONFIG.FREE_TRIAL_DAYS}
            features={[
              'Unlimited team members',
              'All insurance code lookups',
              'Real-time fee calculations',
              'Insurance acceptance tracking',
              'Custom fee schedules',
              'Priority support',
            ]}
            priceId={basePrice?.id}
            isPopular={true}
          />
        </div>
      </div>
      
      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Built for Eye Care Professionals
        </h2>
        <p className="text-lg text-gray-600">
          CodeSelect is designed specifically for ophthalmologists and optometrists who want to streamline their coding workflow and reduce administrative burden.
        </p>
      </div>
    </main>
  );
}
