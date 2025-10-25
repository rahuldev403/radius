# ✅ Complete Authentication Setup Guide

## 🎉 Implementation Status: COMPLETE

Your authentication system with **Google OAuth** and **Email OTP Verification** is now fully implemented! Here's what we've built:

### ✨ Features Implemented

1. **Google OAuth Sign-In**

   - One-click sign-in with Google account
   - Automatic profile creation
   - Chrome icon in the button

2. **Email OTP Verification**

   - 6-digit OTP codes sent via SMTP (Gmail)
   - 10-minute expiration
   - Resend OTP functionality
   - Beautiful centered OTP input UI

3. **No Double Verification!**

   - Fixed: Uses Supabase Admin API to bypass email verification
   - OTP verification is the ONLY verification step
   - No email confirmation links sent

4. **Auto Sign-In After Verification**
   - After OTP verification, user is automatically signed in
   - Redirects to onboarding page

---

## 🔧 Final Setup Steps

### Step 1: Get Supabase Service Role Key

**This is REQUIRED for the OTP system to work without double verification!**

1. Go to: https://app.supabase.com/project/pclqfabhrkvqzjqqwqpu/settings/api

2. Scroll down to **"Project API keys"**

3. Find the **"service_role"** key (NOT the anon key!)

   - It's marked as "secret" and should be kept secure
   - Looks like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (much longer)

4. Copy the service_role key

5. Open `.env.local` and replace the placeholder:

   ```env
   SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key-here
   ```

6. **IMPORTANT:** Restart your development server after updating .env.local:
   ```powershell
   # Stop the server (Ctrl+C), then restart:
   npm run dev
   ```

---

### Step 2: Verify Database Setup

Run the OTP table migration if you haven't already:

1. Go to: https://app.supabase.com/project/pclqfabhrkvqzjqqwqpu/editor

2. Click **"SQL Editor"** → **"New Query"**

3. Copy and paste the contents of `OTP_TABLE_MIGRATION.sql`

4. Click **"Run"**

5. Verify the table was created:
   - Go to **"Table Editor"**
   - You should see `email_otps` table

---

### Step 3: Configure Google OAuth Redirect URIs

Make sure your Google OAuth redirect URIs are set correctly:

1. Go to: https://console.cloud.google.com/apis/credentials

2. Find your OAuth 2.0 Client ID: `371573887055-1njm4oip95ksf280lefmvmjclh48c45t`

3. Click **Edit** and add these **Authorized redirect URIs**:

   ```
   http://localhost:3000/auth/callback
   https://pclqfabhrkvqzjqqwqpu.supabase.co/auth/v1/callback
   https://yourdomain.com/auth/callback (when you deploy)
   ```

4. Click **Save**

---

### Step 4: Configure Supabase Auth Settings

1. Go to: https://app.supabase.com/project/pclqfabhrkvqzjqqwqpu/auth/providers

2. **Enable Google Provider:**

   - Click on **Google**
   - Enable the toggle
   - Enter your credentials:
     - Client ID: `371573887055-1njm4oip95ksf280lefmvmjclh48c45t`
     - Client Secret: `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`
   - Click **Save**

3. **Email Settings:**
   - Go to **Authentication** → **Email Templates**
   - **DISABLE** email confirmations (since we're using OTP)
   - Or keep them but users won't receive them due to admin.createUser

---

## 🧪 Testing Your Auth System

### Test 1: Email Signup with OTP

1. Open your app: http://localhost:3000

2. Click **Sign Up**

3. Enter a NEW email address (one you haven't used before)

4. Enter a password

5. Click **Sign Up**

6. **Check your email** for the 6-digit OTP code

   - Subject: "Your Verification Code"
   - From: rahuls.403.dev@gmail.com

7. Enter the OTP code in the modal

8. Click **Verify**

9. **Expected Result:**
   - ✅ "Account created successfully! Signing you in..."
   - ✅ Automatically signed in
   - ✅ Redirected to /account?onboarding=true
   - ✅ **NO email verification link sent!**

### Test 2: Google Sign-In

1. Click **Sign Up** or **Sign In**

2. Click the **"Sign in with Google"** button (with Chrome icon)

3. Select your Google account

4. **Expected Result:**
   - ✅ Signed in successfully
   - ✅ Redirected to /account?onboarding=true (if new user)
   - ✅ Redirected to /home (if existing user with profile)

### Test 3: Resend OTP

1. Start signup process

2. Don't enter the OTP immediately

3. Click **"Resend Code"**

4. **Expected Result:**
   - ✅ New OTP sent
   - ✅ "New verification code sent!" message
   - ✅ Old OTP is invalidated

### Test 4: OTP Expiration

1. Wait 10 minutes after receiving OTP

2. Try to verify with the expired code

3. **Expected Result:**
   - ✅ "Verification code expired. Please request a new one."

---

## 📁 Files Modified/Created

### Core Authentication Files

- **`lib/email-smtp.ts`** - SMTP email service with nodemailer
- **`lib/otp.ts`** - OTP generation and verification logic
- **`app/api/auth/send-otp/route.ts`** - API: Send OTP code
- **`app/api/auth/verify-otp/route.ts`** - API: Verify OTP & create user (BYPASSES email verification!)
- **`components/AuthModal.tsx`** - UI with Google OAuth + OTP input

### Database

- **`OTP_TABLE_MIGRATION.sql`** - Creates `email_otps` table with RLS policies

### Configuration

- **`.env.local`** - All environment variables (SMTP, Google OAuth, Service Role Key)

---

## 🔐 Environment Variables Checklist

Make sure your `.env.local` has ALL of these:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://pclqfabhrkvqzjqqwqpu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here  # ⚠️ GET THIS!

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=371573887055-1njm4oip95ksf280lefmvmjclh48c45t
GOOGLE_CLIENT_SECRET=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

# SMTP Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=rahuls.403.dev@gmail.com
SMTP_PASS=cxnbhgqwspbaacbf
SMTP_FROM_EMAIL=rahuls.403.dev@gmail.com
SMTP_FROM_NAME=Your Skill App

# OTP Settings
OTP_EXPIRY_MINUTES=10
```

---

## 🚀 Deployment Checklist

When deploying to Vercel/Netlify:

1. **Add ALL environment variables** to your deployment platform

   - Especially `SUPABASE_SERVICE_ROLE_KEY`!

2. **Update Google OAuth redirect URIs** with production URL

3. **Test in production:**

   - Email signup with OTP
   - Google sign-in
   - No email verification links

4. **Security:**
   - Never commit `.env.local` to git
   - Service role key grants admin access - keep it secret!

---

## 🐛 Troubleshooting

### Problem: "Invalid verification code"

**Solution:**

- Check if OTP expired (10 minutes)
- Click "Resend Code" to get a new OTP
- Check spam folder for email

### Problem: Still receiving email verification links

**Solution:**

- Make sure `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Restart dev server after updating .env.local
- Check that verify-otp route is using `admin.createUser`

### Problem: "Account created but sign-in failed"

**Solution:**

- Password might not meet Supabase requirements (min 6 characters)
- Check Supabase Auth logs for details
- User can still sign in manually

### Problem: Google sign-in not working

**Solution:**

- Verify redirect URIs in Google Console
- Check Google OAuth credentials in Supabase
- Make sure `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set

### Problem: OTP email not received

**Solution:**

- Check spam folder
- Verify SMTP credentials in .env.local
- Check terminal for error messages
- Test SMTP connection: https://app.debugmail.io/

---

## 🎯 Next Steps

1. **Get Service Role Key** (most important!)
2. Test OTP signup flow
3. Test Google sign-in
4. Add environment variables to deployment platform
5. Deploy and test in production

---

## 📝 How It Works

### Email Signup Flow:

```
1. User enters email + password → Click "Sign Up"
2. Backend generates 6-digit OTP
3. OTP stored in database with 10-min expiration
4. Email sent via SMTP with OTP code
5. User receives email, enters OTP
6. Backend verifies OTP
7. ✨ User account created with admin.createUser (email_confirm: true)
8. 🔐 User automatically signed in
9. 🎉 Redirected to onboarding page
```

### Why No Email Verification Link?

**Normal Supabase Flow:**

- signUp() → Creates user with `email_confirmed_at = NULL`
- Supabase sends verification email
- User clicks link → Sets `email_confirmed_at`

**Our Custom Flow:**

- OTP verifies email ownership
- admin.createUser() with `email_confirm: true`
- Creates user with `email_confirmed_at = NOW()`
- ✅ Already verified, no email link needed!

---

## 🎨 UI Features

- Beautiful GSAP animations on modal open
- Centered 6-digit OTP input
- Google sign-in button with Chrome icon
- Loading states for all actions
- Error messages with red styling
- Success messages with green styling
- Resend OTP with cooldown

---

## 📧 Email Templates

The system sends these emails:

1. **OTP Verification** - Beautiful HTML email with 6-digit code
2. **Booking Confirmations** - Sent when booking is created
3. **Booking Reminders** - Sent 1 hour before appointment

All emails are sent via SMTP using your Gmail account.

---

## 🔒 Security Features

- OTP codes expire after 10 minutes
- Unique email constraint (one OTP per email)
- RLS policies on email_otps table
- Service role key grants admin access (keep it secret!)
- Password hashing by Supabase Auth
- HTTPS required in production
- SMTP credentials in environment variables

---

## ✅ You're All Set!

Just get that **Service Role Key** from Supabase and you're ready to go! 🚀

If you encounter any issues, check the troubleshooting section above.
