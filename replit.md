# AccessToNorth.com

## Overview

AccessToNorth.com is a professional SaaS-style website for a Canadian tax registration service business. It helps residents and non-residents register for GST/HST, Business Numbers (BN), payroll accounts, import/export accounts, and CARM portal registration with the Canada Revenue Agency (CRA). The site features tiered pricing packages ($99–$1,500), a registration application form modal, a client portal/application tracker mockup, testimonials, FAQ, and a contact form. The registered business behind it is an LLC, but the consumer-facing brand is "AccessToNorth.com".

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side router) with SEO-friendly multi-page structure:
  - Core pages: Home (`/`), Services hub (`/services`), Pricing (`/pricing`), Tools hub (`/tools`), Resources hub (`/resources`), FAQ (`/faq`), Contact (`/contact`), Request (`/request`)
  - Service detail pages: `/services/business-number-bn`, `/services/gst-hst-registration`, `/services/non-resident-importer-canada`, `/services/carm-registration-canada`, `/services/rpp-bond-coordination`, `/services/customs-clearance-canada`, `/services/b13-export-declaration`, `/services/hs-code-classification-canada`, `/services/import-compliance-review`
  - Resource articles: `/resources/how-to-import-into-canada`, `/resources/customs-clearance-under-2500`, `/resources/what-is-sima-duty`, `/resources/what-is-carm`, `/resources/hs-code-vs-tariff-treatment`, `/resources/incoterms-for-canadian-importers`, `/resources/fcl-vs-lcl-cost-comparison`, `/resources/b13-export-declaration-explained`, `/resources/when-do-you-need-cfia-approval`
  - Existing tool pages (unchanged): `/customs-calculator`, `/carm-security-calculator`, `/canadian-customs-clearance`, `/canadian-customs-clearance/checkout`
  - Order pages: `/order/hs-classification` (HS Classification 5-step multi-form: package select, product details, document upload, contact info, review & pay; tiers: Basic $29, Business $99, Pro $249)
  - Order confirmation: `/order-confirmation?session_id=&order_id=` (post-payment confirmation with order details)
  - Coming-soon tool placeholders: `/tools/freight-quote`, `/tools/shipment-tracking`
  - Portal/auth: Client Portal (`/portal`), Admin Dashboard (`/admin`), Payment Success/Cancel
  - Legal: `/terms`, `/privacy`, `/refunds`
  - Navigation: Dropdown menus for Services (9 items) and Tools (4 items), direct links for Pricing, Resources, FAQ, Contact. CTA buttons: Check Status, Register Now
  - Breadcrumbs on all service and resource detail pages via `Breadcrumbs` component
  - Scroll-to-top on all page navigations via `ScrollToTop` component
- **Styling**: Tailwind CSS with CSS variables for theming, using a professional blue (#007BFF) primary color with Canadian red accents
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives, located in `client/src/components/ui/`
- **Animations**: Framer Motion for scroll reveals and interactions
- **Forms**: react-hook-form with Zod resolvers for validation, schemas shared with backend
- **State Management**: TanStack React Query for server state (API calls, caching)
- **Fonts**: Inter (body) and Playfair Display (headings) via Google Fonts
- **Build Tool**: Vite with React plugin, path aliases (`@/` → `client/src/`, `@shared/` → `shared/`)

### Backend Architecture
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript, executed via tsx in development
- **API Design**: RESTful JSON API, routes defined declaratively in `shared/routes.ts` with Zod schemas for input validation and response typing
- **Endpoints**:
  - `POST /api/registrations` — Create a new registration application
  - `GET /api/registrations/status?email=` — Look up registration status by email
  - `POST /api/contact` — Submit a contact form message
  - `GET /api/products` — List all Stripe products with prices
  - `POST /api/checkout` — Create Stripe Checkout session (server-side price resolution)
  - `GET /api/checkout/session/:sessionId` — Retrieve checkout session details
  - `GET /api/stripe/publishable-key` — Get Stripe publishable key
  - `POST /api/stripe/webhook` — Stripe webhook endpoint (registered before body parser)
  - `POST /api/portal/login` — Client portal login (email + order ID), sets httpOnly JWT cookie
  - `POST /api/portal/logout` — Clears portal auth cookie
  - `GET /api/portal/order/:orderId` — Get order details, uploads, messages (auth required)
  - `POST /api/portal/order/:orderId/message` — Send a message on an order (auth required)
  - `POST /api/portal/order/:orderId/upload` — Upload a document to an order (auth required, multipart)
  - `GET /api/portal/order/:orderId/upload/:uploadId/download` — Download uploaded file (auth required)
  - `POST /api/leads/carm-security` — Submit CARM calculator lead (rate-limited, 5/min per IP)
  - `POST /api/admin/login` — Admin login (password-only), sets httpOnly JWT cookie
  - `GET /api/admin/orders` — List all orders with message/upload counts (admin auth required)
  - `GET /api/admin/orders/:orderId` — Order detail with uploads and messages (admin auth required)
  - `PATCH /api/admin/orders/:orderId` — Update order steps and status (admin auth required)
  - `POST /api/admin/orders/:orderId/message` — Admin reply to client message (admin auth required)
  - `GET /api/admin/uploads/:uploadId/download` — Download uploaded file (admin auth required)
  - `POST /api/classification-orders` — Create HS classification order (multipart form + file uploads, creates order + Stripe checkout)
  - `GET /api/classification-orders/:orderId` — Get classification order summary (public, for confirmation page)
  - `GET /api/hs-search?q=` — Fuzzy product-name HS code search using pg_trgm trigram similarity (typo-tolerant, min 3 chars, max 15 results, fallback to description_full if < 5 results)
  - `GET /api/customs/hs-search?q=&limit=` — Autocomplete HS code search (by code or description, ILIKE)
  - `GET /api/customs/countries` — List all countries with tariff treatment mappings
  - `GET /api/customs/provinces` — List all provinces with tax rates
  - `POST /api/customs/calculate` — Calculate duty/tax for single item (hsCode, countryOfOrigin, valueCAD, quantity, province, shipmentType)
  - `POST /api/customs/calculate-bulk` — Calculate duty/tax for multiple items from CSV
  - `POST /api/leads/customs-calculator` — Submit customs calculator lead (rate-limited, 5/min per IP)
- **Build**: esbuild bundles server to `dist/index.cjs` for production; Vite builds client to `dist/public/`

### Data Storage
- **Database**: PostgreSQL via `DATABASE_URL` environment variable
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema** (in `shared/schema.ts`):
  - `registrations` table: id, fullName, email, phone, businessName, residentStatus, packageType, businessType, estimatedRevenue, notes, authorizationConsent, status, isNonResident, createdAt
  - `contacts` table: id, name, email, message, createdAt
  - `orders` table: id (text PK, format ATN-XXXXXX or HSC-XXXXXX for classifications), customerEmail, customerName, serviceType, status, steps (jsonb array of OrderStep), stripeSessionId, metadata (jsonb, ClassificationOrderData for HS classification orders), createdAt, updatedAt
  - `uploads` table: id (uuid), orderId (FK→orders), fileName, fileData (base64), fileSize, mimeType, createdAt
  - `messages` table: id (uuid), orderId (FK→orders), sender, message, createdAt
  - `carm_leads` table: id, email, companyName, importValueRange, currentlyImporting, phone, highestMonthlyPayable, bondEstimate, cashEstimate, applyMinimum, frequency, isNonResident, priority, source, createdAt
  - `hs_codes` table: id, code (10-char), description, chapter, unitOfMeasure, plus 25 tariff treatment columns (MFN, UST, MXT, CPTPT, etc.)
  - `tariff_countries` table: id, name, code, treatments (text array)
  - `hs_code_categories` table: id, chapter, description
  - `customs_leads` table: id, email, companyName, phone, hsCode, countryOfOrigin, goodsValue, calculatedDuty, source, createdAt
- **Migrations**: Drizzle Kit with `drizzle-kit push` command (schema push, no migration files required)
- **Validation**: drizzle-zod generates insert schemas from table definitions, shared between client and server

### Shared Code Pattern
The `shared/` directory contains code used by both frontend and backend:
- `schema.ts` — Database table definitions, Zod insert schemas, and TypeScript types
- `routes.ts` — API route manifest with paths, methods, input schemas, and response schemas

This ensures type safety and validation consistency across the full stack.

### Development vs Production
- **Development**: Vite dev server runs as middleware inside Express via `server/vite.ts`, with HMR support
- **Production**: Client is pre-built to `dist/public/`, Express serves static files via `server/static.ts` with SPA fallback

## External Dependencies

### Database
- **PostgreSQL**: Required. Connection string must be provided via `DATABASE_URL` environment variable. Used with `connect-pg-simple` for potential session storage and Drizzle ORM for data access.

### Third-Party Integrations
- **Stripe**: Payment processing via Stripe Checkout (USD). Products are seeded on server startup via `server/seedProducts.ts`. Uses `stripe-replit-sync` for webhook handling and data sync. 5 pricing packages: Business Number ($99), GST/HST ($249), Non-Resident ($399), CARM ($499), Complete Importer Bundle ($1,500). Package types: `business-number`, `gst-hst`, `non-resident`, `carm`, `complete-bundle`.
- **Tawk.to Chat Widget**: Embedded in `client/index.html` with Property ID `69914fcdf45fd51c3bd1411a`. Provides live chat / AI support bubble in bottom-right corner. No server-side integration needed.
- **Google Fonts**: Inter and Playfair Display loaded from Google Fonts CDN.

### Key NPM Dependencies
- **Frontend**: React, wouter, @tanstack/react-query, framer-motion, react-hook-form, zod, shadcn/ui (Radix UI primitives), tailwindcss, class-variance-authority, lucide-react, embla-carousel-react
- **Backend**: Express 5, drizzle-orm, drizzle-zod, pg (node-postgres), connect-pg-simple, zod, stripe, stripe-replit-sync, jsonwebtoken, cookie-parser, multer
- **Build**: Vite, esbuild, tsx, drizzle-kit
- **Replit Plugins**: @replit/vite-plugin-runtime-error-modal, @replit/vite-plugin-cartographer, @replit/vite-plugin-dev-banner (dev only)

### Email/Form Handling
- Form submissions currently save to the PostgreSQL database. The business email is `operations@accesstonorth.com` (displayed in footer only). There is no email-sending integration configured yet — form handler may need EmailJS, Formspree, or similar in the future.