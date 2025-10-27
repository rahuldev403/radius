# 📍 Radius - Hyperlocal Skill Sharing Platform

> **Connecting Communities, One Skill at a Time**

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ecf8e?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

## 🌟 What is Radius?

**Radius** is a revolutionary hyperlocal platform that connects neighbors based on skills and location. Whether you're looking for a guitar teacher, a web developer, or a personal trainer in your neighborhood, Radius makes it effortless to find and connect with talented people nearby.

### ✨ Key Highlights

- 🗺️ **Hyperlocal Discovery** - Find services within your exact radius (1-50km)
- 🤖 **AI-Powered Recommendations** - Smart chatbot suggests relevant services
- 💬 **Real-time Chat** - WebSocket-based instant messaging
- 📅 **Smart Booking System** - Schedule appointments with conflict detection
- 🎨 **Stunning Glassmorphism UI** - Modern, beautiful, and accessible design
- 🔒 **Secure Authentication** - Email OTP verification via Supabase
- ⭐ **Review & Rating System** - Build trust in your community
- 🏆 **Credit System** - Earn credits by providing services
- ♿ **Accessibility First** - High contrast, screen reader friendly, dyslexia support
- 🌍 **Interactive Maps** - Leaflet-powered location visualization

## 🚀 Quick Start (Local Development)

### Prerequisites

- Node.js 18+ installed
- Supabase account
- Gmail account for SMTP (or any SMTP provider)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd your-skill-app
npm install
```

### 2. Environment Setup

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

**Required variables:**

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for user creation)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` - Email configuration

### 3. Database Setup

Run the schema in your Supabase SQL editor:

```bash
# Use supabase-schema.sql file
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🚀 Features

### For Service Seekers

- 🔍 Discover local talent within customizable radius
- 🤝 Book services instantly with real-time availability
- 💬 Chat with providers before booking
- ⭐ Leave reviews and ratings
- 📊 AI recommendations based on your interests

### For Service Providers

- 💼 Showcase your skills with detailed profiles
- 📅 Manage bookings and availability
- 💰 Earn credits and build reputation
- 📈 Track your performance dashboard
- 🎯 Target customers in your local area

## 🎨 UI/UX Excellence

Our design philosophy combines:

- **Glassmorphism** - Beautiful translucent cards with backdrop blur
- **Gradient Mesh Backgrounds** - Eye-catching animated gradients
- **Smooth Animations** - Framer Motion & GSAP powered transitions
- **Scroll Effects** - Parallax and fade effects on scroll
- **Consistent Theme** - Emerald & Teal color palette throughout
- **Dark Mode Support** - Full dark theme implementation
- **Responsive Design** - Looks perfect on all devices

## 🛠️ Tech Stack

### Frontend

- **Next.js 16** - React framework with App Router
- **React 19** - Latest React features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **GSAP** - Advanced scroll animations
- **Leaflet** - Interactive maps

### Backend & Database

- **Supabase** - PostgreSQL database with real-time subscriptions
- **PostGIS** - Geospatial queries for location-based features
- **WebSocket** - Real-time chat functionality
- **Edge Functions** - Serverless API routes

### UI Components

- **Radix UI** - Accessible component primitives
- **shadcn/ui** - Beautiful component library
- **Lucide Icons** - Modern icon set
- **Sonner** - Elegant toast notifications

## 📦 Installation

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase account

### Setup Steps

1. **Clone the repository**

```bash
git clone https://github.com/rahuldev403/radius.git
cd radius
```

2. **Install dependencies**

```bash
npm install
# or
pnpm install
```

3. **Set up environment variables**

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Run database migrations**

Execute the SQL files in `supabase-migrations/` in your Supabase SQL editor:

- `00-profiles-table.sql`
- `01-initialize-existing-user-profiles.sql`
- `02-services-and-bookings.sql`
- `03-messages-table.sql`
- `avatars-storage.sql`
- `community-projects.sql`
- `incentive-system.sql`

5. **Start the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser!

## 🌐 Deployment Configuration

### Vercel Deployment

1. **Set Environment Variable in Vercel Dashboard**

Go to your Vercel project settings → Environment Variables and add:

```env
NEXT_PUBLIC_SITE_URL=https://radius-h9zo.vercel.app
```

**Important:** This variable tells the app what URL to use for OAuth redirects.

2. **Configure Supabase Redirect URLs**

In your Supabase Dashboard → Authentication → URL Configuration, add these URLs:

**Site URL:**

```
https://radius-h9zo.vercel.app
```

**Redirect URLs (add all of these):**

```
https://radius-h9zo.vercel.app/auth/callback
https://radius-h9zo.vercel.app/
http://localhost:3000/auth/callback
http://localhost:3000/
```

3. **Update Google OAuth Settings**

In Google Cloud Console → APIs & Services → Credentials:

**Authorized JavaScript origins:**

```
https://radius-h9zo.vercel.app
```

**Authorized redirect URIs:**

```
https://radius-h9zo.vercel.app/auth/callback
```

4. **Redeploy**

After updating environment variables in Vercel, trigger a new deployment:

- Go to Vercel Dashboard → Deployments → Redeploy

**✅ Your OAuth should now work correctly on the deployed site!**

## 🗂️ Project Structure

```
your-skill-app/
├── app/                      # Next.js App Router
│   ├── api/                 # API routes
│   ├── auth/                # Authentication pages
│   ├── dashboard/           # User dashboard
│   ├── home/                # Main app (map view)
│   ├── my-bookings/         # Bookings management
│   ├── projects/            # Community projects
│   └── services/            # Service details
├── components/              # React components
│   ├── ui/                  # shadcn/ui components
│   ├── LandingPage.tsx      # Landing page
│   ├── Navbar.tsx           # Navigation
│   ├── AIChatbot.tsx        # AI assistant
│   └── ...
├── lib/                     # Utilities
│   ├── supabase.ts          # Supabase client
│   ├── websocket-*.ts       # WebSocket setup
│   └── utils.ts             # Helper functions
└── supabase-migrations/     # Database schema
```

## 🎯 Core Functionalities

### 1. Location-Based Search

```typescript
// Find services within radius using PostGIS
const { data } = await supabase.rpc("get_services_nearby", {
  user_lat: latitude,
  user_lng: longitude,
  distance_meters: radius * 1000,
});
```

### 2. Real-time Chat

```typescript
// WebSocket connection for instant messaging
const ws = new WebSocket("ws://localhost:3001");
ws.on("message", handleNewMessage);
```

### 3. Smart Booking System

- Conflict detection prevents double bookings
- Email notifications for confirmations
- Reminder system for upcoming appointments

### 4. AI Recommendations

- Natural language processing
- Context-aware suggestions
- Personalized based on location and preferences

## 🌈 Design System

### Color Palette

```css
/* Primary Colors */
--emerald-500: #10b981
--teal-500: #14b8a6
--cyan-500: #06b6d4

/* Gradients */
gradient-primary: linear-gradient(135deg, #10b981 0%, #14b8a6 100%)
gradient-secondary: linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)
```

### Typography

- Headings: Geist Sans (Bold/Extrabold)
- Body: Geist Sans (Regular/Medium)
- Code: Geist Mono

## 🏆 Hackathon Highlights

This project showcases:

- ✅ Full-stack development skills
- ✅ Modern UI/UX design principles
- ✅ Real-time communication
- ✅ Geospatial data handling
- ✅ Authentication & authorization
- ✅ Responsive & accessible design
- ✅ Performance optimization
- ✅ Clean, maintainable code

## 📸 Screenshots

### Landing Page

Beautiful glassmorphism design with animated gradients and smooth scroll effects.

### Dashboard

Real-time stats, quick actions, and activity feed with stunning card layouts.

### Map View

Interactive Leaflet map showing nearby services with custom markers and radius visualization.

### Chat Interface

Real-time messaging with typing indicators and read receipts.

## 🚀 Deployment

This application is designed for easy deployment with separated concerns:

### Quick Deploy

**1. WebSocket Server → Railway**

```bash
# See STEP_BY_STEP_DEPLOYMENT.md for detailed instructions
```

**2. Next.js App → Vercel**

```bash
# One-click deployment from GitHub
```

### Documentation

- 📖 **[Complete Deployment Guide](STEP_BY_STEP_DEPLOYMENT.md)** - Full walkthrough
- ✅ **[Deployment Checklist](DEPLOYMENT_CHECKLIST.md)** - Track your progress
- ⚡ **[Quick Reference](QUICK_REFERENCE_CARD.md)** - Commands and URLs
- 🎨 **[Visual Guide](VISUAL_DEPLOYMENT_GUIDE.md)** - Architecture diagrams

### Architecture

```
┌─────────────┐         ┌─────────────┐
│   Vercel    │◄───────►│   Railway   │
│  Next.js    │   WSS   │  WebSocket  │
└──────┬──────┘         └─────────────┘
       │
       ▼
┌─────────────┐
│  Supabase   │
│  Database   │
└─────────────┘
```

### Cost

- **Vercel:** Free tier
- **Railway:** ~$5/month
- **Supabase:** Free tier
- **Total:** ~$5/month

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Rahul Dev**

- GitHub: [@rahuldev403](https://github.com/rahuldev403)
- Repository: [radius](https://github.com/rahuldev403/radius)

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Supabase for the backend infrastructure
- shadcn for the beautiful component library
- All open-source contributors

---

<div align="center">

**Built with ❤️ for hackathon**

_Connecting communities, one skill at a time_ 🌟

[⬆ Back to Top](#-radius---hyperlocal-skill-sharing-platform)

</div>

#   r a d i u s 
 
 
