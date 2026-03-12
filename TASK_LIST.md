# Project Task List – Grocery Delivery App (Getir-Inspired)

> **Logistics Model:** Courier/shipping partners via Shiprocket (no in-house delivery partner app in MVP)
> **Tags:** `[MANUAL]` = requires external account/dashboard setup, no code needed

---

## Phase 1 — MVP

### 1. Planning & Design
- [x] Finalize MVP feature list and scope
- [x] Define delivery slot configuration and order flow
- [x] Design database schema (users, products, orders, shipments, slots)
- [x] Set up monorepo structure (Turborepo + Expo + NestJS + Next.js)
- [ ] Create wireframes and UI/UX design (Getir-inspired, mobile-first) `[MANUAL]`

### 2. Infrastructure & DevOps
- [x] Configure Docker + Docker Compose for local development (PostgreSQL 16 + Redis 7)
- [x] Set up GitHub repository and branch strategy
- [ ] Set up AWS account (Mumbai region — ap-south-1) `[MANUAL]`
- [ ] Configure AWS S3 bucket + CloudFront CDN for image storage `[MANUAL]`
- [x] Configure GitHub Actions CI/CD pipeline
- [ ] Set up Sentry for error monitoring (frontend + backend) `[MANUAL]`
- [ ] Configure environment variables and secrets management `[MANUAL]`

### 3. Backend — Auth Service
- [x] Set up NestJS monorepo (all services)
- [x] Implement OTP-based phone login (MSG91 integration)
- [x] JWT access token + refresh token flow
- [x] User registration and profile management APIs
- [x] Address management APIs (add, update, delete, set default)

### 4. Backend — Product & Inventory Service
- [x] Product CRUD APIs (name, description, images, price, GST category)
- [x] Category and subcategory management APIs
- [x] Inventory management APIs (stock levels, low-stock threshold)
- [x] Product image upload to S3 (presigned URL flow)
- [x] Basic product search API (PostgreSQL full-text search)
- [x] Pincode serviceability check API (via Shiprocket)

### 5. Backend — Order Management Service
- [x] Cart management APIs (add, update, remove items) — Redis-backed
- [x] Delivery slot configuration and availability APIs
- [x] Order placement API (validate cart, check stock, calculate total)
- [x] Order status management (pending → confirmed → packed → shipped → delivered)
- [x] Order history APIs (customer view)
- [x] COD order handling

### 6. Backend — Payment Service
- [x] Razorpay integration (create order, verify payment)
- [x] Razorpay webhook handler (payment success/failure)
- [x] COD order flow (no payment gateway, auto-confirmed)
- [x] Payment status tracking per order

### 7. Backend — Shipping Service (Shiprocket)
- [x] Shiprocket API integration setup (auth, credentials)
- [x] Pincode serviceability check API
- [x] Shipment creation API (generate AWB, assign courier)
- [x] Shiprocket webhook handler (track status updates: shipped, out for delivery, delivered, failed)
- [x] Sync shipment status back to Order Management Service
- [x] Shipping label generation

### 8. Backend — Notification Service
- [x] Firebase Cloud Messaging (FCM) setup
- [x] FCM push + MSG91 SMS service methods
- [x] FCM token storage per device/platform
- [x] **BullMQ job queue for async notification dispatch**
- [x] **Wire triggers: order confirmed, packed, shipped, delivered**
- [x] Push notification deep link handling

### 9. Frontend — Customer App (React Native + Expo)
#### Setup
- [x] Expo project setup with Expo Router (file-based routing)
- [x] Configure React Native Paper (UI component library)
- [x] Set up Zustand (state management) + React Query (API calls)
- [x] Configure Expo Notifications (FCM push)
- [x] Configure EAS Build for iOS and Android

#### Onboarding & Auth
- [x] Splash/welcome screen and onboarding flow
- [x] Phone number entry screen
- [x] OTP verification screen
- [x] Profile setup (name stored in auth store)
- [x] Splash screen asset + app icon (placeholder — replace before App Store submission) `[MANUAL]` for final branded assets

#### Home & Catalog
- [x] Home screen (sticky category pills, 2-col product grid, cart badge)
- [x] Category listing (horizontal pills with image)
- [x] Product listing screen (grid view, category filter)
- [x] Product detail screen (image carousel, discount badge, qty controls, stock warning)
- [x] Search screen (keyword search, 2-char minimum)

#### Cart & Checkout
- [x] Cart screen (thumbnails, qty +/−, trash at qty=1, delivery fee, summary)
- [x] Address selection screen
- [x] Add new address screen (form with phone/pincode validation)
- [x] Delivery slot selection (grouped by date, full slots disabled)
- [x] Payment method selection (COD / Razorpay)
- [x] Order placement + confirmation navigation
- [x] **Razorpay mobile SDK integration (launch checkout sheet for online payments)**
- [x] Google Places Autocomplete for address input
- [x] Pincode serviceability check on address selection

#### Orders & Tracking
- [x] Orders list screen (status chip, date, total)
- [x] Order detail screen (status timeline, AWB tracking, items, address, bill)
- [x] Push notification deep link to order detail
- [x] Shipment tracking URL display / in-app browser

#### Profile & Addresses
- [x] Profile screen (name, phone, avatar initials, logout)
- [x] Address book list (set default, edit link, delete)
- [x] New address form
- [x] **Address edit screen** (`/addresses/edit/[id]`)

### 10. Frontend — Admin Dashboard (Next.js)
- [x] Next.js project setup with Tailwind CSS
- [x] Admin login screen (email + password, Zod validation)
- [x] Dashboard home (order summary stats, low stock alerts, recent orders)
- [x] Product management (list, add, edit, delete, S3 image upload, discount preview)
- [x] Category management (nested tree, add, edit, delete, image upload)
- [x] Inventory management (stock update modal with low-stock warning)
- [x] Order management (list, status advancement, Ship button)
- [x] Order detail modal (items, address, totals, AWB/tracking)
- [x] **Admin JWT guard** — `AdminJwtGuard` protects all `/admin` routes
- [x] Delivery slot configuration UI
- [x] Shipping label print view
- [x] User list (read-only)

### 11. Testing & QA
- [ ] Unit tests — backend services (Auth, Product, Order, Payment, Shipping)
- [ ] Integration tests — API endpoints
- [ ] End-to-end tests — customer order flow (place → pay → track)
- [ ] Razorpay payment flow testing (sandbox) `[MANUAL]`
- [ ] Shiprocket API testing (sandbox/staging) `[MANUAL]`
- [ ] Performance testing — catalog and checkout endpoints
- [ ] Cross-platform testing — iOS, Android, Web `[MANUAL]`
- [ ] Security checks — auth, payment, input validation

### 12. Launch Prep
- [ ] Apple Developer account setup `[MANUAL]`
- [ ] Google Play Console account setup `[MANUAL]`
- [ ] App Store listing (screenshots, description, keywords) `[MANUAL]`
- [ ] Play Store listing `[MANUAL]`
- [ ] App Store Review compliance check `[MANUAL]`
- [ ] Web deployment (Vercel or Netlify) `[MANUAL]`
- [ ] Production environment setup and smoke testing `[MANUAL]`
- [ ] Beta launch (TestFlight + Play internal testing) `[MANUAL]`
- [ ] Bug fixes from beta feedback `[MANUAL]`
- [ ] Public launch `[MANUAL]`

---

## Next Priority (Phase 2)

1. **Unit tests** — backend services (Auth, Product, Order, Payment)
2. **Coupons and discount codes**
3. **Offers and promotional banners**

---

## Phase 2 (Post-MVP)
- [ ] Coupons and discount codes
- [ ] Offers and promotional banners
- [ ] Loyalty points system
- [ ] Ratings & reviews (products and orders)
- [ ] WhatsApp order notifications (WhatsApp Business API)
- [ ] Returns & refunds workflow
- [ ] Multi-city / multi-zone support
- [ ] Admin analytics & reporting dashboard
- [ ] RBAC for admin (store manager vs. super admin)

## Phase 3
- [ ] Multi-language support (Hindi, regional languages)
- [ ] Social login (Google, Apple)
- [ ] Advanced product search (Typesense)
- [ ] GST compliance reports
- [ ] Scale-out infrastructure (EKS, auto-scaling)

## Phase 4
- [ ] In-house delivery partner app (if needed at scale)
- [ ] Internationalization and multi-currency
- [ ] B2B / bulk ordering

---

*Logistics via Shiprocket courier aggregator. No in-house delivery partner app in MVP.*
