# Design Guidelines: Bostadsrättsförening Garden Work Booking System

## Design Approach: Reference-Based (Productivity Tools)
Taking inspiration from modern scheduling platforms like Calendly and productivity tools like Linear, this system prioritizes clear information hierarchy and efficient booking workflows.

## Core Design Elements

### Color Palette
**Light Mode:**
- Primary: 147 85% 35% (Deep forest green - representing garden work)
- Secondary: 147 25% 92% (Very light sage background)
- Accent: 31 85% 55% (Warm orange for CTAs and highlights)
- Text: 210 15% 20% (Dark blue-gray)
- Background: 0 0% 98% (Off-white)

**Dark Mode:**
- Primary: 147 60% 65% (Lighter forest green)
- Secondary: 147 15% 15% (Dark sage background)
- Accent: 31 70% 60% (Softer warm orange)
- Text: 210 10% 85% (Light gray)
- Background: 210 15% 8% (Dark blue-black)

### Typography
- **Primary Font:** Inter (Google Fonts) - Clean, readable for interfaces
- **Headers:** 600-700 weight, sizes from text-lg to text-3xl
- **Body Text:** 400-500 weight, text-sm to text-base
- **UI Elements:** 500 weight for buttons and labels

### Layout System
Using Tailwind spacing units: **2, 4, 6, 8, 12, 16**
- Consistent padding: p-4, p-6, p-8
- Margins: m-2, m-4, m-8
- Grid gaps: gap-4, gap-6
- Component spacing: space-y-6, space-x-4

## Component Library

### Navigation
- Clean sidebar navigation with period selection
- Top bar showing current user and booking status
- Breadcrumb navigation for deeper pages

### Calendar Components
- **Period Cards:** Large, clearly labeled cards for each of the 5 periods
- **Week Grid:** Clean grid layout showing weeks 1-10 or 1-6 per period
- **Booking Status:** Color-coded indicators (available/booked/your booking)
- **Progress Indicator:** Shows user's progress toward 6-booking minimum

### Forms & Interactions
- **Login Form:** Simple, centered design with garden-themed illustrations
- **Booking Modal:** Overlay for confirming week selections
- **Quick Actions:** One-click booking/unbooking where appropriate

### Data Display
- **Dashboard:** Overview of user's bookings and remaining requirements
- **Period Overview:** Visual representation of all bookings in a period
- **User Stats:** Progress bars and counters for booking requirements

### Feedback Elements
- **Success States:** Green checkmarks and confirmation messages
- **Warnings:** Orange alerts for users below 6-booking minimum
- **Error States:** Clear red indicators with helpful messaging

## Key Design Principles

1. **Garden Context:** Subtle nature-inspired elements without being overwhelming
2. **Clarity First:** Information hierarchy prioritizes booking status and requirements
3. **Mobile Responsive:** Optimized for both desktop management and mobile booking
4. **Accessibility:** High contrast ratios, keyboard navigation, screen reader support
5. **Progressive Disclosure:** Show essential info first, details on demand

## Animations
Minimal and functional only:
- Smooth transitions between periods (300ms ease)
- Loading states for booking actions
- Subtle hover states on interactive elements

This design balances the community-focused nature of a housing association with the practical needs of an efficient booking system, ensuring members can easily fulfill their garden work commitments.