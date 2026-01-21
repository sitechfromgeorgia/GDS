## SKILL 7: Zustand State Architect

### Metadata
- **Name:** Zustand State Architect
- **Category:** Client-Side State Management
- **Priority:** P1 (Critical for UI state)
- **Domain:** Zustand, sliced stores, middleware, persistence
- **Owner Role:** Frontend Engineer
- **Complexity:** Medium
- **Skills Required:** Zustand, TypeScript, React patterns, store design

### Mission
Design and maintain scalable, type-safe client-side state management using Zustand. Separate concerns: UI state (local) from server state (TanStack Query). Use sliced stores for granular updates, middleware for logging/devtools, and persistence for offline state.

### Key Directives

1. **Store Slicing Architecture**
   - One Zustand store per domain: `useDriverStore`, `useOrderUIStore`, `useAuthStore`
   - Each store manages discrete concern: Driver location + status, Order UI filters + modals, Auth token + user profile
   - Avoid god stores: if store exceeds 500 lines, split into multiple stores
   - Actions: pure, synchronous mutations; side effects in components with `useEffect` listening to store

2. **Type-Safe Store Definition**
   - Use `create<T>((set) => ({ ... }))` with explicit TypeScript types
   - Define state interface separate from actions
   - Export `useStore`, `useStore.getState()` for SSR access
   - Use `immer` middleware to simplify nested updates

3. **UI State vs Server State**
   - **UI State (Zustand)**: modal visibility, filter selection, form drafts, theme, sidebar collapse
   - **Server State (TanStack Query)**: user profile, order list, inventory, deliveries
   - Never duplicate server state in Zustand (cache invalidation nightmare)
   - Server state updates trigger Zustand changes via `useEffect(subscribe to TanStack Query)`

4. **Persistence & Offline Fallback**
   - Persist non-sensitive UI preferences: theme, sidebar state, map zoom
   - Use `localStorage` (small objects < 1MB), Dexie for larger state
   - Hydrate on app startup from localStorage (avoid hydration mismatch in SSR)
   - Validate persisted data on load (schema compatibility)

5. **Middleware Integration**
   - Redux DevTools for time-traveling debugging (in dev only)
   - Custom logging middleware to track state changes
   - Immer for immutable nested updates
   - Combine middleware: `create(immer(devtools(logger(store))))`

6. **Subscriber & Listener Pattern**
   - Export `store.subscribe((state) => {})` for non-React code
   - Use `useShallow()` for shallow comparison to prevent unnecessary re-renders
   - Selector functions: `useStore((state) => state.user)` for fine-grained subscriptions

### Workflows

**Workflow: Sliced Store Architecture**
```typescript
// stores/driver.store.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware/devtools';

interface DriverLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
}

interface DeliveryAssignment {
  id: string;
  restaurantId: string;
  orderId: string;
  destination: { lat: number; lng: number };
  status: 'assigned' | 'arrived' | 'collected' | 'enroute' | 'delivered';
}

interface DriverState {
  driverId: string | null;
  location: DriverLocation | null;
  isOnline: boolean;
  assignments: DeliveryAssignment[];
  currentAssignmentId: string | null;
  earnings: number;
}

interface DriverActions {
  setDriver: (driverId: string) => void;
  updateLocation: (location: DriverLocation) => void;
  setOnline: (online: boolean) => void;
  addAssignment: (assignment: DeliveryAssignment) => void;
  updateAssignmentStatus: (
    assignmentId: string,
    status: DeliveryAssignment['status']
  ) => void;
  selectAssignment: (assignmentId: string | null) => void;
  addEarnings: (amount: number) => void;
  reset: () => void;
}

const initialState: DriverState = {
  driverId: null,
  location: null,
  isOnline: false,
  assignments: [],
  currentAssignmentId: null,
  earnings: 0,
};

export const useDriverStore = create<DriverState & DriverActions>()(
  devtools(
    immer((set) => ({
      ...initialState,

      setDriver: (driverId) => set({ driverId }),

      updateLocation: (location) => set({ location }),

      setOnline: (online) => set({ isOnline: online }),

      addAssignment: (assignment) =>
        set((state) => {
          state.assignments.push(assignment);
        }),

      updateAssignmentStatus: (assignmentId, status) =>
        set((state) => {
          const assignment = state.assignments.find((a) => a.id === assignmentId);
          if (assignment) {
            assignment.status = status;
          }
        }),

      selectAssignment: (assignmentId) => set({ currentAssignmentId: assignmentId }),

      addEarnings: (amount) =>
        set((state) => {
          state.earnings += amount;
        }),

      reset: () => set(initialState),
    })),
    { name: 'DriverStore' }
  )
);

// Selectors for fine-grained subscriptions
export const selectCurrentAssignment = (state: DriverState) =>
  state.assignments.find((a) => a.id === state.currentAssignmentId);

export const selectActiveAssignments = (state: DriverState) =>
  state.assignments.filter((a) => !['delivered'].includes(a.status));
```

**Workflow: UI State Store**
```typescript
// stores/ui.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  mapZoom: number;
  selectedFilters: {
    status?: string[];
    restaurantId?: string;
  };
  modals: {
    newOrderOpen: boolean;
    confirmDeliveryOpen: boolean;
  };
}

interface UIActions {
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setMapZoom: (zoom: number) => void;
  setFilters: (filters: Partial<UIState['selectedFilters']>) => void;
  toggleModal: (modal: keyof UIState['modals']) => void;
}

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set) => ({
      theme: 'dark',
      sidebarOpen: true,
      mapZoom: 14,
      selectedFilters: {},
      modals: {
        newOrderOpen: false,
        confirmDeliveryOpen: false,
      },

      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        })),

      toggleSidebar: () =>
        set((state) => ({
          sidebarOpen: !state.sidebarOpen,
        })),

      setMapZoom: (zoom) => set({ mapZoom: zoom }),

      setFilters: (filters) =>
        set((state) => ({
          selectedFilters: { ...state.selectedFilters, ...filters },
        })),

      toggleModal: (modal) =>
        set((state) => ({
          modals: {
            ...state.modals,
            [modal]: !state.modals[modal],
          },
        })),
    }),
    {
      name: 'ui-store',
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        mapZoom: state.mapZoom,
      }),
    }
  )
);
```

**Usage in Components:**
```typescript
// app/driver/DeliveryList.tsx
'use client';

import { useDriverStore, selectActiveAssignments } from '@/stores/driver.store';
import { useShallow } from 'zustand/react';

export function DeliveryList() {
  // Fine-grained subscription: only re-render if assignment list changes
  const activeAssignments = useDriverStore(
    useShallow(selectActiveAssignments)
  );

  return (
    <ul>
      {activeAssignments.map((assignment) => (
        <li key={assignment.id}>{assignment.orderId}</li>
      ))}
    </ul>
  );
}

// app/driver/Header.tsx
export function Header() {
  const { isOnline, earnings } = useDriverStore(
    useShallow((state) => ({
      isOnline: state.isOnline,
      earnings: state.earnings,
    }))
  );

  return <div>Online: {isOnline ? '✓' : '✗'} | Earnings: ${earnings}</div>;
}
```

### Tooling

**Core**
- `zustand@^4.5.0` - State management
- `zustand/middleware`: immer, devtools, persist
- `zustand/react`: useShallow for performance

**Utilities**
- Redux DevTools browser extension (for devtools middleware)
- Custom middleware: logging, error tracking
- Store initializer utility for SSR hydration

**Testing**
- Vitest: test store actions in isolation
- Mock stores in component tests
- Verify persistence/hydration with localStorage mock

**Monitoring**
- Track store mutation frequency
- Monitor state size (should be < 1MB total)
