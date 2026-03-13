# OwnTown — UI Details

Brand color: `#007a78` (teal) · Hover: `#005f5d` · Background: `#FAFAFA` · Text: `#2C2C2C`
Font: **Barlow Condensed** (headings) + **Inter** (body)

---

## Store App (`apps/web`) — `localhost:3002`

Consumer-facing shopping web app. Top-nav layout, TGtG-inspired design.

### Design System

| Token | Value |
|---|---|
| `.tgtg-card` | `bg-white rounded-2xl shadow-card overflow-hidden` |
| `.tgtg-btn` | Teal filled, `rounded-xl`, hover darken |
| `.tgtg-btn-sm` | Smaller variant of `.tgtg-btn` |
| `.tgtg-btn-outline` | Border button, charcoal |
| `.tgtg-input` | White, `border-gray-200 rounded-xl`, teal focus ring |
| `.tgtg-badge` | Rounded-full pill, varies by status |
| `.qty-btn` | Circular `+`/`−` with teal border |

### Pages

#### `/` — Home
```
┌─────────────────────────────────────────────────┐
│ HEADER: Logo | Search bar | Nav | Cart | Sign in │
├─────────────────────────────────────────────────┤
│ HERO (teal bg)                                  │
│  Fresh groceries, delivered fast.               │
│  [Browse products →]              🛒            │
├─────────────────────────────────────────────────┤
│ CATEGORIES  (3→4→6→8 col grid)                  │
│  [🥦] [🥛] [🍎] [🧴] [🥩] [🫙] …              │
├─────────────────────────────────────────────────┤
│ FEATURED PICKS              [See all →]         │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐                           │
│  │  │ │  │ │  │ │  │  ProductCard × 8          │
│  └──┘ └──┘ └──┘ └──┘                           │
├─────────────────────────────────────────────────┤
│ ALL PRODUCTS                                    │
│  2→3→4 col grid · up to 60 products            │
└─────────────────────────────────────────────────┘
```

#### `/product/[id]` — Product Detail
```
┌─────────────────────────────────────────────────┐
│ ← Back                                          │
├──────────────────────┬──────────────────────────┤
│ Image gallery        │ Unit badge (teal pill)   │
│ ┌────────────────┐   │ Product name (h1)        │
│ │  Main image    │   │ ₹Price  ~~MRP~~  -X%     │
│ │  [-X% badge]   │   │                          │
│ └────────────────┘   │ Variant chips (if any)   │
│ [thumb][thumb]...    │ Description              │
│                      │ [Add to cart] or [−2+]   │
│                      │ ⭐ Same-day  ⭐ Fresh...  │
└──────────────────────┴──────────────────────────┘
```

#### `/search` — Search
```
┌─────────────────────────────────────────────────┐
│ [🔍 Search products...                    ✕]    │
│ 24 results for "milk"                           │
├─────────────────────────────────────────────────┤
│ Product grid (2→3→4 col)                        │
│ Empty state: "No results for …"                 │
└─────────────────────────────────────────────────┘
```

#### `/cart` — Cart
```
┌──────────────────────────┬──────────────────────┐
│ Your cart                │ Order summary        │
│                          │ ─────────────────    │
│ ┌────────────────────┐   │ Subtotal    ₹XXX     │
│ │ [img] Name   ₹XX   │   │ Delivery    Free     │
│ │       unit  [−2+] 🗑│   │ ─────────────────    │
│ └────────────────────┘   │ Total      ₹XXX      │
│ ┌────────────────────┐   │                      │
│ │ ...                │   │ [Checkout →]         │
│ └────────────────────┘   │                      │
│                          │ ← Continue shopping  │
└──────────────────────────┴──────────────────────┘
Empty: 🛍 "Your cart is empty" + [Browse products]
```

#### `/checkout` — Checkout
```
┌─────────────────────────┬───────────────────────┐
│ Delivery address        │ Order summary         │
│ ─────────────────────   │ Item × qty     ₹XX    │
│ Address line 1 [input]  │ ...                   │
│ Address line 2 [input]  │ ───────────────────   │
│ City      [input]       │ Delivery      Free    │
│ State     [input]       │ Total        ₹XXX     │
│ Pincode   [input]       │                       │
│                         │ [Place order →]       │
│ Payment                 │                       │
│ ● Cash on Delivery      │                       │
└─────────────────────────┴───────────────────────┘
Guards: must be logged in · cart must not be empty
```

#### `/orders` — Orders List
```
┌─────────────────────────────────────────────────┐
│ Your orders                                     │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │ 📦  #ABC12345  [Delivered]          →       │ │
│ │     3 items · ₹450.00 · 12 Mar 2026        │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────┐ │
│ │ 📦  #DEF67890  [Shipped]            →       │ │
│ └─────────────────────────────────────────────┘ │
│ Empty: 📦 "No orders yet" + [Browse products]   │
└─────────────────────────────────────────────────┘
```

#### `/orders/[id]` — Order Detail
```
┌─────────────────────────────────────────────────┐
│ ← Back to orders                                │
│ #ABC12345  [Delivered]  · Placed on 12 Mar 2026 │
├──────────────────────────┬──────────────────────┤
│ ORDER PROGRESS           │ Delivery address     │
│ ●━━━●━━━●━━━●━━━●        │ 123 MG Road, ...     │
│ Pend Conf Proc Ship Del  │                      │
│                          │ Tracking             │
│ ITEMS                    │ AWB1234567890        │
│ ┌──────────────────────┐ │                      │
│ │[img] Product   Qty:2 │ │                      │
│ │              ₹XX.XX  │ │                      │
│ └──────────────────────┘ │                      │
│ ─────────────────────    │                      │
│ Total         ₹XXX.XX    │                      │
└──────────────────────────┴──────────────────────┘
```

#### `/login` — OTP Login (2-step)
```
┌──────────────────┬──────────────────────────────┐
│  (lg only)       │                              │
│  OwnTown 🛒      │  Step 1: Phone               │
│                  │  ──────────────────────      │
│  Fresh           │  Phone number                │
│  groceries,      │  [9876543210        ]        │
│  delivered fast. │  [Send OTP          ]        │
│                  │                              │
│                  │  Step 2: OTP                 │
│                  │  ← Change number             │
│                  │  We sent a code to XXXXXXXXXX│
│                  │  [  •  •  •  •  •  •  ]     │
│                  │  [Verify & Sign in   ]        │
│                  │  Didn't receive? Resend OTP  │
└──────────────────┴──────────────────────────────┘
```

#### `/profile` — Profile
```
┌─────────────────────────────────────────────────┐
│  ┌───┐                                          │
│  │ A │  Anup Nayak                              │
│  └───┘  anup@example.com · +91 9876543210       │
│                                                 │
│  📦 My Orders                              →    │
│  ────────────────────────────────────────────   │
│  [Sign out]                                     │
└─────────────────────────────────────────────────┘
```

### Status Badge Colors

| Status | Style |
|---|---|
| Pending | `bg-yellow-100 text-yellow-700` |
| Confirmed / Processing | `bg-blue-100 text-blue-700` |
| Shipped | `bg-purple-100 text-purple-700` |
| Delivered | `bg-[#E8F8EE] text-[#007a78]` |
| Cancelled | `bg-red-100 text-red-600` |

---

## Admin App (`apps/admin`) — `localhost:3001`

Internal dashboard. Dark sidebar layout. Email + password auth.

### Design System

| Token | Value |
|---|---|
| Colors | Sidebar `#111827`, accent teal `#007a78` |
| Cards | White, `rounded-xl`, `shadow-sm` |
| Tables | Striped hover, `text-sm`, fixed header |
| Badges | Rounded-full, status-colored |
| Forms | Modals with `max-w-lg`, validated with Zod |

### Layout
```
┌────────┬──────────────────────────────────────────┐
│        │  Header: Page title + actions             │
│ SIDE-  ├──────────────────────────────────────────┤
│  BAR   │                                          │
│        │  Page content                            │
│  Nav   │                                          │
│  items │                                          │
│        │                                          │
└────────┴──────────────────────────────────────────┘
```

### Pages

#### `/dashboard` — Overview
```
┌──────────────────────────────────────────────────┐
│ Today, 13 March 2026                             │
├────────┬────────┬────────┬────────────────────────┤
│ Orders │Revenue │Customers│ Items Sold            │
│  KPI   │  KPI   │  KPI   │  KPI                  │
├──────────────────────────┬───────────────────────┤
│ Recent Orders            │ Low Stock Alert       │
│ (last 10, status badges) │ (items < threshold)   │
└──────────────────────────┴───────────────────────┘
```

#### `/dashboard/products` — Products
```
┌──────────────────────────────────────────────────┐
│ Products (42)   [🔍 Search...]   [+ Add product] │
├──────────────────────────────────────────────────┤
│ Product         SKU     Price    Stock   Status   │
├──────────────────────────────────────────────────┤
│ [img] Name      SKU001  ₹50.00   23 ⚠️  Active   │
│       "250g"            MRP ₹60  [Edit][Delete]  │
│ [img] Name      SKU002  ₹120.00  0      Inactive │
└──────────────────────────────────────────────────┘
Modal fields: Name, SKU, Description, Unit, Price,
  MRP, Stock, Category, Images, Featured toggle
```

#### `/dashboard/categories` — Categories
```
┌──────────────────────────────────────────────────┐
│ Categories (8)                [+ Add category]   │
├──────────────────────────────────────────────────┤
│ ▼ [img] Vegetables  (12 sub)  Active  [Edit][Del]│
│    └─ Leafy Greens            Active  [Edit][Del]│
│    └─ Root Vegetables         Active  [Edit][Del]│
│ ► [img] Dairy       (4 sub)   Active  [Edit][Del]│
└──────────────────────────────────────────────────┘
Modal fields: Name, Slug, Image URL, Parent category
```

#### `/dashboard/orders` — Orders
```
┌──────────────────────────────────────────────────┐
│ Orders  Pending: 5 · To pack: 3                  │
├──────────────────────────────────────────────────┤
│ #  Date   Payment  Amount  Status    Actions     │
├──────────────────────────────────────────────────┤
│ #ABC  12 Mar  COD     ₹450   Pending  [Confirm]  │
│ #DEF  12 Mar  Online  ₹890   Packed   [Ship][Label]│
│ #GHI  11 Mar  COD     ₹200   Delivered           │
└──────────────────────────────────────────────────┘
Order status flow: pending → confirmed → processing
  → packed → shipped → delivered
Detail modal: items list, delivery address, AWB
Auto-polls every 30s
```

#### `/dashboard/coupons` — Coupons
```
┌──────────────────────────────────────────────────┐
│ Coupons (5)                   [+ Add coupon]     │
├──────────────────────────────────────────────────┤
│ Code         Discount  Min Order  Used   Active  │
├──────────────────────────────────────────────────┤
│ SAVE10 [📋]  10%       ₹200       8/50   ●       │
│ FLAT50 [📋]  ₹50 off   ₹500       2/∞    ●       │
└──────────────────────────────────────────────────┘
Modal fields: Code, Description, Type (% / flat),
  Value, Min amount, Max cap, Usage limit, Expiry
```

#### `/dashboard/users` — Users
```
┌──────────────────────────────────────────────────┐
│ Users (234)   [🔍 Search by name/phone/email...] │
├──────────────────────────────────────────────────┤
│ User          Phone       Email       Joined     │
├──────────────────────────────────────────────────┤
│ [A] Anup N.   9876543210  a@x.com    12 Jan 26  │
│ [B] Bob S.    9123456789  b@x.com    8 Feb 26   │
└──────────────────────────────────────────────────┘
Read-only. Loads up to 500 users.
```

#### `/dashboard/slots` — Delivery Slots
```
┌──────────────────────────────────────────────────┐
│ Slots  Date: [13/03/2026 ▼]    [+ Add slot]      │
├──────────────────────────────────────────────────┤
│ Date    Time       Label          Cap    Status  │
├──────────────────────────────────────────────────┤
│ 13 Mar  9AM–12PM   Morning       ████░ 8/10  ●  │
│ 13 Mar  2PM–6PM    Afternoon     ██░░░ 4/10  ●  │
└──────────────────────────────────────────────────┘
Modal fields: Date, Start time, End time, Label, Max orders
```

#### `/dashboard/banners` — Banners
```
┌──────────────────────────────────────────────────┐
│ Banners (3)                   [+ Add banner]     │
├──────────────────────────────────────────────────┤
│ ⠿ [img] Weekend Sale         /search?q=sale  1  ●│
│ ⠿ [img] New Arrivals         /search?q=new   2  ●│
└──────────────────────────────────────────────────┘
Modal fields: Title, Subtitle, Image URL (+ preview),
  Deep link, Sort order
```

#### `/dashboard/reviews` — Reviews
```
┌──────────────────────────────────────────────────┐
│ Reviews  [Pending (3)] [Approved] [All]          │
├──────────────────────────────────────────────────┤
│ ★★★★☆  Great product!   Product: Amul Milk       │
│         [Pending]        Order: #ABC12345         │
│         [Approve] [Delete]                        │
├──────────────────────────────────────────────────┤
│ ★★★★★  Very fresh!      Product: Tomatoes        │
│         [Approved] 12 Mar 2026   [Delete]        │
└──────────────────────────────────────────────────┘
```

### Admin Status Badge Colors

| Status | Style |
|---|---|
| pending | yellow |
| confirmed | blue |
| processing / packed | indigo |
| shipped | purple |
| delivered | green |
| cancelled | red |
| payment_failed | red |

---

## API Reference (both apps connect to `localhost:3000`)

| Endpoint | Method | Used by |
|---|---|---|
| `/auth/otp/send` | POST | Store login |
| `/auth/otp/verify` | POST | Store login |
| `/auth/refresh` | POST | Both |
| `/auth/me` | GET | Both |
| `/products` | GET | Store home, search |
| `/products/:id` | GET | Store product page |
| `/products/categories` | GET | Store home |
| `/orders` | GET / POST | Store orders |
| `/orders/:id` | GET | Store order detail |
| `/admin/products` | GET/POST/PATCH/DELETE | Admin |
| `/admin/categories` | GET/POST/PATCH/DELETE | Admin |
| `/admin/orders` | GET/PATCH | Admin |
| `/admin/coupons` | GET/POST/PATCH/DELETE | Admin |
| `/admin/users` | GET | Admin |
| `/admin/slots` | GET/POST/PATCH/DELETE | Admin |
| `/admin/banners` | GET/POST/PATCH/DELETE | Admin |
| `/admin/reviews` | GET/PATCH/DELETE | Admin |
