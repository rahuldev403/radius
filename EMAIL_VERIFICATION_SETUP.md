# Email Verification Setup Guide for Radius

## ✅ What's Already Done:

1. **Auth Callback Route** (`/app/auth/callback/route.ts`)

   - Handles email verification tokens
   - Redirects to success/error pages

2. **Verification Success Page** (`/app/auth/verify-success/page.tsx`)

   - Beautiful animated success page with confetti
   - Redirects users to home or profile setup

3. **Verification Error Page** (`/app/auth/verify-error/page.tsx`)

   - Error handling with retry options
   - Contact support information

4. **Updated Auth Modal** (`/components/AuthModal.tsx`)
   - Better error messages
   - Checks for duplicate emails
   - Shows detailed verification instructions

## 🔧 Supabase Configuration Required:

### Step 1: Enable Email Confirmations

1. Go to your Supabase Dashboard: https://app.supabase.com/project/pclqfabhrkvqzjqqwqpu
2. Navigate to **Authentication** → **Settings**
3. Scroll to **Email Auth** section
4. Make sure **"Enable email confirmations"** is **CHECKED** ✅

### Step 2: Configure Email Templates (Optional but Recommended)

1. In the same **Authentication** → **Email Templates** section
2. Customize the **"Confirm signup"** template
3. Suggested template:

```html
<h2>Welcome to Radius!</h2>
<p>
  Thanks for signing up! Please click the link below to verify your email
  address:
</p>
<p><a href="{{ .ConfirmationURL }}">Verify Email</a></p>
<p>Or copy and paste this URL into your browser:</p>
<p>{{ .ConfirmationURL }}</p>
```

### Step 3: Configure Redirect URLs

1. Go to **Authentication** → **URL Configuration**
2. Add these **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `https://your-production-domain.com/auth/callback` (when you deploy)
3. Set **Site URL** to: `http://localhost:3000` (or your production URL)

### Step 4: Test Email Service

**For Development (Free Tier):**

- Supabase uses their own SMTP server
- Rate limited to prevent abuse
- Check your spam folder!

**For Production (Recommended):**

1. Go to **Project Settings** → **Auth**
2. Scroll to **SMTP Settings**
3. Configure your own SMTP provider (SendGrid, Mailgun, AWS SES, etc.)

Example SMTP configuration:

```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Password: YOUR_SENDGRID_API_KEY
SMTP Sender Email: noreply@yourdomain.com
SMTP Sender Name: Radius
```

## 🧪 Testing the Flow:

### Expected User Journey:

1. **User signs up** on landing page

   - Enters email and password
   - Clicks "Create Account"

2. **Success message appears**

   - "Please check your email inbox (and spam folder) for a verification link."

3. **User receives email**

   - Subject: "Confirm Your Signup"
   - Contains verification link

4. **User clicks link**

   - Redirects to `/auth/callback`
   - Token is exchanged for session
   - User sees animated success page 🎉

5. **User can start using the app**
   - Click "Start Exploring" → Goes to `/home` (map view)
   - Click "Complete Your Profile" → Goes to `/account`

## 🐛 Troubleshooting:

### Not Receiving Emails?

1. **Check Spam/Junk folder**

   - Supabase emails often land here

2. **Check Email Auth is enabled**

   - Go to Auth → Settings
   - Verify "Enable email confirmations" is ON

3. **Check Rate Limits**

   - Supabase free tier has rate limits
   - Wait a few minutes between signup attempts

4. **Check Supabase Logs**

   - Go to Logs → Auth
   - Look for "email sent" or error messages

5. **Check Email Service Status**
   - Go to Project Settings → Auth
   - Look for any SMTP connection errors

### Email Arrives but Link Doesn't Work?

1. **Check Redirect URLs**

   - Ensure `/auth/callback` is in allowed URLs
   - Match exactly (http vs https, trailing slash)

2. **Check for Console Errors**

   - Open browser DevTools
   - Look for CORS or auth errors

3. **Verify Site URL**
   - Must match your current domain exactly

## 🚀 Quick Start (Development):

1. Make sure your app is running: `npm run dev`
2. Go to `http://localhost:3000`
3. Click "Get Started"
4. Sign up with a **real email** you can access
5. Check your inbox (and spam!)
6. Click the verification link
7. You should see the success page! 🎉

## 📝 Manual Testing Without Email (Temporary):

If you need to test without email verification:

1. Go to Supabase Dashboard
2. Navigate to **Authentication** → **Users**
3. Find your test user
4. Click on the user
5. Manually set `email_confirmed_at` to current timestamp
6. User can now sign in without verification

## 🔐 Security Notes:

- **Never disable email confirmation in production**
- Always use HTTPS in production
- Configure custom SMTP for production
- Set up proper DNS records (SPF, DKIM) for your email domain
- Monitor authentication logs regularly

## ✨ Features:

✅ Animated success/error pages with GSAP and Framer Motion
✅ Confetti celebration on successful verification
✅ Clear error messages and retry options
✅ Duplicate email detection
✅ Mobile-responsive design
✅ Dark mode support
✅ Secure token exchange
✅ Proper redirect flow

---

**Need Help?** Check Supabase docs: https://supabase.com/docs/guides/auth/auth-email
