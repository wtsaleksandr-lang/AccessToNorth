# AccessToNorth.com

## Overview

AccessToNorth.com is a professional SaaS-style website offering Canadian tax registration services for residents and non-residents. It facilitates registration for GST/HST, Business Numbers (BN), payroll accounts, import/export accounts, and CARM portal registration with the Canada Revenue Agency (CRA). The platform features tiered pricing packages, an application form modal, a client portal/application tracker, testimonials, FAQ, and a contact form. The project aims to provide a streamlined, user-friendly experience for businesses navigating Canadian tax and import regulations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter, providing SEO-friendly multi-page routing for core pages, service details, resources, tools, orders, and authentication.
- **Styling**: Tailwind CSS with CSS variables for theming, using a professional blue primary color with Canadian red accents.
- **UI Components**: shadcn/ui components (new-york style) built on Radix UI primitives.
- **Animations**: Framer Motion for scroll reveals and interactions.
- **Forms**: react-hook-form with Zod resolvers for validation, sharing schemas with the backend.
- **State Management**: TanStack React Query for server state management.
- **Fonts**: Inter (body) and Playfair Display (headings) via Google Fonts.
- **Build Tool**: Vite.

### Backend Architecture
- **Runtime**: Node.js with Express 5.
- **Language**: TypeScript.
- **API Design**: RESTful JSON API with routes defined declaratively in `shared/routes.ts` and Zod schemas for validation and typing.
- **Key Endpoints**:
    - Registration and Contact forms.
    - Stripe integration for product listing and checkout sessions.
    - Client Portal for login, order status, messaging, and document uploads/downloads.
    - Admin Dashboard for order management, status updates, messaging, and report generation/delivery.
    - HS classification order creation, summary, and report management (including AI generation).
    - HS code search, customs calculator, and lead submission.
- **Build**: esbuild for production bundling.

### Data Storage
- **Database**: PostgreSQL.
- **ORM**: Drizzle ORM.
- **Schema**: Includes tables for `registrations`, `contacts`, `orders` (with detailed metadata, AI-generated content, and report handling), `uploads`, `messages`, `carm_leads`, `hs_codes`, `tariff_countries`, `hs_code_categories`, and `customs_leads`.
- **Migrations**: Drizzle Kit for schema management.

### Shared Code Pattern
- The `shared/` directory centralizes `schema.ts` (database definitions, Zod schemas, types) and `routes.ts` (API manifest, schemas) to ensure type safety and validation consistency across the full stack.

### Development vs Production
- **Development**: Vite dev server integrated with Express.
- **Production**: Client served as static files by Express after pre-building.

## External Dependencies

### Database
- **PostgreSQL**: Primary database, configured via `DATABASE_URL`.

### Third-Party Integrations
- **Stripe**: Payment processing for tiered services (Business Number, GST/HST, Non-Resident, CARM, Complete Importer Bundle). Products are seeded and managed on the server.
- **Tawk.to Chat Widget**: Embedded for live chat support.
- **Google Fonts**: CDN for website typography.
- **OpenAI**: Used for AI-powered features in the admin panel, such as drafting HS classification reports, generating order summaries, client updates, missing document identification, next steps, import readiness snapshots, and broker handoff packs.

### Key NPM Dependencies
- **Frontend**: React, wouter, @tanstack/react-query, framer-motion, react-hook-form, zod, shadcn/ui, tailwindcss, lucide-react, three, @react-pdf/renderer, jspdf, html2canvas.
- **Backend**: Express 5, drizzle-orm, drizzle-zod, pg, connect-pg-simple, zod, stripe, stripe-replit-sync, jsonwebtoken, cookie-parser, multer.
- **Build**: Vite, esbuild, tsx, drizzle-kit.

### Container Loading Calculator Features
- **3D Visualization**: Three.js-powered viewer with GridHelper floor, wireframe container, door visualization, and dimension labels
- **3D Box Labels**: CanvasTexture sprite labels floating above each box showing name, dimensions, weight, stackable status, and rotation
- **Suggestion Banner**: When cargo doesn't fit, an amber banner suggests trying a larger container (no auto-upgrade)
- **Per-Row Actions**: Duplicate (+) and delete (×) buttons on each cargo table row; duplicateItem creates a copy with "(copy)" suffix inserted below the source row
- **PDF Export**: @react-pdf/renderer branded report with multi-angle 3D snapshots (iso/top/side/front), cargo manifest table, summary stats; `ContainerPackingReportPDF.tsx` in `container-pdf/`
- **Enhanced Loading Table**: Compact rows with position column (X,Y,Z), stackable column, and footer totals row
- **Calculating Overlay**: Full-screen overlay animation during calculation
- **Desktop Layout**: Wider 12-column grid (5+7 split) for better use of screen space

### Header / Mega Menu
- **Navbar**: `client/src/components/Navbar.tsx` — full-width mega menu dropdowns for Services and Tools
- **Icons**: Each service/tool link has a lucide-react icon and short description
- **Hover Effects**: Subtle border, shadow, and background tint on hover per item; 3-column grid on desktop
- **Mobile**: Accordion-style expand/collapse with icons

### Email/Form Handling
- **Email Provider**: Resend via Replit connector.
- **Email Service**: `server/emailService.ts` for sending branded HTML emails, including order confirmations, internal alerts, and report deliveries.
- **Form Submissions**: All forms save data directly to the PostgreSQL database. The business email for alerts is `operations@accesstonorth.com`.