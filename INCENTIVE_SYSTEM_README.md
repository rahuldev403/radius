# Incentive Mechanism - Credits & Badges System

## Overview

A comprehensive reward system that encourages participation and recognizes outstanding contributions through credits and achievement badges.

## Features Implemented

✅ Credit balance management for all users  
✅ Give credits to service providers  
✅ Transaction history tracking  
✅ 8-tier badge system (Bronze → Diamond)  
✅ Automatic badge assignment based on credits received  
✅ Credits dashboard with analytics  
✅ User badge showcase on profiles  
✅ Compact badge display throughout the app

## Database Setup

### Step 1: Run the Migration

Execute the SQL migration to create the incentive system:

```bash
# Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase-migrations/incentive-system.sql`
4. Paste and execute the SQL
```

### Step 2: Verify Tables

After running the migration, verify these tables exist:

- `user_credits` - Tracks credit balances
- `credit_transactions` - Records all transactions
- `badges` - Defines available badges
- `badge_assignments` - Tracks earned badges

## Credit System

### How Credits Work

1. **Starting Balance**: New users receive **100 credits** automatically upon signup
2. **Earning Credits**: Users earn credits through:

   - Platform bonuses
   - Completing bookings
   - Community contributions
   - Referrals

3. **Spending Credits**: Users can give credits to:

   - Service providers (tips/rewards)
   - Other community members
   - Community project donations

4. **Credit Stats Tracked**:
   - **Balance** - Current available credits
   - **Total Earned** - All credits received from platform
   - **Total Received** - Credits given by other users (determines badge tier)
   - **Total Spent** - Credits given to others

### Transaction Types

| Type                 | Description                  | Direction       |
| -------------------- | ---------------------------- | --------------- |
| `tip`                | Reward for great service     | User → Provider |
| `reward`             | Recognition for contribution | User → User     |
| `bonus`              | Platform reward              | System → User   |
| `signup`             | Welcome bonus                | System → User   |
| `referral`           | Referral reward              | System → User   |
| `booking_completion` | Booking completion bonus     | System → User   |
| `service_creation`   | New service bonus            | System → User   |
| `project_completion` | Project completion reward    | System → User   |
| `community_donation` | Donate to community cause    | User → System   |
| `admin_grant`        | Admin awarded credits        | Admin → User    |

## Badge System

### Badge Tiers

The system features 8 progressive badges based on **total credits received**:

| Badge                  | Tier     | Credits Required | Icon | Description                   |
| ---------------------- | -------- | ---------------- | ---- | ----------------------------- |
| **Newcomer**           | Bronze   | 0                | 🌟   | Welcome to the community!     |
| **Rising Star**        | Bronze   | 100              | ⭐   | Making an impact!             |
| **Trusted Helper**     | Silver   | 250              | 🤝   | People appreciate your help!  |
| **Community Champion** | Silver   | 500              | 🏆   | Valued member!                |
| **Service Hero**       | Gold     | 1,000            | 🦸   | Outstanding service provider! |
| **Expert Provider**    | Gold     | 2,500            | 💎   | Your expertise shines!        |
| **Master Contributor** | Platinum | 5,000            | 👑   | Exceptional contributions!    |
| **Legend**             | Diamond  | 10,000           | 🌠   | You're a legend!              |

### Badge Colors

- **Bronze**: Amber gradient
- **Silver**: Gray gradient
- **Gold**: Yellow/Emerald gradient
- **Platinum**: Cyan gradient
- **Diamond**: Pink gradient

### Automatic Badge Assignment

Badges are automatically awarded when users reach credit thresholds. The system:

1. Monitors total credits received
2. Checks badge requirements after each transaction
3. Assigns all eligible badges instantly
4. Never revokes badges (permanent achievements)

## Components Created

### 1. GiveCreditsModal

**File**: `components/GiveCreditsModal.tsx`

A modal for giving credits to providers with:

- Quick amount selection (10, 25, 50, 100)
- Custom amount input
- Optional thank you message
- Real-time balance display
- Form validation
- Success/error feedback

**Usage**:

```tsx
<GiveCreditsModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  providerId="uuid-here"
  providerName="John Doe"
  providerAvatar="https://..."
  bookingId={123} // Optional
  serviceId={456} // Optional
/>
```

### 2. UserBadges

**File**: `components/UserBadges.tsx`

Displays user's earned badges with two modes:

**Full View** (`compact={false}`):

- Stats cards (total credits, badges earned)
- Highlighted highest-tier badge
- Grid of all earned badges
- Hover tooltips with details

**Compact View** (`compact={true}`):

- Shows up to 3 badges as icons
- "+X more" indicator
- Hover tooltips
- Perfect for profile headers

**Usage**:

```tsx
{
  /* Full dashboard */
}
<UserBadges userId="uuid" showTitle={true} compact={false} />;

{
  /* Compact profile display */
}
<UserBadges userId="uuid" showTitle={false} compact={true} />;
```

### 3. Credits Dashboard

**File**: `app/credits/page.tsx`

Full credits management dashboard with:

- 4 stat cards (Balance, Earned, Received, Spent)
- Transaction history with filters
- User badge showcase
- Detailed transaction info with avatars
- Real-time updates

**Route**: `/credits`

## Database Functions

### give_credits()

Give credits from one user to another:

```sql
SELECT give_credits(
  p_from_user_id := 'sender-uuid',
  p_to_user_id := 'receiver-uuid',
  p_amount := 50,
  p_transaction_type := 'tip',
  p_reason := 'Great service!',
  p_reference_type := 'booking',
  p_reference_id := 123
);
```

Returns:

```json
{
  "success": true,
  "new_balance": 150
}
```

### award_credits()

Award credits from the system:

```sql
SELECT award_credits(
  p_user_id := 'user-uuid',
  p_amount := 100,
  p_transaction_type := 'bonus',
  p_reason := 'Completed 10 bookings',
  p_reference_type := 'milestone',
  p_reference_id := NULL
);
```

### check_and_assign_badges()

Automatically called after credits are given/awarded. Checks eligibility and assigns badges.

## Security (RLS Policies)

### User Credits Table

- ✅ Anyone can **view** all user credits (for leaderboard)
- ❌ Direct updates **disabled** (must use functions)

### Credit Transactions Table

- ✅ Users can **view** their own transactions
- ❌ Direct inserts **disabled** (must use functions)

### Badges Table

- ✅ Anyone can **view** all badges

### Badge Assignments Table

- ✅ Anyone can **view** badge assignments
- ❌ Direct inserts **disabled** (automatic via function)

## Integration Points

### Service Detail Page

**File**: `app/services/[id]/page.tsx`

Added:

- "Give Credits" button in provider card header
- Badge showcase below provider bio
- Modal integration for credit transfers

### Navbar

**File**: `components/Navbar.tsx`

Added:

- "Credits" navigation link with Coins icon
- Routes to `/credits` dashboard

## Usage Examples

### Give Credits to Provider

```typescript
// Call via Supabase RPC
const { data, error } = await supabase.rpc("give_credits", {
  p_from_user_id: currentUser.id,
  p_to_user_id: providerId,
  p_amount: 50,
  p_transaction_type: "tip",
  p_reason: "Excellent service!",
  p_reference_type: "booking",
  p_reference_id: bookingId,
});

if (data?.success) {
  toast.success(`Sent ${amount} credits!`);
}
```

### Award System Credits

```typescript
// Award bonus for completing booking
const { data } = await supabase.rpc("award_credits", {
  p_user_id: userId,
  p_amount: 25,
  p_transaction_type: "booking_completion",
  p_reason: "Completed booking #123",
  p_reference_type: "booking",
  p_reference_id: 123,
});
```

### Fetch User Balance

```typescript
const { data } = await supabase
  .from("user_credits")
  .select("balance, total_earned, total_received, total_spent")
  .eq("user_id", userId)
  .single();

console.log(`Balance: ${data.balance} credits`);
```

### Fetch User Badges

```typescript
const { data } = await supabase
  .from("badge_assignments")
  .select(
    `
    earned_at,
    badge:badges (*)
  `
  )
  .eq("user_id", userId)
  .order("earned_at", { ascending: false });

console.log(`Earned ${data.length} badges`);
```

## Automatic Triggers

1. **User Signup**: Automatically creates credit account with 100 credits
2. **Give Credits**: Automatically checks and assigns new badges to receiver
3. **Award Credits**: Automatically updates earned/received totals

## UI/UX Features

- **Gradient Styling**: Amber/orange gradients for credits theme
- **Animations**: Framer Motion for smooth transitions
- **Responsive Design**: Works on all screen sizes
- **Real-time Updates**: Immediate feedback on transactions
- **Toast Notifications**: Success/error messages
- **Form Validation**: Prevents invalid transactions
- **Balance Checking**: Can't spend more than available
- **Loading States**: Spinners during async operations

## Customization Options

### Adjust Starting Balance

Edit migration file or update function:

```sql
-- Change starting balance from 100 to 200
VALUES (NEW.id, 200, 200)
```

### Add New Badge Tier

```sql
INSERT INTO badges (name, description, icon, tier, color, credits_required)
VALUES (
  'Grandmaster',
  'Ultimate achievement!',
  '💫',
  'diamond',
  'indigo',
  25000
);
```

### Add New Transaction Type

Update CHECK constraint in migration:

```sql
CONSTRAINT valid_transaction_type CHECK (transaction_type IN (
  'tip', 'reward', 'bonus', ..., 'your_new_type'
))
```

## Leaderboard Feature (Future)

Create a leaderboard query:

```sql
SELECT
  u.full_name,
  u.avatar_url,
  uc.total_received,
  COUNT(ba.id) as badge_count
FROM user_credits uc
JOIN profiles u ON u.id = uc.user_id
LEFT JOIN badge_assignments ba ON ba.user_id = uc.user_id
GROUP BY u.full_name, u.avatar_url, uc.total_received
ORDER BY uc.total_received DESC
LIMIT 10;
```

## Testing Checklist

- [ ] Run SQL migration successfully
- [ ] Verify new user gets 100 credits
- [ ] Give credits to another user
- [ ] Check balance deducted correctly
- [ ] Verify transaction appears in history
- [ ] Confirm badge auto-assigned at threshold
- [ ] Test insufficient balance error
- [ ] Test self-transfer prevention
- [ ] View credits dashboard
- [ ] Check badge display on profile
- [ ] Test Give Credits modal on service page
- [ ] Verify Credits nav link works

## Troubleshooting

### "Insufficient credits" error

- Check user's current balance
- Ensure amount is less than or equal to balance
- Verify user_credits record exists

### Badge not showing up

- Check total_received in user_credits
- Verify badge_assignments table
- Re-run check_and_assign_badges function manually

### Transaction not appearing

- Check RLS policies
- Verify user is authenticated
- Check credit_transactions table directly

### Modal not opening

- Verify GiveCreditsModal is imported
- Check showCreditsModal state
- Ensure provider ID is valid

## Future Enhancements

Potential additions:

- [ ] Credit purchase with real money
- [ ] Credit expiration system
- [ ] Monthly credit allowance
- [ ] Leaderboard page
- [ ] Badge showcase page
- [ ] Transfer credits to community projects
- [ ] Charity donation option
- [ ] Credit gifting on special occasions
- [ ] Bulk credit operations
- [ ] Credit history export

---

**Status:** ✅ Fully Implemented  
**Last Updated:** 2024  
**Version:** 1.0.0
