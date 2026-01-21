# CLAUDE.md - GDS (Georgian Distribution System)

## Project Overview

A B2B real-time platform for digitizing and optimizing food distribution supply chains in Georgia. Built with React 19 + TypeScript + Vite, featuring role-based dashboards for Admin, Restaurant, and Driver users.

## Quick Commands

```bash
npm run dev      # Start dev server on localhost:3000
npm run build    # TypeScript check + production build to dist/
npm run preview  # Preview production build locally
```

## Tech Stack

- **Frontend**: React 19, TypeScript 5.2.2 (strict mode), Vite 5
- **Routing**: React Router DOM 7 (hash-based routing)
- **Styling**: Tailwind CSS 3.3.5, dark mode support
- **State**: React Context API (AppContext)
- **Database**: Supabase (production) / In-memory MockDB (demo)
- **i18n**: i18next with Georgian (ka) and English (en)
- **Charts**: Recharts 2.12
- **Deployment**: Docker + Nginx

## Project Structure

```
├── components/
│   ├── admin/           # Admin dashboard (OrderManagement, ProductManagement, UserManagement, Analytics)
│   ├── restaurant/      # RestaurantView - catalog browsing & order submission
│   ├── driver/          # DriverView - delivery management
│   ├── ui/              # Shared UI (Card, Button, Badge, Modal, Input, Toast)
│   ├── Layout.tsx       # Main layout with sidebar
│   ├── LandingPage.tsx  # Login/demo access
│   └── SetupPage.tsx    # Supabase configuration wizard
├── services/
│   ├── db.ts            # MockDB with in-memory data
│   └── supabaseClient.ts # Supabase initialization
├── database/
│   └── seed_products.sql # Product seeding (100+ Georgian items)
├── App.tsx              # Root with AppProvider context
├── types.ts             # TypeScript interfaces & enums
├── i18n.ts              # i18next config & translations
└── index.tsx            # Entry point
```

## Role-Based Architecture

| Role | Access | Key Features |
|------|--------|--------------|
| **ADMIN** | Full system | Orders, Products, Users, Analytics |
| **RESTAURANT** | Catalog & orders | Browse products, submit orders, view history |
| **DRIVER** | Deliveries | View active deliveries, navigation, mark complete |
| **DEMO** | Restaurant view | Uses real Supabase products, mock orders |

## Key Data Types

```typescript
// User roles
enum UserRole { ADMIN, RESTAURANT, DRIVER, DEMO }

// Order status flow
Pending → Confirmed → Out for Delivery → Delivered → Completed

// Product has: id, name, category, unit, image, isActive, isPromo?, price?
// Order has: id, restaurantId, driverId?, status, items[], createdAt, totalCost?, totalProfit?
```

## Environment Variables

```env
VITE_SUPABASE_URL=https://data.greenland77.ge
VITE_SUPABASE_ANON_KEY=<JWT token>
VITE_COMPANY_NAME=Greenland77
```

Config also loaded from localStorage (`gds_system_config`) via SetupPage.

## Code Conventions

- **Components**: Functional with hooks, PascalCase filenames (.tsx)
- **Services**: camelCase filenames (.ts)
- **Styling**: Tailwind utilities, `dark:` variants for dark mode
- **State**: Immutable updates via spread/map/filter
- **Error handling**: try-catch with Toast notifications, console logging
- **Translations**: Use `t('namespace.key')` from react-i18next

## AppContext API

Key functions available via `useApp()`:
- `login()`, `logout()`, `refreshData()`
- Product CRUD: `addProduct`, `updateProduct`, `deleteProduct`, `toggleProductStatus`, `bulkProductAction`
- Order: `createOrder`, `updateOrderStatus`, `updateOrderPricing`
- User: `addUser`, `updateUser`, `updateUserStatus`
- UI: `showToast(message, type)` - success/error/info/warning

## Demo Mode

- Email `demo@gds.ge` triggers demo mode
- Uses real Supabase products but local mock orders
- Falls back to MockDB if Supabase unavailable

## Docker Deployment

```bash
docker build -t gds .
docker run -p 80:80 gds
```

Multi-stage build: Node 20 Alpine for build, Nginx Alpine for serving.
Runtime env injection via `docker-entrypoint.sh`.

## Units & Categories (Georgian)

- **Units**: კგ, ცალი, ქილა, ტომარა, ლიტრი, კონა, შეკვრა, ბოთლი
- **Categories**: ბოსტნეული, ხილი, რძის პროდუქტები, ხორცი, თევზი, მარცვლეული, etc.

## MCP Servers (Claude Code)

ამ პროექტზე მუშაობისას გამოიყენე **მხოლოდ** შემდეგი MCP სერვერები:

| MCP Server | აღწერა | გამოყენება |
|------------|--------|------------|
| **greenland-distribution-supabase** | GDS პროექტის Supabase | ✅ გამოიყენე |
| **chrome-devtools** | Chrome DevTools კონტროლი | ✅ გამოიყენე |

### ⚠️ არ გამოიყენო:

- **mobiline-store-supabase** - ეს სხვა პროექტის (Mobiline Store) Supabase-ია, GDS-თან არანაირი კავშირი არ აქვს!

### GDS Supabase ტაბულები:

```
public.products      - პროდუქტები
public.categories    - კატეგორიები
public.units         - საზომი ერთეულები
public.orders        - შეკვეთები
public.users         - მომხმარებლები
public.profiles      - პროფილები (role-based)
public.stores        - მაღაზიები/რესტორნები
public.store_products - მაღაზია-პროდუქტების კავშირი
public.notifications - შეტყობინებები
public.price_history - ფასების ისტორია
public.audit_log     - აუდიტი
```

## Notes

- No formal test suite configured
- Hash-based routing (`/#/path`) for SPA compatibility
- TypeScript strict mode - fix type errors before committing
- Dark mode persisted to localStorage (`gds_theme`)

## არ გვჭირდება / Out of Scope

- **GPS Tracking** - მძღოლების GPS tracking არ არის საჭირო
- **ETA Calculation** - მისვლის დროის გამოთვლა არ გვჭირდება
- **Geofencing** - გეოლოკაციური შეტყობინებები არ არის საჭირო
- **real-time-logistics-orchestrator** სქილი - არ გამოიყენო
