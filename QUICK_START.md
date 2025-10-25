# 🚀 Quick Start - Get Google OAuth + OTP Working in 5 Minutes

## ✅ What's Already Done

- Google OAuth button added to auth modal
- OTP verification system implemented
- SMTP email service with nodemailer
- Database migration SQL ready
- API routes for send/verify OTP

## 🎯 What You Need to Do

### 1. Configure SMTP (2 minutes)

**Using Gmail:**

1. Go to https://myaccount.google.com/apppasswords
2. Create an app password (name it "Radius")
3. Copy the 16-character password

**Update `.env.local`:**

```bash
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=abcdefghijklmnop  # Paste your app password (no spaces!)
```

### 2. Setup Google OAuth (3 minutes)

1. **Google Cloud Console:** https://console.cloud.google.com/
2. Create project → Enable Google+ API
3. OAuth consent screen → External → Fill basic info
4. Credentials → Create OAuth Client ID → Web application
5. Add redirect URIs:
   ```
   http://localhost:3000/auth/callback
   https://pclqfabhrkvqzjqqwqpu.supabase.co/auth/v1/callback
   ```
6. Copy Client ID and Secret

**Update `.env.local`:**

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-secret
```

**Enable in Supabase:**

1. Go to: https://app.supabase.com/project/pclqfabhrkvqzjqqwqpu/auth/providers
2. Find Google → Enable
3. Paste Client ID and Secret → Save

### 3. Create OTP Table (30 seconds)

1. Go to: https://app.supabase.com/project/pclqfabhrkvqzjqqwqpu/sql
2. Copy/paste this SQL:

```sql
CREATE TABLE IF NOT EXISTS email_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  otp TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT email_otps_email_key UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS email_otps_email_idx ON email_otps(email);
ALTER TABLE email_otps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage OTPs"
  ON email_otps FOR ALL TO service_role
  USING (true) WITH CHECK (true);
```

3. Click **Run** ✅

### 4. Test It! (1 minute)

```bash
npm run dev
```

1. Open http://localhost:3000
2. Click "Sign Up"
3. See "Continue with Google" button? ✅
4. Try Google sign-in → Should work!
5. Try Email signup → Get OTP email → Verify → Done! ✅

---

## 🎉 That's It!

You now have:

- ✅ Google OAuth sign-in
- ✅ Email OTP verification
- ✅ Beautiful email templates
- ✅ Secure OTP storage
- ✅ Production-ready auth system

## 📚 Need More Help?

See `GOOGLE_OAUTH_OTP_SETUP.md` for detailed setup guide with screenshots and troubleshooting.

## 🏆 Go Win That Hackathon!
