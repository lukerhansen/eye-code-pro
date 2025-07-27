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


  // Try to find a product named 'Base' first
  let basePlan = products.find((product) => product.name === 'Base');

  // If no 'Base' product, try to find one with 'doctor' in the name (case-insensitive)
  if (!basePlan) {
    basePlan = products.find((product) =>
      product.name.toLowerCase().includes('doctor') ||
      product.name.toLowerCase().includes('per doctor')
    );
  }

  // If still no match, just use the first product
  if (!basePlan && products.length > 0) {
    basePlan = products[0];
  }

  // Find the price for the selected product
  const basePrice = basePlan ? prices.find((price) => price.productId === basePlan.id) : null;

  // If we found a product but no price, try to use the product's default price
  const actualPrice = basePrice || (prices.length > 0 ? prices[0] : null);

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="absolute inset-0 bg-grid-gray-100/50 [mask-image:radial-gradient(ellipse_at_center,white,transparent_70%)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-teal-50 text-teal-700 mb-6">
            Start capturing missed revenue today
          </div>

          <h1 className="text-5xl font-light text-gray-900 mb-6">
            Simple pricing.
            <span className="block font-normal text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600">
              Immediate ROI.
            </span>
          </h1>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Pay per doctor. See revenue lift from day one.
            Most practices recover their investment within the first week.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-100">
              <div className="text-3xl font-semibold text-gray-900">5%</div>
              <p className="text-gray-600 mt-2">Average exam revenue increase</p>
            </div>
            <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-100">
              <div className="text-3xl font-semibold text-gray-900">2 min</div>
              <p className="text-gray-600 mt-2">Saved per claim</p>
            </div>
            <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-100">
              <div className="text-3xl font-semibold text-gray-900">5 min</div>
              <p className="text-gray-600 mt-2">Setup time</p>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="w-full max-w-md">
              {!actualPrice ? (
                <div className="p-8 bg-amber-50 border border-amber-200 rounded-3xl text-center">
                  <h3 className="text-lg font-medium text-amber-900 mb-2">Stripe Configuration Required</h3>
                  <p className="text-amber-800 mb-4">
                    No pricing information found. Please ensure Stripe products are configured.
                  </p>
                  <p className="text-sm text-amber-700">
                    Create a product named "Base" or containing "doctor" in your Stripe dashboard.
                  </p>
                </div>
              ) : (
                <PricingCard
                  name="Per Doctor Pricing"
                  price={actualPrice.unitAmount || 0}
                  interval={actualPrice.interval || 'month'}
                  trialDays={SUBSCRIPTION_CONFIG.FREE_TRIAL_DAYS}
                  priceId={actualPrice.id}
                  isPopular={true}
                />
              )}
            </div>
          </div>
        </div>

        <div className="mt-20 text-center">
          <div className="max-w-3xl mx-auto bg-white/60 backdrop-blur-sm rounded-3xl p-12 border border-gray-100">
            <h2 className="text-2xl font-light text-gray-900 mb-6">
              Everything you need to maximize reimbursements
            </h2>
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div className="flex items-start">
                <div className="w-1 h-6 bg-gradient-to-b from-teal-500 to-cyan-500 rounded-full mr-4 mt-1" />
                <div>
                  <h3 className="font-medium text-gray-900">Real-time fee schedules</h3>
                  <p className="text-sm text-gray-600 mt-1">Updated regularly from all major payers</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-1 h-6 bg-gradient-to-b from-teal-500 to-cyan-500 rounded-full mr-4 mt-1" />
                <div>
                  <h3 className="font-medium text-gray-900">Payer-specific rules</h3>
                  <p className="text-sm text-gray-600 mt-1">Each plan's unique requirements built in</p>
                </div>
              </div>
              {/* ✅ NEW: Preventive‑exam help */}
              <div className="flex items-start">
                <div className="w-1 h-6 bg-gradient-to-b from-teal-500 to-cyan-500 rounded-full mr-4 mt-1" />
                <div>
                  <h3 className="font-medium text-gray-900">Preventive‑exam coverage alert</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Flags patients eligible for annual preventive visits so you never miss reimbursable care
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-1 h-6 bg-gradient-to-b from-teal-500 to-cyan-500 rounded-full mr-4 mt-1" />
                <div>
                  <h3 className="font-medium text-gray-900">Team training</h3>
                  <p className="text-sm text-gray-600 mt-1">Onboarding and ongoing support included</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 100% Money Back Guarantee */}
        <div className="mt-16 text-center">
          <div className="inline-flex flex-col items-center justify-center px-8 pt-6 pb-8 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl border border-teal-100">
            <div className="text-teal-600 mb-3">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">100% Money Back Guarantee</h3>
            <p className="text-gray-600 mt-1">Not satisfied? Get a full refund within 30 days. No questions asked.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
