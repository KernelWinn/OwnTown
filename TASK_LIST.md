# Project Task List – Grocery Delivery App (Getir-Inspired)

> **Logistics Model:** Courier/shipping partners via Shiprocket (no in-house delivery partner app in MVP)

---

## Phase 1 — MVP

### 1. Planning & Design
- [ ] Finalize MVP feature list and scope
- [ ] Create wireframes and UI/UX design (Getir-inspired, mobile-first)
- [ ] Define delivery slot configuration and order flow
- [ ] Design database schema (users, products, orders, shipments, slots)
- [ ] Set up monorepo structure (Turborepo + Expo + NestJS + Next.js)

### 2. Infrastructure & DevOps
- [ ] Set up AWS account (Mumbai region — ap-south-1)
- [ ] Configure Docker + Docker Compose for local development
- [ ] Set up PostgreSQL + Redis (local and cloud)
- [ ] Configure AWS S3 bucket + CloudFront CDN for image storage
- [ ] Set up GitHub repository and branch strategy
- [ ] Configure GitHub Actions CI/CD pipeline
- [ ] Set up Sentry for error monitoring (frontend + backend)
- [ ] Configure environment variables and secrets management

### 3. Backend — Auth Service
- [ ] Set up NestJS monorepo (all services)
- [ ] Implement OTP-based phone login (MSG91 integration)
- [ ] JWT access token + refresh token flow
- [ ] User registration and profile management APIs
- [ ] Address management APIs (add, update, delete, set default)

### 4. Backend — Product & Inventory Service
- [ ] Product CRUD APIs (name, description, images, price, GST category)
- [ ] Category and subcategory management APIs
- [ ] Inventory management APIs (stock levels, low-stock threshold)
- [ ] Product image upload to S3
- [ ] Basic product search API (PostgreSQL full-text search)
- [ ] Pincode serviceability check API (via Shiprocket)

### 5. Backend — Order Management Service
- [ ] Cart management APIs (add, update, remove items)
- [ ] Delivery slot configuration and availability APIs
- [ ] Order placement API (validate cart, check stock, calculate total)
- [ ] Order status management (pending → confirmed → packed → shipped → delivered)
- [ ] Order history APIs (customer view)
- [ ] COD order handling

### 6. Backend — Payment Service
- [ ] Razorpay integration (create order, verify payment)
- [ ] Razorpay webhook handler (payment success/failure)
- [ ] COD order flow (no payment gateway, admin-confirmed)
- [ ] Payment status tracking per order

### 7. Backend — Shipping Service (Shiprocket)
- [ ] Shiprocket API integration setup (auth, credentials)
- [ ] Pincode serviceability check API
- [ ] Shipment creation API (generate AWB, assign courier)
- [ ] Shipping label generation
- [ ] Shiprocket webhook handler (track status updates: shipped, out for delivery, delivered, failed)
- [ ] Sync shipment status back to Order Management Service

### 8. Backend — Notification Service
- [ ] Firebase Cloud Messaging (FCM) setup
- [ ] Push notification triggers (order confirmed, packed, shipped, delivered)
- [ ] MSG91 SMS triggers (order confirmation, OTP, shipping updates)
- [ ] BullMQ job queue for async notification dispatch

### 9. Frontend — Customer App (React Native + Expo)
#### Setup
- [ ] Expo project setup with Expo Router (file-based routing)
- [ ] Configure React Native Paper (UI component library)
- [ ] Set up Zustand (state management) + React Query (API calls)
- [ ] Configure Expo Notifications (FCM push)
- [ ] Configure EAS Build for iOS and Android

#### Onboarding & Auth
- [ ] Splash screen and app icon
- [ ] Onboarding screens (3-step intro)
- [ ] Phone number entry screen
- [ ] OTP verification screen
- [ ] Profile setup screen (name, email optional)

#### Home & Catalog
- [ ] Home screen (featured banners, categories, recommended products)
- [ ] Category listing screen
- [ ] Product listing screen (grid view, filters, sort)
- [ ] Product detail screen (images, price, description, add to cart)
- [ ] Search screen (keyword search with suggestions)

#### Cart & Checkout
- [ ] Cart screen (items, quantity, price summary)
- [ ] Address selection / add new address screen
- [ ] Google Places Autocomplete for address input
- [ ] Pincode serviceability check on address selection
- [ ] Delivery slot selection screen
- [ ] Order summary screen (items, address, slot, total)
- [ ] Payment method selection (UPI, card, wallet, COD)
- [ ] Razorpay payment SDK integration
- [ ] Order confirmation screen

#### Orders & Tracking
- [ ] Orders list screen (active and past orders)
- [ ] Order detail screen (items, status timeline, tracking info)
- [ ] Shipment tracking status display (courier tracking from Shiprocket)
- [ ] Push notification deep link to order detail

#### Profile
- [ ] Profile screen (name, phone, email)
- [ ] Address book management
- [ ] Order history

### 10. Frontend — Admin Dashboard (Next.js)
- [ ] Next.js project setup with shadcn/ui
- [ ] Admin login screen (email + password)
- [ ] Dashboard home (order summary, low stock alerts)
- [ ] Product management (list, add, edit, delete, image upload)
- [ ] Category management
- [ ] Inventory management (update stock, view low-stock items)
- [ ] Order management (list, view detail, confirm, mark packed)
- [ ] Shipment creation screen (trigger Shiprocket AWB generation)
- [ ] Shipping label print view
- [ ] Order status tracking view (per order)
- [ ] Delivery slot configuration
- [ ] User list (read-only)

### 11. Testing & QA
- [ ] Unit tests — backend services (Auth, Product, Order, Payment, Shipping)
- [ ] Integration tests — API endpoints
- [ ] End-to-end tests — customer order flow (place → pay → track)
- [ ] Razorpay payment flow testing (sandbox)
- [ ] Shiprocket API testing (sandbox/staging)
- [ ] Performance testing — catalog and checkout endpoints
- [ ] Cross-platform testing — iOS, Android, Web
- [ ] Security checks — auth, payment, input validation

### 12. Launch Prep
- [ ] Apple Developer account setup
- [ ] Google Play Console account setup
- [ ] App Store listing (screenshots, description, keywords)
- [ ] Play Store listing
- [ ] App Store Review compliance check
- [ ] Web deployment (Vercel or Netlify)
- [ ] Production environment setup and smoke testing
- [ ] Beta launch (TestFlight + Play internal testing)
- [ ] Bug fixes from beta feedback
- [ ] Public launch

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
