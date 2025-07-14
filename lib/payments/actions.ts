'use server';

import { redirect } from 'next/navigation';
import { createCheckoutSession, createCustomerPortalSession } from './stripe';
import { withTeam } from '@/lib/auth/middleware';
import { ActionState } from '@/lib/auth/middleware';

export const checkoutAction = withTeam(async (formData, team) => {
  const priceId = formData.get('priceId') as string;
  const quantity = parseInt(formData.get('quantity') as string) || 1;
  
  if (!priceId) {
    throw new Error('No pricing information available. Please ensure Stripe is configured correctly.');
  }
  
  await createCheckoutSession({ team: team, priceId, quantity });
});

export const customerPortalAction = async (
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> => {
  try {
    const { withTeam } = await import('@/lib/auth/middleware');
    const action = withTeam(async (_, team) => {
      console.log('Creating customer portal session for team:', {
        teamId: team.id,
        stripeCustomerId: team.stripeCustomerId,
        stripeProductId: team.stripeProductId
      });
      
      const portalSession = await createCustomerPortalSession(team);
      redirect(portalSession.url);
    });
    
    await action(formData);
    return { success: 'Redirecting to customer portal...' };
  } catch (error: any) {
    // Check if this is a Next.js redirect
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error; // Re-throw to let Next.js handle the redirect
    }
    
    console.error('Customer portal error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('product is not active')) {
        return { error: 'Your subscription product is no longer active. Please contact support.' };
      }
      if (error.message.includes('No active prices')) {
        return { error: 'No pricing information found for your subscription. Please contact support.' };
      }
      if (error.message === 'Team not found') {
        return { error: 'Unable to find your practice information. Please try logging out and back in.' };
      }
      return { error: error.message };
    }
    
    return { error: 'Failed to open customer portal. Please try again or contact support.' };
  }
};
