/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { loadStripe } from '@stripe/stripe-js';
import { Stripe } from '@stripe/stripe-js';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Crown, Loader2, AlertCircle } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string);

interface CheckoutButtonProps {
  userEmail?: string;
  userId?: string;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export default function CheckoutButton({ 
  userEmail, 
  userId, 
  className,
  variant = 'default' 
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (!userEmail || !userId) {
      setError('User email and ID are required for checkout');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/checkout-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail,
          userId
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const data: { sessionId: string } = await res.json();

      const stripe: Stripe | null = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load. Please refresh the page and try again.');
      }

      const result = await stripe.redirectToCheckout({ sessionId: data.sessionId });
      if (result.error) {
        throw new Error(result.error.message || 'Checkout failed');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
        <Button 
          onClick={() => setError(null)} 
          variant="outline"
          className={className}
          size="sm"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <Button 
      onClick={handleClick} 
      disabled={loading || !userEmail || !userId}
      className={className}
      variant={variant}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <Crown className="w-4 h-4 mr-2" />
          Upgrade to Premium
        </>
      )}
    </Button>
  );
}
