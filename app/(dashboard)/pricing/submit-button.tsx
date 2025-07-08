'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useFormStatus } from 'react-dom';

export function SubmitButton({ isPopular = false }: { isPopular?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className={`w-full rounded-full ${
        isPopular
          ? 'bg-[#198bc4] hover:bg-[#0f7ba8] text-white'
          : 'border border-[#198bc4] text-[#198bc4] hover:bg-[#0f7ba8] text-white'
      }`}
    >
      {pending ? (
        <>
          <Loader2 className="animate-spin mr-2 h-4 w-4" />
          Loading...
        </>
      ) : (
        <>
          Start Free Trial
          <ArrowRight className="ml-2 h-4 w-4" />
        </>
      )}
    </Button>
  );
}
