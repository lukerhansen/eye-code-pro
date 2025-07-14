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
      size="lg"
      className="w-full py-6 text-base font-medium rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
    >
      {pending ? (
        <>
          <Loader2 className="animate-spin mr-2 h-5 w-5" />
          Processing...
        </>
      ) : (
        <>
          Start Saving Today
          <ArrowRight className="ml-2 h-5 w-5" />
        </>
      )}
    </Button>
  );
}
