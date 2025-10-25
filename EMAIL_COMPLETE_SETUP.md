# 📧 Complete Email Setup Guide for Radius

## 🎯 Quick Fix for Email Verification

### Problem:
Users are not receiving verification emails when signing up.

### Solution Options:

---

## Option 1: Supabase Built-in Email (Quickest - For Demo/Testing)

### Step 1: Enable Email Confirmations in Supabase

1. Go to your Supabase Dashboard: https://app.supabase.com/project/pclqfabhrkvqzjqqwqpu
2. Navigate to **Authentication** → **Settings**
3. Scroll to **Email Auth** section
4. ✅ **ENABLE** "Enable email confirmations"
5. Click **Save**

### Step 2: Configure Redirect URLs

1. Still in **Authentication** → **URL Configuration**
2. Add these **Redirect URLs**:
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000/*
   ```
3. Set **Site URL** to: `http://localhost:3000`
4. Click **Save**

### Step 3: Check Email Rate Limits

Supabase free tier has email rate limits:
- **4 emails per hour** per email address
- Check your **spam/junk folder**
- Wait a few minutes between signup attempts

### Step 4: Test Email Verification

1. Sign up with a new email
2. Check inbox AND spam folder
3. Look for email from: `noreply@mail.app.supabase.io`
4. Click verification link
5. Should redirect to `/auth/verify-success`

---

## Option 2: Resend API (Recommended for Production)

Resend is a modern email API that's easy to set up and has a generous free tier.

### Step 1: Create Resend Account

1. Go to https://resend.com/
2. Sign up for free account
3. Verify your email

### Step 2: Get API Key

1. In Resend dashboard, go to **API Keys**
2. Click **Create API Key**
3. Name it "Radius App"
4. Copy the API key (starts with `re_`)

### Step 3: Add to Environment Variables

Add this line to your `.env.local`:
```bash
RESEND_API_KEY=re_your_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 4: Verify Domain (Optional but Recommended)

1. In Resend dashboard, go to **Domains**
2. Add your domain
3. Add DNS records (if you have a custom domain)
4. For development, you can use Resend's test domain

### Step 5: Test Automated Emails

The following emails will now work:

1. **Booking Confirmation Emails**
   - Sent when a booking is created
   - Goes to both seeker and provider

2. **Booking Reminder Emails**
   - 24 hours before session
   - 1 hour before session
   - 15 minutes before session

3. **Session Starting Emails**
   - Sent when session time arrives

---

## Option 3: Supabase Custom SMTP (For Production)

### Step 1: Get SMTP Credentials

Choose an SMTP provider:
- **SendGrid** (12k emails/month free)
- **Mailgun** (5k emails/month free)
- **AWS SES** (62k emails/month free)

### Step 2: Configure in Supabase

1. Go to **Project Settings** → **Auth**
2. Scroll to **SMTP Settings**
3. Enable **Custom SMTP**
4. Enter your SMTP details:
   ```
   SMTP Host: smtp.sendgrid.net (or your provider)
   SMTP Port: 587
   SMTP User: apikey (for SendGrid)
   SMTP Password: YOUR_API_KEY
   SMTP Sender Email: noreply@yourdomain.com
   SMTP Sender Name: Radius
   ```
5. Click **Save**

---

## 🧪 Testing Email Features

### Test 1: Email Verification

```bash
# 1. Sign up with a test email
# 2. Check console logs (Development mode)
# 3. Or check your email inbox/spam

# Development mode will log emails to console:
console.log("📧 EMAIL SENT (Development Mode):")
```

### Test 2: Booking Confirmation

After creating a booking, the system automatically:
1. Sends confirmation to seeker
2. Sends notification to provider

Check server console or email inbox.

### Test 3: Reminder Emails

To trigger reminder emails, you need to:

1. **Create a booking** with a future date
2. **Wait or manually trigger** the cron job

To manually test reminders:
```bash
# Visit this URL in your browser or use curl
curl http://localhost:3000/api/reminders

# This will check for pending reminders and send emails
```

### Test 4: Check Email Logs

In development mode, all emails are logged to the console:
```
📧 EMAIL SENT (Development Mode):
To: user@example.com
Subject: ✅ Booking Confirmed
```

---

## 🔄 Setting Up Automated Reminder Cron Jobs

For reminders to work automatically, you need a cron job to check for pending reminders.

### Option A: Vercel Cron Jobs (Easiest for Production)

1. Create `vercel.json` in your project root:
```json
{
  "crons": [
    {
      "path": "/api/reminders",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

This runs every 15 minutes to check for pending reminders.

### Option B: GitHub Actions (Free Alternative)

Create `.github/workflows/reminders.yml`:
```yaml
name: Send Booking Reminders
on:
  schedule:
    - cron: '*/15 * * * *'  # Every 15 minutes
  workflow_dispatch:

jobs:
  send-reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Reminders
        run: |
          curl -X GET ${{ secrets.APP_URL }}/api/reminders
```

### Option C: Local Testing (Manual)

Visit this URL every 15 minutes:
```
http://localhost:3000/api/reminders
```

---

## 📝 Email Templates Included

The system includes professional email templates:

1. **Booking Confirmation** 🎉
   - Clean design with gradient header
   - Booking details card
   - Call-to-action button
   - Footer with contact info

2. **Booking Reminder** ⏰
   - Urgent orange/yellow theme
   - Alert box with session details
   - Countdown timer text
   - Quick access button

3. **Session Starting** 🚀
   - Blue/purple gradient
   - Large "Join Now" button
   - Direct link to video call

---

## 🐛 Troubleshooting

### Issue: Not receiving verification emails

**Check:**
1. ✅ Email confirmations enabled in Supabase
2. ✅ Redirect URLs configured correctly
3. ✅ Check spam/junk folder
4. ✅ Wait a few minutes (rate limits)
5. ✅ Try different email address

### Issue: Booking emails not sending

**Check:**
1. Console logs show email being "sent" in development
2. `RESEND_API_KEY` is set in `.env.local` (for production)
3. Email addresses in database are valid
4. Check Resend dashboard for delivery status

### Issue: Reminders not working

**Check:**
1. Cron job is set up and running
2. Visit `/api/reminders` manually to test
3. Check `booking_reminders` table has records
4. Check `sent` field is `false` for pending reminders
5. Check `scheduled_for` time is in the past

---

## 🎯 Current Status

### ✅ Already Implemented:
- Email service utility (`lib/email.ts`)
- Professional email templates
- Booking confirmation API
- Reminder system with email sending
- Development mode with console logging
- Production ready with Resend API

### 📋 What You Need To Do:

1. **For Immediate Testing (Development):**
   - Just check the console logs when emails are sent
   - All emails are logged to terminal

2. **For Production:**
   - Sign up for Resend (free tier is enough)
   - Add `RESEND_API_KEY` to `.env.local`
   - Set up Vercel cron job for reminders

3. **For Email Verification:**
   - Enable email confirmations in Supabase dashboard
   - Configure redirect URLs
   - Check spam folder

---

## 🚀 Quick Start Checklist

- [ ] Enable email confirmations in Supabase
- [ ] Configure redirect URLs in Supabase
- [ ] Check console for email logs (development)
- [ ] Sign up for Resend account (optional, for production)
- [ ] Add `RESEND_API_KEY` to `.env.local` (for production)
- [ ] Test sign up flow
- [ ] Test booking creation
- [ ] Test manual reminder trigger (`/api/reminders`)
- [ ] Set up Vercel cron job (for production)

---

## 📧 Email Preview

All emails are responsive and look great on mobile and desktop!

### Features:
- ✨ Modern gradient designs
- 📱 Mobile responsive
- 🎨 Professional styling
- 🔘 Clear call-to-action buttons
- 📅 Formatted dates and times
- 🔗 Direct links to app

---

Need help? Check the console logs or contact support!
