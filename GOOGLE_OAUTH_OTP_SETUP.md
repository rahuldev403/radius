# Google OAuth + Email OTP Setup Guide

This guide will help you set up **Google OAuth** authentication and **Email OTP verification** with SMTP for your Radius app.

## 📋 Table of Contents

1. [SMTP Email Setup](#1-smtp-email-setup)
2. [Google OAuth Setup](#2-google-oauth-setup)
3. [Supabase Database Setup](#3-supabase-database-setup)
4. [Environment Variables Configuration](#4-environment-variables-configuration)
5. [Testing](#5-testing)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. SMTP Email Setup

### Option A: Gmail (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Gmail account

   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password**

   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "Radius App"
   - Copy the 16-character password (example: `abcd efgh ijkl mnop`)

3. **Update .env.local**
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=abcdefghijklmnop  # Remove spaces from app password
   SMTP_FROM=Radius <your-email@gmail.com>
   ```

### Option B: Other SMTP Providers

**SendGrid:**

```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your_sendgrid_api_key
SMTP_FROM=Radius <noreply@yourdomain.com>
```

**Mailgun:**

```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASSWORD=your_mailgun_password
SMTP_FROM=Radius <noreply@yourdomain.com>
```

---

## 2. Google OAuth Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Name it "Radius App" (or your preferred name)

### Step 2: Enable Google+ API

1. Go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click **Enable**

### Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** (or Internal if using Google Workspace)
3. Fill in required fields:
   - **App name:** Radius
   - **User support email:** your-email@gmail.com
   - **Developer contact:** your-email@gmail.com
4. Click **Save and Continue**
5. Skip Scopes (default is fine)
6. Add test users (your email for testing)
7. Click **Save and Continue**

### Step 4: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Choose **Web application**
4. Name it "Radius Web Client"
5. **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   https://your-production-domain.com
   ```
6. **Authorized redirect URIs:**
   ```
   http://localhost:3000/auth/callback
   https://your-production-domain.com/auth/callback
   https://pclqfabhrkvqzjqqwqpu.supabase.co/auth/v1/callback
   ```
7. Click **Create**
8. **Copy** the **Client ID** and **Client Secret**

### Step 5: Configure Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project: `pclqfabhrkvqzjqqwqpu`
3. Go to **Authentication** → **Providers**
4. Find **Google** and enable it
5. Paste your **Client ID** and **Client Secret**
6. Click **Save**

### Step 6: Update Environment Variables

Add to `.env.local`:

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

---

## 3. Supabase Database Setup

### Create OTP Table

1. Go to [Supabase SQL Editor](https://app.supabase.com/project/pclqfabhrkvqzjqqwqpu/sql)
2. Run the SQL in `OTP_TABLE_MIGRATION.sql`:

```sql
-- Create email_otps table for OTP verification
CREATE TABLE IF NOT EXISTS email_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  otp TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT email_otps_email_key UNIQUE (email)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS email_otps_email_idx ON email_otps(email);
CREATE INDEX IF NOT EXISTS email_otps_expires_at_idx ON email_otps(expires_at);

-- Enable RLS
ALTER TABLE email_otps ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything (for API routes)
CREATE POLICY "Service role can manage OTPs"
  ON email_otps
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Cleanup function to delete expired OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM email_otps WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION cleanup_expired_otps() TO service_role;
```

3. Click **Run** to execute the migration

---

## 4. Environment Variables Configuration

Your complete `.env.local` should look like this:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://pclqfabhrkvqzjqqwqpu.supabase.co/
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjbHFmYWJocmt2cXpqcXF3cXB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNjA5OTYsImV4cCI6MjA3NjkzNjk5Nn0.Q0nYaXfa_kOxwMSb9lDF9-yBxrCRLV75FFjXvCequT0

# AI Configuration
GEMINI_API_KEY=AIzaSyA4HCl2VD6x50o4fGf18lRWDCRn5N0Z1s4

# SMTP Email Configuration (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
SMTP_FROM=Radius <your-email@gmail.com>

# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# OTP Configuration
OTP_EXPIRY_MINUTES=10
```

**⚠️ Important:** Replace all placeholder values with your actual credentials!

---

## 5. Testing

### Test SMTP Email

1. Stop your dev server if running (Ctrl+C)
2. Restart dev server:
   ```bash
   npm run dev
   ```
3. Open http://localhost:3000
4. Click "Sign Up"
5. Enter your email and password
6. Click "Send Verification Code"
7. Check your email for the OTP code
8. Enter the 6-digit code and verify

### Test Google OAuth

1. Go to http://localhost:3000
2. Click "Sign Up" or "Sign In"
3. Click "Continue with Google"
4. Select your Google account
5. Grant permissions
6. You should be redirected to the dashboard

### Test OTP Expiration

1. Request an OTP
2. Wait 10 minutes (or change `OTP_EXPIRY_MINUTES` to 1 for faster testing)
3. Try to verify - should show "OTP has expired"
4. Click "Resend Code" to get a new OTP

---

## 6. Troubleshooting

### SMTP Errors

**Problem:** "Connection timeout" or "Authentication failed"

- **Solution:**
  - Verify your Gmail App Password is correct (no spaces)
  - Check if 2FA is enabled on your Google account
  - Try using port 465 with `secure: true` for SSL

**Problem:** Emails going to spam

- **Solution:**
  - Add proper SPF/DKIM records to your domain
  - Use a custom domain instead of Gmail
  - Ask recipients to whitelist your email

### Google OAuth Errors

**Problem:** "redirect_uri_mismatch"

- **Solution:**
  - Verify all redirect URIs in Google Cloud Console match exactly
  - Include both local and production URLs
  - Include Supabase callback URL: `https://pclqfabhrkvqzjqqwqpu.supabase.co/auth/v1/callback`

**Problem:** "Access blocked: This app's request is invalid"

- **Solution:**
  - Complete OAuth consent screen configuration
  - Add your email as a test user
  - Verify Google+ API is enabled

### OTP Errors

**Problem:** "Invalid OTP" even with correct code

- **Solution:**
  - Check if OTP table was created successfully
  - Verify RLS policies are set correctly
  - Check Supabase logs for errors

**Problem:** No OTP email received

- **Solution:**
  - Check SMTP credentials in .env.local
  - Look at server console for email logs
  - Check spam folder
  - Verify `lib/email-smtp.ts` is being used (not old `lib/email.ts`)

### Database Errors

**Problem:** "relation 'email_otps' does not exist"

- **Solution:**
  - Run the SQL migration from `OTP_TABLE_MIGRATION.sql`
  - Verify you're connected to the correct database
  - Check Supabase SQL Editor for errors

---

## 📝 Files Created/Modified

### New Files:

- `lib/email-smtp.ts` - SMTP email service with nodemailer
- `lib/otp.ts` - OTP generation and verification
- `app/api/auth/send-otp/route.ts` - API to send OTP
- `app/api/auth/verify-otp/route.ts` - API to verify OTP
- `OTP_TABLE_MIGRATION.sql` - Database migration for OTP table
- `GOOGLE_OAUTH_OTP_SETUP.md` - This guide

### Modified Files:

- `.env.local` - Added SMTP and Google OAuth credentials
- `components/AuthModal.tsx` - Added Google sign-in button and OTP input
- `components/ui/button.tsx` - May need variant prop (already has it)

---

## 🚀 Next Steps

1. ✅ Configure SMTP credentials in `.env.local`
2. ✅ Set up Google OAuth in Google Cloud Console
3. ✅ Run database migration in Supabase
4. ✅ Update environment variables
5. ✅ Test email OTP flow
6. ✅ Test Google OAuth flow
7. 🎯 Deploy to production
8. 🎯 Update production redirect URIs
9. 🎯 Publish OAuth consent screen (if needed for public use)

---

## 🎉 Success Indicators

You'll know everything is working when:

- ✅ Google sign-in button appears in auth modal
- ✅ Clicking "Continue with Google" opens Google sign-in popup
- ✅ OTP emails arrive within seconds
- ✅ OTP verification creates account successfully
- ✅ Users can sign in with both methods
- ✅ No errors in browser console or server logs

---

## 📧 Support

If you encounter issues:

1. Check server console for detailed error logs
2. Verify all credentials are correct (no extra spaces)
3. Test SMTP with a simple nodemailer script
4. Check Supabase logs and database
5. Ensure all tables and policies exist

Good luck with your hackathon! 🏆
