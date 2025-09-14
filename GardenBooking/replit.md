# Bostadsrättsförening Garden Work Booking System

## Overview

This is a garden work booking system for a Swedish housing cooperative (bostadsrättsförening). The system allows residents to book weekly time slots for garden maintenance work across different seasonal periods. Members must book a minimum of 6 weeks per year and can view available slots, make bookings, and track their progress toward meeting the requirement. The system includes both user and admin interfaces, with admins able to manage bookings on behalf of residents.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application uses **React 18** with **TypeScript** and **Vite** as the build tool. The UI is built with **shadcn/ui components** using **Radix UI primitives** and styled with **Tailwind CSS**. The design follows a garden-themed color palette with forest green as the primary color and includes both light and dark mode support.

**Component Structure:**
- **LoginForm**: Authentication interface with login/register tabs
- **Dashboard**: Main user interface showing booking progress and available periods
- **PeriodDetailView**: Detailed view for booking specific weeks within a period
- **AdminPeriodDetailView**: Administrative interface for managing user bookings
- **WeekGrid**: Interactive calendar grid for viewing and selecting weekly slots
- **BookingProgress**: Progress indicator showing completion toward 6-week requirement

**State Management:**
The application uses **TanStack Query** for server state management and caching. Local component state is managed with React hooks.

**Routing:**
The application appears to use client-side routing with different views managed through component state rather than a traditional router.

### Backend Architecture
The backend uses **Express.js** with **TypeScript** running on **Node.js**. The server is configured with development hot-reloading through Vite integration.

**API Design:**
- RESTful API structure with `/api` prefix for all endpoints
- Request/response logging middleware for development
- Error handling middleware for consistent error responses
- Session-based authentication (indicated by connect-pg-simple dependency)

**Storage Layer:**
Currently implements an in-memory storage interface (`MemStorage`) as a temporary solution, with plans to integrate with a PostgreSQL database using Drizzle ORM. The storage interface includes methods for user management (CRUD operations).

### Data Storage Solutions
**Database:**
- **PostgreSQL** as the primary database (configured in drizzle.config.ts)
- **Drizzle ORM** for type-safe database operations and migrations
- **Neon Database** serverless PostgreSQL for hosting (based on @neondatabase/serverless dependency)

**Schema Design:**
Currently includes a basic users table with id, username, and password fields. The schema will need expansion to include periods, bookings, and week slots.

**Session Management:**
Uses **connect-pg-simple** for PostgreSQL-backed session storage, enabling persistent user sessions.

### Authentication and Authorization
**Authentication:**
- Username/password based authentication system
- Session-based authentication with PostgreSQL session store
- Login and registration functionality in a single form interface

**Authorization:**
- Role-based access control with admin flag on user accounts
- Admin users can view and manage bookings for all residents
- Regular users can only view and manage their own bookings

### External Dependencies

**UI Framework:**
- **Radix UI** - Headless UI primitives for accessibility
- **shadcn/ui** - Pre-built component library
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library

**Development Tools:**
- **Vite** - Build tool and development server
- **TypeScript** - Type safety and developer experience
- **ESBuild** - Fast JavaScript bundler for production builds

**Database & ORM:**
- **Drizzle ORM** - Type-safe ORM with SQL-like syntax
- **Drizzle Kit** - CLI tool for migrations and schema management
- **@neondatabase/serverless** - Serverless PostgreSQL client

**State Management:**
- **TanStack React Query** - Server state management and caching
- **React Hook Form** - Form state management and validation
- **Zod** - Runtime type validation and schema validation

**Date Handling:**
- **date-fns** - Date utility library for week calculations and formatting

**Development Environment:**
- **Replit** - Cloud development environment with specific plugins and integrations