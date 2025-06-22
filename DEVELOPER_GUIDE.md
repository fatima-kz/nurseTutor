# NurseID Developer Guide

## 🏥 Project Overview

**NurseID** is a comprehensive nursing exam preparation platform built with modern web technologies. It provides students with practice questions, AI-powered explanations, progress tracking, and subscription-based premium features.

## 🛠 Tech Stack

### Frontend
- **Next.js 15.3.3** - React framework with App Router
- **React 19.0.0** - UI library
- **TypeScript 5** - Type-safe JavaScript
- **Tailwind CSS 4** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library

### Backend & Database
- **Supabase** - Backend-as-a-Service (PostgreSQL + Auth + Real-time)
- **Next.js API Routes** - Server-side API endpoints

### Authentication & Payments
- **Supabase Auth** - OAuth with Google
- **Stripe** - Payment processing and subscriptions
- **Iron Session** - Session management

### AI & External Services
- **Google Gemini AI** - AI-powered question explanations
- **Redis** - Caching and session storage

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Date-fns** - Date manipulation

## 🏗 Architecture Overview

```
nurse_tutor/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # User dashboard
│   │   └── test/              # Test pages
│   ├── components/            # Reusable UI components
│   │   └── ui/               # Radix UI components
│   ├── entities/             # Data models and business logic
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility libraries
│   └── providers/            # React context providers
├── public/                   # Static assets
└── database-setup.sql        # Database schema
```

## 🔐 Authentication System

### Overview
The authentication system uses **Supabase Auth** with Google OAuth, providing a secure and user-friendly login experience.

### Key Components

#### 1. Supabase Client Configuration
```typescript
// src/lib/supabase.ts
export function createClient() {
   return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    }
  })
}
```

#### 2. Auth Provider
```typescript
// src/providers/AuthProvider.tsx
interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
}
```

**Features:**
- Automatic session management
- User profile synchronization
- Real-time auth state updates
- Loading states for better UX

#### 3. Authentication Flow

1. **Login Initiation** (`/auth/page.tsx`)
   - User clicks "Continue with Google"
   - Redirects to Google OAuth
   - Uses PKCE flow for security

2. **OAuth Callback** (`/auth/callback/page.tsx`)
   - Handles OAuth response
   - Creates user session
   - Redirects to dashboard

3. **User Profile Creation** (`src/entities/User.ts`)
   - Automatically creates user profile on first login
   - Sets trial subscription status
   - Initializes user statistics

### Database Schema

```sql
-- Users table with subscription management
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    registration_date DATE DEFAULT CURRENT_DATE,
    subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'expired')),
    subscription_end_date DATE,
    total_questions_answered INTEGER DEFAULT 0,
    best_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

### Row Level Security (RLS)
```sql
-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);
```

## 💳 Payment System

### Stripe Integration

#### 1. Checkout Session Creation
```typescript
// src/app/api/checkout-sessions/route.ts
const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [{
        price_data: {
            currency: 'usd',
            product_data: {
                name: 'NurseID Premium - Unlimited Nursing Exam Access',
                description: 'Get unlimited access to nursing exam questions...',
            },
            unit_amount: 2999, // $29.99/month
            recurring: { interval: 'month' },
        },
        quantity: 1,
    }],
    customer_email: userEmail,
    metadata: { userId, userEmail, productType: 'nursing_premium' },
    success_url: `${origin}/dashboard?upgrade=success`,
    cancel_url: `${origin}/dashboard?upgrade=cancelled`,
});
```

#### 2. Checkout Button Component
```typescript
// src/components/CheckoutButton.tsx
const handleClick = async () => {
    const res = await fetch('/api/checkout-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail, userId }),
    });
    
    const { sessionId } = await res.json();
    const stripe = await stripePromise;
    await stripe.redirectToCheckout({ sessionId });
};
```

## 🤖 AI Integration

### Google Gemini AI
```typescript
// src/app/api/gemini-explanation/route.ts
const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.7,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
        },
        safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            // ... other safety settings
        ]
    })
});
```

**Features:**
- AI-powered question explanations
- Safety filters for appropriate content
- Configurable response parameters
- Error handling and fallbacks

## 📊 Data Models

### Question Entity
```typescript
// src/entities/Question.ts
export interface IQuestion {
  id: string
  question_id: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: 'A' | 'B' | 'C' | 'D'
  difficulty?: 'Easy' | 'Medium' | 'Hard'
  created_date?: string
}
```

### Test Result Entity
```typescript
// src/entities/TestResult.ts
export interface ITestResult {
  id: string
  user_email: string
  questions_answered: number
  correct_answers: number
  percentage_score: number
  test_date: string
  time_spent?: number
  created_at?: string
}
```

### User Entity
```typescript
// src/entities/User.ts
export interface UserProfile {
  id: string
  email: string
  full_name: string
  registration_date?: string
  subscription_status?: 'trial' | 'active' | 'expired'
  subscription_end_date?: string
  total_questions_answered?: number
  best_score?: number
  created_at?: string
  updated_at?: string
}
```

## 🎨 UI Components

### Design System
- **Radix UI** for accessible components
- **Tailwind CSS** for styling
- **Custom components** for specific functionality

### Key Components
- `Layout.tsx` - Main layout wrapper
- `CheckoutButton.tsx` - Stripe checkout integration
- `AuthProvider.tsx` - Authentication context
- UI components in `src/components/ui/`

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm/yarn/pnpm
- Supabase account
- Stripe account
- Google OAuth credentials

### Environment Variables
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key

# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd nurse_tutor

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Set up database
# Run database-setup.sql in your Supabase SQL editor

# Start development server
npm run dev
```

### Database Setup
1. Create a Supabase project
2. Run the SQL commands from `database-setup.sql`
3. Configure Row Level Security policies
4. Set up Google OAuth in Supabase Auth settings

## 🔧 Development Workflow

### Code Structure
- **Entities** contain business logic and data access
- **Components** are reusable UI elements
- **API routes** handle server-side operations
- **Providers** manage global state and context

### Best Practices
- Use TypeScript for type safety
- Follow ESLint rules
- Implement proper error handling
- Use React hooks for state management
- Keep components small and focused

### Testing
- Unit tests for entities and utilities
- Integration tests for API routes
- E2E tests for critical user flows

## 📱 Features

### Core Features
- ✅ Google OAuth authentication
- ✅ User profile management
- ✅ Question bank with multiple choice
- ✅ Test taking interface
- ✅ Progress tracking
- ✅ AI-powered explanations
- ✅ Subscription management
- ✅ Payment processing

### Premium Features
- Unlimited question access
- Advanced analytics
- Detailed explanations
- Progress insights

## 🔒 Security Considerations

### Authentication Security
- PKCE OAuth flow
- Secure session management
- Row Level Security (RLS)
- Input validation and sanitization

### Payment Security
- Stripe handles sensitive payment data
- No card data stored locally
- Secure checkout sessions
- Webhook verification for subscription updates

### Data Protection
- User data isolation with RLS
- Encrypted connections (HTTPS)
- Secure API endpoints
- Environment variable protection

## 🚀 Deployment

### Vercel Deployment
1. Connect repository to Vercel
2. Set environment variables
3. Deploy automatically on push

### Environment Setup
- Production Supabase instance
- Live Stripe keys
- Production domain configuration
- SSL certificate setup

## 📈 Monitoring & Analytics

### Error Tracking
- Console logging for development
- Error boundaries for React components
- API error handling and logging

### Performance
- Next.js built-in optimizations
- Image optimization
- Code splitting
- Caching strategies

## 🤝 Contributing

### Development Guidelines
1. Fork the repository
2. Create a feature branch
3. Follow coding standards
4. Write tests for new features
5. Submit a pull request

### Code Review Process
- TypeScript type checking
- ESLint compliance
- Security review
- Performance considerations

---

## 📞 Support

For technical support or questions about the codebase, please refer to:
- Supabase documentation
- Next.js documentation
- Stripe documentation
- Google Gemini API documentation

This developer guide covers the essential aspects of the NurseID application. The codebase is well-structured and follows modern React/Next.js patterns with a focus on security, scalability, and user experience. 