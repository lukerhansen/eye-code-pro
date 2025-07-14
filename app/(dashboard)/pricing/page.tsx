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
              <div className="text-3xl font-semibold text-gray-900">43%</div>
              <p className="text-gray-600 mt-2">Average revenue increase</p>
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
              <PricingCard
                name="Per Doctor Pricing"
                price={basePrice?.unitAmount || 1}
                interval={basePrice?.interval || 'month'}
                trialDays={SUBSCRIPTION_CONFIG.FREE_TRIAL_DAYS}
                priceId={basePrice?.id}
                isPopular={true}
              />
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
                  <p className="text-sm text-gray-600 mt-1">Updated daily from all major payers</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-1 h-6 bg-gradient-to-b from-teal-500 to-cyan-500 rounded-full mr-4 mt-1" />
                <div>
                  <h3 className="font-medium text-gray-900">Payer-specific rules</h3>
                  <p className="text-sm text-gray-600 mt-1">Each plan's unique requirements built in</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-1 h-6 bg-gradient-to-b from-teal-500 to-cyan-500 rounded-full mr-4 mt-1" />
                <div>
                  <h3 className="font-medium text-gray-900">Audit protection</h3>
                  <p className="text-sm text-gray-600 mt-1">Complete documentation for every code</p>
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
      </div>
    </main>
  );
}
