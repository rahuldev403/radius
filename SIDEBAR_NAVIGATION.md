# Left Sidebar Navigation - ChatGPT/Supabase Style 🎨

## ✨ What's New

Your app now has a **beautiful left sidebar navigation** just like ChatGPT and Supabase!

### Features:

- ✅ **Fixed left sidebar** on all authenticated pages
- ✅ **Collapsible menu** - Toggle between full and icon-only view
- ✅ **Smooth animations** - Framer Motion powered transitions
- ✅ **Dark theme** - Sleek dark gradient background
- ✅ **Active indicators** - Animated highlight for current page
- ✅ **Tooltips** - Hover on icons in collapsed mode to see labels
- ✅ **Responsive** - Auto-collapses on mobile devices
- ✅ **Always visible** - Persistent across all pages (except landing & auth)

## 🎯 Navigation Items

### Main Menu:

1. 🏠 **Dashboard** - `/dashboard`
2. 📍 **Explore** - `/home`
3. 📅 **Bookings** - `/my-bookings`
4. 👤 **Profile** - `/account`

### Action Buttons:

- ➕ **Create Service** - Quick access to create new service
- 🤖 **AI Chatbot** - Your AI assistant
- 🚪 **Sign Out** - Logout button at bottom

## 🎨 Design Details

### Colors:

- Background: Dark gradient (gray-950 → gray-900)
- Active state: Emerald-to-teal gradient
- Hover state: Gray-800 with 50% opacity
- Text: White for labels, gray-400 for inactive icons

### Animations:

- Width transitions: 280px (expanded) ↔ 80px (collapsed)
- Smooth 300ms easing
- Active indicator slides between menu items
- Fade in/out for text labels

### Widths:

- **Expanded**: 280px - Shows icons + full text
- **Collapsed**: 80px - Shows icons only

## 📱 Pages Configuration

### With Sidebar:

- `/dashboard` - Dashboard page
- `/home` - Explore services
- `/my-bookings` - User bookings
- `/account` - Profile settings
- `/services/*` - All service pages

### Without Sidebar (Full Screen):

- `/` - Landing page
- `/auth/*` - Authentication pages
- `/bookings/[id]` - Chat page (full-screen)
- `/test-email` - Test pages

## 🎮 Usage

### Toggle Sidebar:

- Click the **chevron button** (◄ ►) at the top-right of sidebar
- On mobile: Use the **floating menu button** (bottom-right)

### Tooltips:

- When collapsed, hover over any icon to see its label
- Tooltips appear on the right side with black background

## 🔧 Technical Implementation

### Components Created:

1. **`components/Sidebar.tsx`** - Main sidebar component
2. **`components/AppLayout.tsx`** - Layout wrapper with context
3. Updated **`app/layout.tsx`** - Integrated AppLayout

### State Management:

- Uses React Context API for sidebar state
- `useSidebar()` hook provides:
  - `isCollapsed` - Current state
  - `setIsCollapsed` - Toggle function

### Auto-responsive:

```typescript
// Auto-collapses on screens < 768px
if (window.innerWidth < 768) {
  setIsCollapsed(true);
}
```

## 🚀 Benefits

### User Experience:

- ✅ Consistent navigation across all pages
- ✅ More screen space in collapsed mode
- ✅ Quick access to all main features
- ✅ Visual feedback for current location
- ✅ Professional look and feel

### Developer Experience:

- ✅ Centralized navigation logic
- ✅ Easy to add new menu items
- ✅ Reusable layout component
- ✅ Context-based state management
- ✅ Type-safe with TypeScript

## 📝 How to Add New Menu Items

Edit `components/Sidebar.tsx`:

```typescript
const navItems = [
  { icon: Home, label: "Dashboard", path: "/dashboard" },
  { icon: MapPin, label: "Explore", path: "/home" },
  { icon: Calendar, label: "Bookings", path: "/my-bookings" },
  { icon: User, label: "Profile", path: "/account" },
  // Add your new item here:
  { icon: YourIcon, label: "New Page", path: "/new-page" },
];
```

## 🎯 Next Steps

1. Test the sidebar on different screen sizes
2. Try collapsing/expanding the menu
3. Navigate between pages to see active indicators
4. Check tooltips in collapsed mode
5. Verify mobile experience with floating button

## 💡 Tips

- **Desktop**: Use the toggle button for more screen space
- **Mobile**: Sidebar auto-collapses for better UX
- **Navigation**: Active page is highlighted with gradient
- **AI Chatbot**: Always accessible from sidebar
- **Quick Create**: "Create Service" button always visible

Enjoy your new professional sidebar navigation! 🎉
