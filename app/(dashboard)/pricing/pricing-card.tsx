'use client';

import { useState } from 'react';
import { Check, Plus, Minus } from 'lucide-react';
import { checkoutAction } from '@/lib/payments/actions';
import { SubmitButton } from './submit-button';
import { Button } from '@/components/ui/button';
import { SUBSCRIPTION_CONFIG } from '@/lib/config/subscription';

export function PricingCard({
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
  const [quantity, setQuantity] = useState(1);

  const handleQuantityChange = (change: number) => {
    setQuantity(Math.max(1, quantity + change));
  };

  return (
    <div className={`relative pt-6 ${isPopular ? 'border-2 border-[#198bc4] rounded-lg' : ''}`}>
      {isPopular && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <span className="bg-[#198bc4] text-white px-4 py-1 rounded-full text-sm font-medium">
            Perfect Choice
          </span>
        </div>
      )}
      <div className={`${isPopular ? 'p-6' : 'pt-6'}`}>
        <h2 className="text-2xl font-medium text-gray-900 mb-2">{name}</h2>
        <p className="text-sm text-gray-600 mb-4">
          {trialDays > 0 ? `${trialDays} day free trial - no credit card required` : 'Start your subscription today'}
        </p>
        
        <div className="mb-6">
          <div className="flex items-center justify-center mb-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuantityChange(-1)}
              disabled={quantity <= 1}
              className="h-8 w-8 p-0"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <div className="mx-4 text-center">
              <div className="text-3xl font-bold">{quantity}</div>
              <div className="text-sm text-gray-600">doctor{quantity !== 1 ? 's' : ''}</div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleQuantityChange(1)}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <p className="text-4xl font-medium text-gray-900 mb-2">
          ${(price / 100) * quantity}
        </p>
        <p className="text-sm text-gray-600 mb-6">
          ${price / 100} per doctor / {interval}
        </p>
        
        <ul className="space-y-4 mb-8">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="h-5 w-5 text-[#198bc4] mr-3 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
        <form action={checkoutAction}>
          <input type="hidden" name="priceId" value={priceId} />
          <input type="hidden" name="quantity" value={quantity} />
          <SubmitButton isPopular={isPopular} />
        </form>
      </div>
    </div>
  );
}