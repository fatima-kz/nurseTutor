# Google OAuth Setup Guide for NurseID

This guide will help you set up Google OAuth authentication for your NurseID application using Supabase.

## Prerequisites

1. A Google Cloud project
2. A Supabase project
3. Your application running locally or deployed

## Step 1: Google Cloud Console Setup

### 1.1 Create or Select a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note down your **Project ID**

### 1.2 Configure the Consent Screen

1. In the Google Cloud Console, go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** user type (unless you have a Google Workspace organization)
3. Fill in the required information:
   - **App name**: NurseID
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
4. Click **Save and Continue**

### 1.3 Add Authorized Domains

1. In the **Authorized domains** section, add your Supabase project domain:
   ```
   your-project-ref.supabase.co
   ```
2. If you have a custom domain, add that as well
3. Click **Save and Continue**

### 1.4 Configure Scopes

1. Add the following scopes:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
2. Click **Save and Continue**

### 1.5 Add Test Users (Optional)

1. Add your email address as a test user if you're in testing mode
2. Click **Save and Continue**

## Step 2: Create OAuth Credentials

### 2.1 Create OAuth Client ID

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Choose **Web application** as the application type
4. Fill in the details:
   - **Name**: NurseID Web Client
   - **Authorized JavaScript origins**:
     ```
     http://localhost:3000
     https://your-domain.com (if deployed)
     ```
   - **Authorized redirect URIs**:
     ```
     https://your-project-ref.supabase.co/auth/v1/callback
     ```

### 2.2 Save Your Credentials

1. Copy the **Client ID** and **Client Secret**
2. Keep these secure - you'll need them for the next step

## Step 3: Configure Supabase

### 3.1 Enable Google Auth Provider

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** > **Providers**
4. Find **Google** and click **Enable**

### 3.2 Add Google Credentials

1. In the Google provider settings, enter:
   - **Client ID**: Your Google OAuth Client ID
   - **Client Secret**: Your Google OAuth Client Secret
2. Click **Save**

### 3.3 Configure Redirect URLs

1. In the Google provider settings, you'll see a **Redirect URL**
2. Copy this URL and add it to your Google OAuth credentials in Step 2.1
3. The URL format is: `https://your-project-ref.supabase.co/auth/v1/callback`

## Step 4: Environment Variables

### 4.1 Local Development

Create or update your `.env.local` file:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4.2 Production

For production deployment, set these environment variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# App
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## Step 5: Update Email Templates (Optional)

### 5.1 Configure Email Confirmation

1. In your Supabase Dashboard, go to **Authentication** > **Email Templates**
2. Select the **Confirm signup** template
3. Update the confirmation URL to:
   ```
   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
   ```
4. Click **Save**

## Step 6: Test the Setup

### 6.1 Local Testing

1. Start your development server:
   ```bash
   npm run dev
   ```
2. Navigate to `http://localhost:3000/auth`
3. Click "Continue with Google"
4. You should be redirected to Google's consent screen
5. After authorization, you should be redirected back to your dashboard

### 6.2 Common Issues and Solutions

#### Issue: "redirect_uri_mismatch" Error
**Solution**: Make sure the redirect URI in your Google OAuth credentials exactly matches the one in Supabase.

#### Issue: "unauthorized_client" Error
**Solution**: Check that your Client ID and Client Secret are correctly entered in Supabase.

#### Issue: Domain Not Authorized
**Solution**: Add your domain to the authorized domains in the Google OAuth consent screen.

#### Issue: OAuth Consent Screen Not Verified
**Solution**: For production apps, you may need to submit your app for verification. For testing, add your email as a test user.

## Step 7: Production Deployment

### 7.1 Update Authorized Origins

1. In Google Cloud Console, add your production domain to **Authorized JavaScript origins**
2. Add your production callback URL to **Authorized redirect URIs**

### 7.2 Update Environment Variables

1. Set the production environment variables in your hosting platform
2. Make sure `NEXT_PUBLIC_SITE_URL` points to your production domain

### 7.3 Verify OAuth Consent Screen

1. If you're going live, consider submitting your app for verification
2. This will remove the "unverified app" warning for users

## Security Best Practices

1. **Never commit secrets to version control**
2. **Use environment variables for all sensitive data**
3. **Regularly rotate your OAuth credentials**
4. **Monitor your OAuth usage in Google Cloud Console**
5. **Set up proper error handling in your application**

## Troubleshooting

### Check Supabase Logs

1. Go to your Supabase Dashboard
2. Navigate to **Logs** > **Auth**
3. Look for any authentication errors

### Check Google Cloud Console

1. Go to **APIs & Services** > **OAuth consent screen**
2. Check the **Publishing status** and **User type**
3. Verify your domain is in the authorized domains list

### Common Error Messages

- **"redirect_uri_mismatch"**: Check redirect URI configuration
- **"unauthorized_client"**: Verify Client ID and Secret
- **"access_denied"**: User denied permission or app not verified
- **"invalid_client"**: Client ID is incorrect

## Support

If you encounter issues:

1. Check the [Supabase Auth Documentation](https://supabase.com/docs/guides/auth/social-login/auth-google)
2. Check the [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
3. Review your Supabase project logs
4. Verify your Google Cloud Console configuration

---

This setup guide follows the official Supabase documentation for server-side authentication with Next.js and Google OAuth integration.
