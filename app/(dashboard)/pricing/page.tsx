import { checkoutAction } from '@/lib/payments/actions';
import { Check } from 'lucide-react';
import { getStripePrices, getStripeProducts } from '@/lib/payments/stripe';
import { SubmitButton } from './submit-button';

// Prices are fresh for one hour max
export const revalidate = 3600;

export default async function PricingPage() {
  const [prices, products] = await Promise.all([
    getStripePrices(),
    getStripeProducts(),
  ]);

  const basePlan = products.find((product) => product.name === 'Base');
  const plusPlan = products.find((product) => product.name === 'Plus');

  const basePrice = prices.find((price) => price.productId === basePlan?.id);
  const plusPrice = prices.find((price) => price.productId === plusPlan?.id);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Choose Your Practice Plan
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Start optimizing your ophthalmology practice with our comprehensive insurance code platform. 
          Save time, reduce denials, and maximize your revenue.
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <PricingCard
          name="Essential"
          price={basePrice?.unitAmount || 800}
          interval={basePrice?.interval || 'month'}
          trialDays={basePrice?.trialPeriodDays || 7}
          features={[
            'Complete ophthalmology code database',
            'Real-time claim validation',
            'Basic reimbursement tracking',
            'Email support for coding questions',
            'Monthly revenue reports',
          ]}
          priceId={basePrice?.id}
          isPopular={false}
        />
        <PricingCard
          name="Professional"
          price={plusPrice?.unitAmount || 1200}
          interval={plusPrice?.interval || 'month'}
          trialDays={plusPrice?.trialPeriodDays || 7}
          features={[
            'Everything in Essential, plus:',
            'Advanced revenue optimization',
            'Priority coding support',
            'Custom reporting & analytics',
            'Integration with practice management',
            'Dedicated account manager',
          ]}
          priceId={plusPrice?.id}
          isPopular={true}
        />
      </div>
      
      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Join 5,000+ ophthalmologists who trust our platform
        </h2>
        <p className="text-lg text-gray-600">
          On average, our users see a 23% increase in claim approval rates and save 8 hours per week on coding tasks.
        </p>
      </div>
    </main>
  );
}

function PricingCard({
  name,
  price,
  interval,
  trialDays,
  features,
  priceId,
  isPopular = false,
}: {
  name: string;
  price: number;
  interval: string;
  trialDays: number;
  features: string[];
  priceId?: string;
  isPopular?: boolean;
}) {
  return (
    <div className={`relative pt-6 ${isPopular ? 'border-2 border-teal-200 rounded-lg' : ''}`}>
      {isPopular && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <span className="bg-teal-600 text-white px-4 py-1 rounded-full text-sm font-medium">
            Most Popular
          </span>
        </div>
      )}
      <div className={`${isPopular ? 'p-6' : 'pt-6'}`}>
        <h2 className="text-2xl font-medium text-gray-900 mb-2">{name}</h2>
        <p className="text-sm text-gray-600 mb-4">
          {trialDays} day free trial - no credit card required
        </p>
        <p className="text-4xl font-medium text-gray-900 mb-6">
          ${price / 100}{' '}
          <span className="text-xl font-normal text-gray-600">
            per provider / {interval}
          </span>
        </p>
        <ul className="space-y-4 mb-8">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="h-5 w-5 text-teal-600 mr-3 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
        <form action={checkoutAction}>
          <input type="hidden" name="priceId" value={priceId} />
          <SubmitButton isPopular={isPopular} />
        </form>
      </div>
    </div>
  );
}
