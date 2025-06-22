

// 'use client'; // if using Next.js App Router (optional based on your setup)

// import { loadStripe } from '@stripe/stripe-js';
// import { Stripe } from '@stripe/stripe-js';
// import { useState } from 'react';

// const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string);

// export default function CheckoutButton() {
//   const [loading, setLoading] = useState(false);

//   const handleClick = async () => {
//     setLoading(true);

//     try {
//       const res = await fetch('/api/checkout_sessions', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//       });

//       const data: { sessionId: string } = await res.json();

//       const stripe: Stripe | null = await stripePromise;
//       if (!stripe) {
//         throw new Error('Stripe failed to load.');
//       }

//       const result = await stripe.redirectToCheckout({ sessionId: data.sessionId });
//       if (result.error) {
//         console.error(result.error.message);
//       }
//     } catch (err) {
//       console.error('Checkout error:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <button onClick={handleClick} disabled={loading}>
//       {loading ? 'Redirecting…' : 'Checkout'}
//     </button>
//   );
// }
