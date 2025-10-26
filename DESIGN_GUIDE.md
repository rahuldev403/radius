# 🎨 Visual Design Guide - Radius

## 🌈 Color Palette

### Primary Colors

```css
Emerald-50:  #f0fdf4  /* Light backgrounds */
Emerald-500: #10b981  /* Primary actions */
Emerald-600: #059669  /* Primary hover */
Emerald-400: #34d399  /* Dark mode primary */
```

### Secondary Colors

```css
Teal-500: #14b8a6  /* Secondary actions */
Teal-600: #0d9488  /* Secondary hover */
Cyan-500: #06b6d4  /* Accents */
```

### Neutral Colors

```css
Slate-50:  #f8fafc  /* Light backgrounds */
Slate-900: #0f172a  /* Dark backgrounds */
Slate-600: #475569  /* Body text */
```

## 🎭 Component Styles

### Glassmorphism Cards

```tsx
<div className="glass-card p-6 rounded-2xl">{/* Content */}</div>
```

**Effect**: Translucent white background with blur

### Gradient Buttons

```tsx
<Button className="gradient-primary text-white">Click Me</Button>
```

**Effect**: Emerald to Teal gradient

### Gradient Text

```tsx
<h1 className="gradient-text">Beautiful Heading</h1>
```

**Effect**: Multi-color gradient text

## ✨ Animation Patterns

### Card Hover

```tsx
<motion.div whileHover={{ y: -8, scale: 1.02 }} className="glass-card">
  {/* Card content */}
</motion.div>
```

### Fade In on Scroll

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
>
  {/* Content */}
</motion.div>
```

### Floating Elements

```tsx
<div className="animate-float">{/* Floating orb */}</div>
```

## 📐 Spacing System

### Padding

- `p-4` (1rem) - Tight spacing
- `p-6` (1.5rem) - Standard card padding
- `p-8` (2rem) - Large sections
- `p-12` (3rem) - Hero sections

### Gaps

- `gap-4` (1rem) - Standard gap
- `gap-6` (1.5rem) - Between cards
- `gap-8` (2rem) - Section gaps

## 🔤 Typography Scale

### Headings

```tsx
<h1 className="text-6xl md:text-8xl font-extrabold">
  Hero Title
</h1>

<h2 className="text-4xl md:text-6xl font-bold">
  Section Title
</h2>

<h3 className="text-2xl font-bold">
  Card Title
</h3>
```

### Body Text

```tsx
<p className="text-lg text-slate-600 dark:text-slate-300">
  Large body text
</p>

<p className="text-base text-slate-600 dark:text-slate-400">
  Standard text
</p>

<p className="text-sm text-slate-500">
  Small text / captions
</p>
```

## 🎯 Icon Usage

### With Gradient Background

```tsx
<div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
  <Icon className="w-6 h-6 text-white" />
</div>
```

### Standalone

```tsx
<Icon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
```

## 📦 Layout Patterns

### Grid - Stats Cards

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {stats.map((stat) => (
    <Card key={stat.title}>...</Card>
  ))}
</div>
```

### Flex - Button Group

```tsx
<div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
  <Button>Primary</Button>
  <Button variant="outline">Secondary</Button>
</div>
```

## 🌟 Special Effects

### Scroll Indicator

```tsx
<motion.div
  animate={{ y: [0, 10, 0] }}
  transition={{ repeat: Infinity, duration: 2 }}
  className="absolute bottom-10"
>
  <div className="w-6 h-10 border-2 border-emerald-500 rounded-full" />
</motion.div>
```

### Shimmer Loading

```tsx
<div className="shimmer h-4 bg-slate-200 rounded" />
```

### Pulse Dot

```tsx
<div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
```

## 🎨 Page Backgrounds

### Light Mode

```tsx
<div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
  {/* Content */}
</div>
```

### Dark Mode

```tsx
<div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
  {/* Content */}
</div>
```

## 🔧 Utility Classes Reference

### Glassmorphism

- `glass` - Basic glass effect
- `glass-dark` - Dark variant
- `glass-card` - Enhanced with hover

### Gradients

- `gradient-primary` - Emerald to Teal
- `gradient-secondary` - Teal to Cyan
- `gradient-text` - Text gradient
- `gradient-mesh` - Radial mesh

### Animations

- `animate-float` - Floating motion
- `animate-slide-in-up` - Slide from bottom
- `animate-slide-in-down` - Slide from top
- `animate-fade-in-scale` - Fade + scale

## 📱 Responsive Patterns

### Mobile First

```tsx
<div className="text-4xl md:text-6xl lg:text-8xl">
  {/* Scales with screen size */}
</div>
```

### Show/Hide on Mobile

```tsx
<div className="hidden md:block">
  {/* Desktop only */}
</div>

<div className="md:hidden">
  {/* Mobile only */}
</div>
```

## 🎪 Example Compositions

### Feature Card

```tsx
<motion.div whileHover={{ y: -8, scale: 1.02 }} className="feature-card">
  <Card className="glass-card border-0 h-full">
    <CardContent className="p-8">
      <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mb-6">
        <Icon className="w-10 h-10 text-white" />
      </div>
      <h3 className="text-2xl font-bold mb-4">Feature Title</h3>
      <p className="text-slate-600 dark:text-slate-300">Description</p>
    </CardContent>
  </Card>
</motion.div>
```

### Stat Card

```tsx
<Card className="glass-card border-0">
  <CardContent className="p-6">
    <div className="flex items-center justify-between mb-4">
      <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl">
        <Icon className="w-6 h-6 text-emerald-600" />
      </div>
      <Badge>+12%</Badge>
    </div>
    <p className="text-sm text-slate-600 mb-1">Total Users</p>
    <p className="text-3xl font-extrabold">10,234</p>
    <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full mt-4" />
  </CardContent>
</Card>
```

## 🚀 Quick Tips

1. **Always use glassmorphism for cards** - Gives modern, premium feel
2. **Add hover animations to interactive elements** - Improves UX
3. **Use gradient text for emphasis** - Draws attention naturally
4. **Consistent spacing** - Use p-6 or p-8 for cards
5. **Animate on scroll** - Makes page feel alive
6. **Gradient backgrounds for CTA sections** - Increases conversions
7. **Add subtle animations** - Don't overdo it
8. **Use emojis strategically** - Adds personality
9. **Dark mode is important** - Always test both themes
10. **Mobile first** - Design for small screens first

---

**Remember**: Less is more. Focus on smooth, purposeful animations rather than flashy effects!
