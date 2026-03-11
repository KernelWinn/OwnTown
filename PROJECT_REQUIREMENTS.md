# Grocery Delivery Platform – Project Requirements & Architecture

## 1. Overview
A scalable, cross-platform grocery delivery solution for India, supporting mobile (iOS, Android), web, and admin management. The app will be available on both iOS (Apple App Store) and Android (Google Play Store). All features, integrations, and costs are tailored for the Indian market.

**Getir-Inspired Experience:**
- Minimalistic, colorful, and intuitive UI/UX inspired by Getir
- Order tracking via courier partner (Shiprocket)
- Smart product recommendations
- Seamless onboarding and checkout
- Live inventory and dynamic pricing
- Admin dashboard for operations management
- **Note:** Ultra-fast (10–20 min) delivery is not included. Logistics handled via third-party courier/shipping partners (Shiprocket aggregator). No in-house delivery partner app in MVP.

---

## 2. User Roles
- **Customer**: Browse, order, track groceries
- **Admin**: Manage products, inventory, orders, shipments, analytics

> **Removed:** Fulfillment/Delivery Partner role — handled by courier partners (Shiprocket, Delhivery, Blue Dart, etc.)

---

## 3. Core Features

### Customer App (iOS, Android, Web)
- User registration/login (phone OTP — primary; email optional)
- Product catalog with search, filter, categories
- Real-time inventory & pricing
- Cart & checkout
- Multiple payment options (UPI, wallets, cards, COD via Razorpay)
- Pincode serviceability check (before checkout, validate courier coverage)
- Delivery slot selection and standard delivery
- Order tracking via courier tracking status (Shiprocket webhook-driven)
- Push notifications + SMS alerts for order status updates
- Address management with Google Places Autocomplete
- User profile & order history

**Post-MVP (Phase 2+):**
- Offers, coupons, loyalty points
- Ratings & reviews
- Social login (Google, Apple)
- Multi-language support (Hindi, regional)
- WhatsApp notifications

### Admin Dashboard (Web)
- Secure admin login (email + password)
- Product & category management (CRUD + image upload)
- Inventory management (stock levels, low-stock alerts)
- Order management (view, confirm, pack, create shipment)
- Shipment management via Shiprocket API (create AWB, print label, track)
- Delivery slot configuration
- User list (read-only)
- Basic order/sales summary

**Post-MVP (Phase 2+):**
- Analytics & reporting (sales, inventory, delivery efficiency)
- Promotions & offers management
- RBAC (role-based access control)
- Returns & refunds handling
- GST and Indian tax compliance reports

---

## 4. Logistics Model — Courier/Shipping Partners

### How It Works
1. Customer places order and selects delivery slot
2. Payment confirmed (Razorpay webhook)
3. Order appears in Admin dashboard
4. Admin confirms, packs, and creates shipment via Shiprocket API
5. AWB number generated, shipping label printed
6. Courier partner picks up from warehouse/store
7. Shiprocket webhooks push status updates to backend
8. Customer notified (push + SMS) at each status change
9. Customer can view tracking status in app (Shipped → Out for Delivery → Delivered)

### Primary Courier Integration: Shiprocket
Shiprocket is a shipping aggregator that provides a single API covering 25+ courier partners:
- Delhivery, Blue Dart, DTDC, Ecom Express, XpressBees, and more
- Auto rate comparison and courier selection
- AWB generation and label printing
- Pincode serviceability API
- Webhook-based tracking status updates
- Pan-India coverage including tier-2/3 cities

### Pincode Serviceability
- Before checkout, validate customer's pincode via Shiprocket serviceability API
- Show estimated delivery date based on courier SLA

---

## 5. Technical Architecture

### Frontend
- **React Native (Expo):** Unified codebase for iOS, Android, and Web
- **Expo Router:** File-based navigation
- **State Management:** Zustand + React Query
- **UI Components:** React Native Paper
- **React/Next.js:** Admin dashboard

### Backend (Microservices)
- **API Gateway:** NestJS gateway or nginx
- **Services:**
  - Auth Service (JWT + OTP via MSG91)
  - Product & Inventory Service
  - Order Management Service (with slot-based scheduling)
  - Shipping Service (Shiprocket API integration + webhook handler)
  - Notification Service (FCM push + MSG91 SMS)
  - Payment Service (Razorpay)
- **Language:** Node.js / NestJS (TypeScript)

### Database Layer
- **Primary:** PostgreSQL (users, products, orders, shipments)
- **Cache/Sessions:** Redis
- **Search:** Typesense (product search with fuzzy matching) — optional for MVP, can start with PostgreSQL full-text search
- **File Storage:** AWS S3 + CloudFront CDN

### Real-Time & Messaging
- **Webhooks:** Razorpay (payment confirmation), Shiprocket (shipment tracking updates)
- **Job Queues:** BullMQ (async notification dispatch, webhook processing)
- **Push Notifications:** Firebase Cloud Messaging (FCM) via Expo Notifications

### Cloud & DevOps
- **Containerization:** Docker + Docker Compose (dev), ECS/EKS (prod)
- **Cloud:** AWS (Mumbai region — ap-south-1)
- **CI/CD:** GitHub Actions
- **Monitoring:** Sentry (errors), Datadog or CloudWatch (infra)

### Security & Compliance
- Secure authentication/authorization (JWT + refresh tokens)
- Data encryption at rest and in transit (HTTPS/TLS)
- Indian data protection and privacy compliance
- Rate limiting on Auth and Payment endpoints

### Integrations
| Integration | Purpose |
|---|---|
| Razorpay | Payments (UPI, cards, wallets, COD) |
| MSG91 | OTP SMS delivery |
| Shiprocket | Courier aggregator (shipment, tracking, label) |
| Google Places API | Address autocomplete |
| Firebase (FCM) | Push notifications |
| AWS S3 + CloudFront | Image/file storage and CDN |

---

## 6. Monorepo Structure

```
owntown/
├── apps/
│   ├── mobile/          # React Native + Expo (iOS, Android, Web)
│   ├── admin/           # Next.js admin dashboard
│   └── api/             # NestJS backend (all services)
├── packages/
│   ├── ui/              # Shared UI components
│   ├── types/           # Shared TypeScript types/interfaces
│   └── utils/           # Shared utility functions
├── docker-compose.yml
└── package.json         # Turborepo workspace
```

---

## 7. Scalability & Reliability
- Auto-scaling backend services
- Database connection pooling (PgBouncer)
- Redis caching for catalog and inventory endpoints
- CDN for product images
- Rate limiting & DDoS protection
- Automated backups & disaster recovery

---

## 8. Roadmap (Phases)

### Phase 1 — MVP (Weeks 1–16)
- Customer app (iOS, Android, Web): catalog, cart, checkout, order tracking
- Razorpay payments (UPI, cards, wallets, COD)
- Shiprocket courier integration
- Basic Admin dashboard: products, inventory, orders, shipments
- Auth (OTP login), push notifications, SMS alerts
- Single city/region launch

### Phase 2
- Coupons, offers, loyalty points
- Ratings & reviews
- WhatsApp order notifications
- Returns & refunds workflow
- Multi-city expansion

### Phase 3
- Advanced analytics & reporting
- Multi-language support (Hindi, regional)
- Social login
- RBAC for admin
- Scale-out infrastructure optimization

### Phase 4
- Internationalization, multi-currency
- In-house delivery partner app (if needed at scale)

---

## 9. MVP Timeline

```
Week 1–2:   Monorepo setup, DB schema, Auth service (OTP login)
Week 3–4:   Product & Inventory service + Admin product management
Week 5–6:   Customer app — onboarding, catalog, search
Week 7–8:   Cart, checkout, Razorpay payment integration
Week 9–10:  Order management service + Shiprocket integration
Week 11–12: Webhooks (payment + shipping), order tracking, notifications
Week 13–14: Admin dashboard — orders + shipment management
Week 15–16: QA, testing, App Store/Play Store prep, soft launch
```

---

## 10. Cost Estimation

### 10.1 Development Costs (One-Time, India)
- UI/UX Design: ₹2,00,000 – ₹6,00,000
- Frontend (React Native + Expo, Web): ₹8,00,000 – ₹20,00,000
- Backend (APIs, Microservices): ₹8,00,000 – ₹20,00,000
- Admin Dashboard (Next.js): ₹2,00,000 – ₹6,00,000
- QA & Testing: ₹2,00,000 – ₹6,00,000
- Project Management & DevOps: ₹2,00,000 – ₹5,00,000
- **Total (MVP):** ₹24,00,000 – ₹63,00,000

> Reduced from original estimate — no delivery partner app in MVP

### 10.2 Deployment Costs (Initial, India)
- Cloud Infrastructure Setup (AWS Mumbai): ₹50,000 – ₹1,50,000
- Domain, SSL, CDN, Storage: ₹20,000 – ₹60,000
- Third-party Integrations (Razorpay, Shiprocket, MSG91, Maps): ₹30,000 – ₹1,50,000

### 10.3 Recurring Costs (Monthly, India)
- Cloud Hosting & Database: ₹25,000 – ₹1,50,000 (scales with usage)
- Support & Bug Fixes: ₹50,000 – ₹1,50,000
- Security, Monitoring, Backups: ₹10,000 – ₹40,000
- Third-party API Usage (Razorpay % fees, Shiprocket per shipment, MSG91 SMS): variable
- Feature Enhancements: ₹50,000 – ₹2,00,000 (optional)

---

*All costs are estimates and vary based on team location, scale, and feature depth. Costs are tailored for the Indian market.*

*This document serves as a foundation for development, team onboarding, and stakeholder alignment.*
