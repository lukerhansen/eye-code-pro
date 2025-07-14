'use client';

import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { checkoutAction } from '@/lib/payments/actions';
import { SubmitButton } from './submit-button';
import { Button } from '@/components/ui/button';
import { SUBSCRIPTION_CONFIG } from '@/lib/config/subscription';

export function PricingCard({
  name,
  price,
  interval,
  trialDays,
  priceId,
  isPopular = false,
}: {
  name: string;
  price: number;
  interval: string;
  trialDays: number;
  priceId?: string;
  isPopular?: boolean;
}) {
  const [quantity, setQuantity] = useState(1);

  const handleQuantityChange = (change: number) => {
    setQuantity(Math.max(1, quantity + change));
  };

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-3xl blur-2xl opacity-10" />
      <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 p-8">
        <div>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-light text-gray-900 mb-2">{name}</h2>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-teal-50 to-cyan-50 text-teal-700">
              Credit card required • Cancel anytime
            </div>
          </div>
          
          <div className="mb-8">
            <div className="flex items-center justify-center">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
                className="h-10 w-10 rounded-xl border-gray-200 hover:border-teal-300 hover:bg-teal-50/50 transition-all duration-200"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="mx-6 text-center">
                <div className="text-5xl font-light text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600">
                  {quantity}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  doctor{quantity !== 1 ? 's' : ''} in practice
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleQuantityChange(1)}
                className="h-10 w-10 rounded-xl border-gray-200 hover:border-teal-300 hover:bg-teal-50/50 transition-all duration-200"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="text-center mb-8 p-6 bg-gray-50/50 rounded-2xl">
            <div className="flex items-baseline justify-center">
              <span className="text-2xl text-gray-600">$</span>
              <span className="text-5xl font-light text-gray-900">
                {((price / 100) * quantity).toFixed(0)}
              </span>
              <span className="text-lg text-gray-600 ml-2">/ month</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              ${(price / 100).toFixed(0)} per doctor monthly
            </p>
          </div>
          
          <form action={checkoutAction}>
            <input type="hidden" name="priceId" value={priceId} />
            <input type="hidden" name="quantity" value={quantity} />
            <SubmitButton isPopular={isPopular} />
          </form>
          
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                ✓ Instant setup • ✓ Cancel anytime
              </p>
              <p className="text-xs text-gray-500">
                Average ROI: 3% revenue increase
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}