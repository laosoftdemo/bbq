# 🔥 ຊິ້ນດາດ (Sindat) — Lao BBQ Table Ordering System

A full-stack mobile-first ordering system for Lao BBQ (ຊິ້ນດາດ) restaurants. Customers scan a QR code at their table, browse the menu in Lao or English, and place orders that appear instantly on the kitchen display.

## Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Realtime)
- **Fonts**: Noto Sans Lao + Inter via Google Fonts
- **Deployment**: Vercel (recommended), with Cloudflare proxy for Laos ISP compatibility

---

## Project Structure

```
sindat/
├── app/
│   ├── layout.js               # Root layout — fonts, global CSS
│   ├── globals.css             # Tailwind + custom design tokens
│   ├── page.js                 # Home / demo links
│   ├── menu/
│   │   └── page.js             # Customer menu — /menu?table=3
│   └── staff/
│       ├── kitchen/
│       │   └── page.js         # Kitchen display — /staff/kitchen
│       └── cashier/
│           └── page.js         # Cashier dashboard — /staff/cashier
│
├── components/
│   ├── menu/
│   │   ├── MenuApp.js          # Main customer client component
│   │   ├── MenuHeader.js       # Header with lang toggle
│   │   ├── CategoryTabs.js     # Horizontal category scroll
│   │   ├── MenuItemCard.js     # Item card with cart badge
│   │   ├── AddItemModal.js     # Qty + notes modal
│   │   ├── CartFAB.js          # Floating action button
│   │   ├── CartSheet.js        # Slide-up cart panel
│   │   └── OrderHistory.js     # Per-table order tracking
│   ├── kitchen/
│   │   └── KitchenDisplay.js   # Realtime ticket board
│   ├── cashier/
│   │   ├── CashierDashboard.js # Table status overview
│   │   ├── BillModal.js        # Itemized bill view
│   │   └── BCELPayModal.js     # BCEL OnePay QR payment
│   └── shared/
│       ├── StaffNav.js         # Staff navigation bar
│       └── Toast.js            # Notification toast
│
├── hooks/
│   ├── useLang.js              # Language context (Lao / English)
│   └── useCart.js              # Shared cart with Supabase Realtime
│
├── lib/
│   ├── supabase.js             # Supabase browser client
│   ├── i18n.js                 # Translation dictionary
│   └── format.js               # Currency & time formatters
│
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql   # Full DB schema + seed data
```

---

## Setup

### 1. Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → run the contents of `supabase/migrations/001_initial_schema.sql`
3. Enable **Realtime** for the `orders` and `tables` tables:
   - Go to Database → Replication → enable `orders` and `tables`
4. Copy your project URL and anon key from Settings → API

### 2. Environment

```bash
cp .env.local.example .env.local
# Edit .env.local with your Supabase URL and anon key
```

### 3. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## QR Code URLs

Generate QR codes for each table pointing to:
```
https://yourdomain.com/menu?table=1
https://yourdomain.com/menu?table=2
# ... etc
```

The app reads the `table` query parameter, loads that table's session, and locks the cart to it.

---

## Views

| View | URL | Device |
|------|-----|--------|
| Customer Menu | `/menu?table=N` | Mobile |
| Kitchen Display | `/staff/kitchen` | Desktop (wall screen) |
| Cashier | `/staff/cashier` | Desktop/tablet |

---

## Realtime Features

### Shared Cart (`useCart.js`)
- Uses **Supabase Realtime Broadcast** on channel `cart:table:{tableNumber}:{sessionId}`
- Any device at the same table that adds/removes items updates all others instantly
- No database writes until order is submitted — pure broadcast

### Kitchen Display (`KitchenDisplay.js`)
- Uses **`postgres_changes`** on `orders` table for INSERT/UPDATE events
- New `pending` orders trigger a two-tone audio alert (Web Audio API)
- Tickets glow orange until a staff member clicks "Start Preparing"
- Status progression: **Pending → Preparing → Served**

### Order History (`OrderHistory.js`)
- Customers see live status updates (Pending → Preparing → Served) via `postgres_changes`

---

## Design Tokens

```css
--ember:  #f97316  /* Fire orange — CTAs, active states */
--coal:   #1a1a1a  /* Main background */
--plate:  #242424  /* Card surfaces */
--rim:    #333333  /* Borders */
--ash:    #888888  /* Muted text */
--gold:   #f59e0b  /* Prices, highlights */
--jade:   #10b981  /* Success, served status */
```

---

## Deployment (Vercel + Cloudflare)

```bash
vercel deploy
```

For Laos ISP compatibility, proxy through Cloudflare with orange-cloud enabled.
Set Vercel function region to `sin1` (Singapore) for lowest latency in Vientiane.

---

## Extending

- **Menu images**: Upload to Supabase Storage, set `image_url` on menu items
- **BCEL OnePay integration**: Replace the placeholder QR in `BCELPayModal.js` with the real BCEL OnePay deep-link or API-generated QR
- **Admin panel**: Add `/admin` route with Supabase Auth for menu management
- **Printer support**: Add ESC/POS thermal printer integration via a Supabase Edge Function triggered on order INSERT
