import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2025-05-28.basil',
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userEmail, userId } = body;
        
        const origin = req.headers.get('origin') || '';
        
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'NurseID Premium - Unlimited Nursing Exam Access',
                            description: 'Get unlimited access to nursing exam questions, detailed explanations, and advanced analytics to boost your NCLEX-RN preparation.',
                            images: ['https://your-domain.com/nursing-premium-icon.png'], // You can add an image URL here
                        },
                        unit_amount: 2999, // $29.99/month
                        recurring: {
                            interval: 'month',
                        },
                    },
                    quantity: 1,
                },
            ],
            customer_email: userEmail,
            metadata: {
                userId: userId,
                userEmail: userEmail,
                productType: 'nursing_premium'
            },
            subscription_data: {
                metadata: {
                    userId: userId,
                    userEmail: userEmail,
                    productType: 'nursing_premium'
                }
            },
            success_url: `${origin}/dashboard?upgrade=success`,
            cancel_url: `${origin}/dashboard?upgrade=cancelled`,
            allow_promotion_codes: true,
        });

        return NextResponse.json({ sessionId: session.id });
    } catch (err: unknown) { // Changed 'any' to 'unknown'
        console.error('Stripe checkout session creation error:', err);
        // Safely check if 'err' is an instance of Error and has a 'message' property
        if (err instanceof Error) {
            return NextResponse.json({ error: err.message }, { status: 500 });
        }
        // Fallback for unexpected error types
        return NextResponse.json({ error: 'An unknown error occurred.' }, { status: 500 });
    }
}

export async function GET() {
    return new NextResponse('Method Not Allowed', {
        status: 405,
        headers: { Allow: 'POST' },
    });
}
