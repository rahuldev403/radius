# 🚀 Testing & Deployment Guide

## Table of Contents

1. [Pre-Deployment Setup](#pre-deployment-setup)
2. [Database Configuration](#database-configuration)
3. [Environment Variables](#environment-variables)
4. [Feature Testing Guide](#feature-testing-guide)
5. [Deployment Steps](#deployment-steps)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Setup

### 1. Install Dependencies

```powershell
npm install
```

### 2. Build the Application

```powershell
npm run build
```

This will:

- Check for TypeScript errors
- Optimize production build
- Generate static pages
- Create optimized bundles

### 3. Test Locally in Production Mode

```powershell
npm run start
```

Visit `http://localhost:3000` and test all features.

---

## Database Configuration

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for database to initialize (~2 minutes)

### Step 2: Run Database Schema

1. Open Supabase Dashboard → SQL Editor
2. Copy the entire `COMPLETE_DATABASE_SCHEMA.sql` file
3. Paste and click "Run"
4. Verify all tables created successfully

### Step 3: Enable PostGIS Extension

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Step 4: Test Database Functions

```sql
-- Test get_services_nearby function
SELECT * FROM get_services_nearby(40.7128, -74.0060, 5000);

-- Test average rating function
SELECT get_user_average_rating('user-uuid-here');

-- Test credit balance function
SELECT get_user_credits('user-uuid-here');
```

### Step 5: Verify RLS Policies

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- All tables should have rowsecurity = true
```

---

## Environment Variables

### Local Development (`.env.local`)

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Optional: Email Configuration (SendGrid)
SENDGRID_API_KEY=your-sendgrid-key-here
SENDGRID_FROM_EMAIL=noreply@yourapp.com

# Optional: SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
```

### Production (Vercel/Netlify)

Add the same variables in your deployment platform's environment settings.

**Important:** Never commit `.env.local` to version control!

---

## Feature Testing Guide

### ✅ 1. User Authentication & Verification

**Test Flow:**

```
1. Open browser in incognito mode
2. Navigate to http://localhost:3000
3. Click "Get Started" button
4. Fill sign-up form with test email
5. Verify email sent (check Supabase Auth logs)
6. Click verification link
7. Redirected to /account?onboarding=true
8. Complete profile with name, bio
9. Click "Get My Location" button
10. Grant browser location permission
11. Location saved automatically
12. Redirected to /home dashboard
```

**Expected Results:**

- ✓ AuthModal opens smoothly with animations
- ✓ Sign-up creates user in auth.users table
- ✓ Verification email sent (if SMTP configured)
- ✓ Profile created in profiles table
- ✓ Location stored as PostGIS GEOGRAPHY point
- ✓ User redirected to home page

**Database Verification:**

```sql
-- Check if user created
SELECT * FROM auth.users WHERE email = 'test@example.com';

-- Check if profile created
SELECT * FROM profiles WHERE id = 'user-uuid';

-- Check if credits initialized
SELECT * FROM user_credits WHERE user_id = 'user-uuid';
-- Should show balance = 100
```

---

### ✅ 2. Geo-Location Matching

**Test Flow:**

```
1. Login as user
2. Home page loads with map
3. User location marker (blue) appears
4. Service markers (red) appear within radius
5. Adjust radius slider (1-50 km)
6. Services update dynamically
7. Click service marker
8. Popup shows service details
9. Toggle to List View
10. Same services shown in card format
```

**Expected Results:**

- ✓ Map loads without errors
- ✓ User location accurate
- ✓ Services filtered by radius
- ✓ Service count updates dynamically
- ✓ Popups clickable without errors
- ✓ List/Map toggle works smoothly

**Database Verification:**

```sql
-- Test RPC function
SELECT * FROM get_services_nearby(
  40.7128,  -- Your latitude
  -74.0060, -- Your longitude
  5000      -- 5km radius in meters
);

-- Should return services within radius with provider location
```

**Console Checks:**

```javascript
// Open browser console, should see:
"Map initialized successfully"
"Fetched X services"
"Map bounds:", [bounds object]
```

---

### ✅ 3. Booking & Scheduling

**Test Flow:**

```
1. Find service on map/list
2. Click "View Details"
3. Navigate to /services/[id]
4. See calendar with today's date selected
5. Try selecting past date (should be disabled)
6. Select future date
7. Time slots appear (9 AM - 6 PM)
8. Green slots = available, Gray = booked
9. Click available time slot
10. Slot turns emerald color
11. Confirmation card shows selected time
12. Click "Request to Book"
13. Loading state shows
14. Success toast appears
15. Navigate to "My Bookings"
16. See pending booking
```

**Expected Results:**

- ✓ Calendar loads correctly
- ✓ Past dates disabled
- ✓ Time slots show availability
- ✓ Conflict detection prevents double-booking
- ✓ Booking created with "pending" status
- ✓ Reminders scheduled automatically
- ✓ Toast notification shows success

**Database Verification:**

```sql
-- Check booking created
SELECT * FROM bookings
WHERE seeker_id = 'user-uuid'
ORDER BY created_at DESC
LIMIT 1;

-- Check reminders scheduled
SELECT * FROM reminders
WHERE booking_id = 123
ORDER BY remind_at;

-- Should show 3 reminders:
-- 1. 24 hours before
-- 2. 1 hour before
-- 3. 15 minutes before
```

**Test Conflict Detection:**

```
1. Create booking for "Dec 25, 2025 at 10:00 AM"
2. Try creating another booking for same time
3. Should show conflict error toast
4. Booking should not be created
```

---

### ✅ 4. Reputation System (Reviews)

**Test Flow:**

```
1. Complete a booking (mark as "completed")
2. Go to My Bookings page
3. Find completed booking
4. Click "Leave Review" button
5. Review form expands
6. Hover over stars (should highlight)
7. Click 5 stars
8. Write review comment
9. Click "Submit Review"
10. Success toast appears
11. Review form closes
12. Navigate to service detail page
13. Scroll to reviews section
14. See your review with rating
```

**Expected Results:**

- ✓ Review form shows only for completed bookings
- ✓ Star rating interactive
- ✓ Review submitted successfully
- ✓ Average rating calculated correctly
- ✓ Review appears in ReviewList component
- ✓ Cannot submit duplicate review

**Database Verification:**

```sql
-- Check review created
SELECT * FROM reviews
WHERE booking_id = 123
AND reviewer_id = 'user-uuid';

-- Check average rating calculation
SELECT get_user_average_rating('provider-uuid');

-- Verify unique constraint works
-- Try inserting duplicate review (should fail)
INSERT INTO reviews (booking_id, reviewer_id, reviewee_id, rating, comment)
VALUES (123, 'user-uuid', 'provider-uuid', 5, 'Duplicate test');
-- Should get error: duplicate key value violates unique constraint
```

---

### ✅ 5. AI Recommendations

**Test Flow:**

```
1. Login and navigate to /home
2. See "AI Recommendations for You" section at top
3. Horizontal carousel with service cards
4. Each card shows:
   - Service title and category
   - Match percentage (0-100%)
   - Reason for match
5. Click recommendation card
6. Navigates to service detail page
```

**Expected Results:**

- ✓ Recommendations load automatically
- ✓ Match algorithm considers:
  - Booking history (+40 points)
  - Bio keywords (+30 points)
  - Popular categories (+15 points)
  - Randomness (+0-15 points)
- ✓ Shows top 5 matches
- ✓ Reason explains why recommended

**Testing Match Algorithm:**

```
Scenario 1: User with cooking history
- Books "Italian Cooking" service
- AI should recommend more cooking services
- Match score should be 80-90%

Scenario 2: User with "photography" in bio
- AI should recommend photography services
- Match score should be 70-85%

Scenario 3: New user (no history)
- AI should recommend popular services
- Match score should be 15-30%
```

---

### ✅ 6. Real-Time Chat

**Test Flow:**

```
1. User A books service from User B
2. User B confirms booking
3. Both users click "Chat" button
4. Navigate to /bookings/[id]
5. User A types "Hello!"
6. User A presses Enter
7. Message appears immediately for User A
8. Message appears in real-time for User B (no refresh needed)
9. Both users send multiple messages
10. Scroll to see history
```

**Expected Results:**

- ✓ Messages send instantly
- ✓ Real-time sync via Supabase Realtime
- ✓ Message history persists
- ✓ Avatars and names show correctly
- ✓ Auto-scroll to latest message
- ✓ Sender messages on right, receiver on left

**Database Verification:**

```sql
-- Check messages table
SELECT * FROM messages
WHERE sender_id = 'user-a-uuid'
  AND receiver_id = 'user-b-uuid'
ORDER BY created_at;

-- Check real-time subscription
-- Open browser console, should see:
"Realtime subscription established"
```

---

### ✅ 7. Video Conferencing

**Test Flow:**

```
1. In booking chat page
2. Click "Start Call" button (Video icon)
3. Jitsi Meet loads in fullscreen
4. See own camera preview
5. Other user joins same room
6. Test video controls:
   - Toggle camera on/off
   - Toggle microphone on/off
   - Screen share
   - Chat (in-call)
   - Backgrounds
   - Recording
7. Leave meeting
8. Redirected back to chat
```

**Expected Results:**

- ✓ Video call loads instantly
- ✓ Unique room per booking (radius-session-{id})
- ✓ Both users can join simultaneously
- ✓ All controls work
- ✓ No API key required (Jitsi free tier)
- ✓ Fullscreen mode works

**Browser Requirements:**

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (macOS/iOS 14.3+)
- Camera/mic permissions required

---

### ✅ 8. AI Chatbot

**Test Flow:**

```
1. Look for floating chatbot button (bottom-right)
2. Click chatbot button
3. Chat window opens with greeting
4. See 8 suggested questions
5. Click "How do I create a service?"
6. Bot responds with detailed answer
7. Type custom question: "payment methods"
8. Bot matches keywords and responds
9. Type unrelated question: "weather"
10. Bot responds with default message
11. Close chatbot
```

**Expected Results:**

- ✓ Chatbot available on all pages
- ✓ 8 predefined topics covered
- ✓ Keyword matching works
- ✓ Suggested questions clickable
- ✓ Chat history persists during session
- ✓ Professional, helpful responses

**Predefined Topics:**

1. Creating services
2. Booking services
3. Payments & credits
4. Cancellations
5. Messaging
6. Conflict resolution
7. Reminders
8. Profile management

---

### ✅ 9. Credit System

**Test Flow:**

```
1. New user signs up
2. Check credits in header (should show 100)
3. Complete a service as provider
4. Credits increase to 110
5. Book a service as seeker
6. Credits decrease to 100
7. Navigate to credit history
8. See all transactions listed
```

**Expected Results:**

- ✓ New users start with 100 credits
- ✓ Providers earn 10 credits per completed booking
- ✓ Seekers spend 10 credits per booking
- ✓ Credit balance updates automatically
- ✓ Transaction history tracked

**Database Verification:**

```sql
-- Check initial credits
SELECT * FROM user_credits WHERE user_id = 'new-user-uuid';
-- Should show balance = 100

-- Check transactions
SELECT * FROM credit_transactions
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC;

-- Verify trigger works
-- Mark booking as completed
UPDATE bookings SET status = 'completed' WHERE id = 123;

-- Check if credits updated
SELECT * FROM user_credits WHERE user_id = 'provider-uuid';
-- Balance should increase by 10
```

---

## Deployment Steps

### Option 1: Deploy to Vercel (Recommended)

**Step 1: Install Vercel CLI**

```powershell
npm install -g vercel
```

**Step 2: Login to Vercel**

```powershell
vercel login
```

**Step 3: Deploy**

```powershell
vercel
```

Follow prompts:

- Link to existing project? → No
- Project name? → your-skill-app
- Directory? → ./
- Build command? → `npm run build` (default)
- Output directory? → `.next` (default)

**Step 4: Add Environment Variables**

```powershell
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add NEXT_PUBLIC_SITE_URL
```

**Step 5: Deploy to Production**

```powershell
vercel --prod
```

---

### Option 2: Deploy to Netlify

**Step 1: Install Netlify CLI**

```powershell
npm install -g netlify-cli
```

**Step 2: Login**

```powershell
netlify login
```

**Step 3: Initialize**

```powershell
netlify init
```

**Step 4: Configure Build Settings**

- Build command: `npm run build`
- Publish directory: `.next`
- Functions directory: (leave empty)

**Step 5: Add Environment Variables**
In Netlify Dashboard:

- Site Settings → Environment Variables
- Add all required env vars

**Step 6: Deploy**

```powershell
netlify deploy --prod
```

---

## Post-Deployment Verification

### 1. Smoke Tests

```
✓ Landing page loads
✓ Sign up works
✓ Email verification works
✓ Profile setup works
✓ Map loads correctly
✓ Services show within radius
✓ Booking creation works
✓ Chat sends/receives messages
✓ Video call launches
✓ AI recommendations show
✓ Chatbot responds
```

### 2. Performance Checks

```powershell
# Run Lighthouse audit
npx lighthouse https://yourapp.vercel.app --view
```

**Target Scores:**

- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 90+

### 3. Security Checks

```
✓ HTTPS enabled
✓ RLS policies active
✓ No sensitive data in client
✓ CORS configured properly
✓ Auth tokens secured
```

### 4. Database Health

```sql
-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check for slow queries
SELECT * FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```

---

## Troubleshooting

### Issue 1: Map Not Loading

**Symptoms:** White screen where map should be, console error: "Map container not found"

**Solutions:**

```typescript
// Ensure dynamic import with ssr: false
const Map = dynamic(() => import("@/components/map"), {
  ssr: false,
});

// Add key prop to force remount
<Map key={`${userLocation}-${view}`} />;
```

---

### Issue 2: Popup Click Errors

**Symptoms:** "Cannot read properties of null" when clicking inside map popup

**Solution:**

```typescript
// Add stopPropagation to all clickable elements in popup
<Card onClick={(e) => e.stopPropagation()}>
  <Button
    onClick={(e) => {
      e.stopPropagation();
      handleAction();
    }}
  >
    Click Me
  </Button>
</Card>
```

---

### Issue 3: Realtime Not Working

**Symptoms:** Messages not appearing in real-time, need to refresh

**Solutions:**

```typescript
// 1. Check Supabase Realtime enabled in project settings
// 2. Verify channel subscription
const channel = supabase
  .channel("chat_room")
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "messages",
    },
    (payload) => {
      console.log("New message:", payload);
    }
  )
  .subscribe((status) => {
    console.log("Subscription status:", status);
  });

// 3. Check RLS policies allow SELECT on messages table
```

---

### Issue 4: Video Call Not Loading

**Symptoms:** Blank screen, Jitsi not loading

**Solutions:**

```typescript
// 1. Check if Jitsi script loaded
console.log("JitsiMeetExternalAPI" in window); // Should be true

// 2. Verify container element exists
const container = document.getElementById("jitsi-container");
console.log("Container found:", !!container);

// 3. Check browser console for CORS errors
// 4. Ensure HTTPS in production (Jitsi requires secure context)
```

---

### Issue 5: Geolocation Permission Denied

**Symptoms:** Location not saving, map shows default location

**Solutions:**

```typescript
// 1. Handle permission denial gracefully
if (navigator.permissions) {
  navigator.permissions.query({ name: "geolocation" }).then((result) => {
    if (result.state === "denied") {
      // Show manual location input
      toast.error("Location permission denied. Please enter manually.");
    }
  });
}

// 2. Provide manual location input as fallback
<Input
  placeholder="Enter your address"
  // Geocode address to coordinates
/>;
```

---

### Issue 6: Build Errors

**Symptoms:** `npm run build` fails with TypeScript errors

**Solutions:**

```powershell
# Check for type errors
npm run lint

# Fix common issues:
# 1. Add proper types to all props
# 2. Handle null/undefined cases
# 3. Add 'use client' directive to client components
# 4. Fix any vs specific types
```

---

## Monitoring & Maintenance

### 1. Set Up Monitoring

**Vercel:** Built-in analytics available
**Sentry:** Error tracking (recommended)

```powershell
npm install @sentry/nextjs
```

### 2. Database Backups

**Supabase:** Automatic daily backups on Pro plan
**Manual Backup:**

```sql
-- Export database
pg_dump your_database > backup.sql

-- Restore database
psql your_database < backup.sql
```

### 3. Performance Monitoring

```sql
-- Monitor query performance
SELECT * FROM pg_stat_statements
WHERE total_exec_time > 1000
ORDER BY total_exec_time DESC;

-- Check cache hit ratio
SELECT
  sum(heap_blks_read) AS heap_read,
  sum(heap_blks_hit) AS heap_hit,
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) AS ratio
FROM pg_statio_user_tables;
-- Ratio should be > 0.90
```

---

## Success Checklist

Before considering deployment complete:

- [ ] All features tested manually
- [ ] Database schema deployed
- [ ] Environment variables configured
- [ ] HTTPS enabled
- [ ] RLS policies active
- [ ] Email verification working (if configured)
- [ ] Map loads without errors
- [ ] Real-time chat works
- [ ] Video calls launch successfully
- [ ] AI recommendations show
- [ ] Chatbot responds correctly
- [ ] Credits system functional
- [ ] Reviews can be submitted
- [ ] No console errors
- [ ] Lighthouse score > 90
- [ ] Mobile responsive tested
- [ ] Error handling works
- [ ] Loading states show properly
- [ ] Toast notifications appear
- [ ] Navigation works smoothly
- [ ] Authentication persists

---

**Congratulations!** 🎉 Your skill-sharing platform is now live and ready for users!

---

**Need Help?**

- Check [Next.js Docs](https://nextjs.org/docs)
- Check [Supabase Docs](https://supabase.com/docs)
- Check [Leaflet Docs](https://leafletjs.com/reference.html)
- Open GitHub issue in repository

**Last Updated:** October 25, 2025
