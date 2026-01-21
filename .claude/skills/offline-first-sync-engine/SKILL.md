## SKILL 1: Offline-First Sync Engine Architect

### Metadata
- **Name:** Offline-First Sync Engine Architect
- **Category:** Data Synchronization & Conflict Resolution
- **Priority:** P0 (Critical for offline functionality)
- **Domain:** Dexie.js + Supabase sync orchestration
- **Owner Role:** Full-Stack Engineer
- **Complexity:** High
- **Skills Required:** Dexie.js, Supabase, Queue pattern, Conflict resolution algorithms

### Mission
Build and maintain a bulletproof offline-first sync engine using Dexie.js (IndexedDB) and Supabase, handling optimistic UI updates, intelligent conflict resolution, and background sync with exponential backoff retry logic. This skill ensures drivers and restaurant staff can work seamlessly offline, with all operations queuing automatically and syncing when connectivity returns.

### Key Directives

1. **Sync Queue Architecture**
   - Maintain a dedicated `syncQueue` table in Dexie with metadata: `operation`, `endpoint`, `payload`, `timestamp`, `retryCount`, `status`, `recordId`, `conflictResolution`
   - Each queued item must be serializable and contain enough context for retry without network requests
   - Support operation types: CREATE, READ, UPDATE, DELETE, BATCH_SYNC
   - Track sync status: pending → processing → synced | failed → manual_review

2. **Optimistic Update Pattern**
   - Update Dexie immediately upon user action (before sync)
   - Queue operation in sync engine
   - Mark records with `syncStatus: 'pending'` or `syncStatus: 'synced'`
   - Display visual feedback: dim opacity + sync indicator for pending items
   - Never block UI waiting for network response

3. **Intelligent Conflict Resolution**
   - **Last-Write-Wins (LWW):** Server timestamp always wins for conflicting fields
   - **Field-Level Merging:** Changes to different fields merge automatically
   - **Deletion Priority:** Server deletion always overrides client updates (prevent "zombie" records)
   - **User Notification:** Alert users when local and server data diverge, provide choice to keep local or accept server
   - **Audit Trail:** Log all conflicts with timestamps and resolver mechanism

4. **Background Sync Processing**
   - Debounce sync attempts by 2 seconds (prevent rapid re-syncs)
   - Process queue sequentially: check ordering, ensure data dependency ordering
   - Exponential backoff: retry at 1s, 2s, 4s, 8s, 16s max
   - Max retry attempts: 5 before manual review flag
   - If online, auto-retry; if offline, queue for next connectivity event

5. **Network State Monitoring**
   - Listen to `online`/`offline` events
   - Use Service Worker periodic sync as secondary trigger
   - Implement NetInfo API (React Native) for driver app connectivity detection
   - On reconnection, immediately process pending queue

6. **Error Handling & Recovery**
   - Catch and categorize errors: Network, Server (4xx), Server (5xx), Serialization
   - Server errors: auto-retry (5xx) vs manual review (4xx)
   - Log failures with full context: operation, payload, error response, timestamp
   - Provide user-facing recovery UI: Retry, Skip, View Details, Rollback Local

### Workflows

**Workflow: Sync-On-Action**
```
User Action (create order, update delivery status)
  ↓ Save to Dexie immediately (optimistic)
  ↓ Queue operation with metadata
  ↓ Update UI with pending state
  ↓ Emit sync trigger event
  ↓ [Async] Process queue on next tick or connectivity event
  ↓ Server response → Update local record + mark synced
  ↓ Error → Retry with backoff or flag for manual review
```

**Workflow: Conflict Resolution**
```
Attempt to sync local CREATE/UPDATE
  ↓ Server returns data with different timestamp
  ↓ Compare field-by-field: local timestamp vs server timestamp
  ↓ For conflicting field: apply LWW (server wins)
  ↓ For non-conflicting fields: merge changes
  ↓ If user-visible conflict: show UI modal with both versions
  ↓ User chooses: accept server, use local, or custom merge
  ↓ Update Dexie and mark conflict resolved
```

**Workflow: Bulk Sync Recovery**
```
User offline for extended period (4+ hours)
  ↓ Sync queue grows with 50+ pending operations
  ↓ User comes online
  ↓ Show progress modal: "Syncing 47 changes..."
  ↓ Process queue: batch by entity type (orders, deliveries, payments)
  ↓ For each batch: POST /api/sync with ordered operations
  ↓ Server processes atomically or returns conflict list
  ↓ Client handles conflicts in real-time as modal updates
  ↓ After sync complete: clear queue, refresh UI data
```

### Tooling

**Core Libraries**
- `dexie@^4.0.0` - IndexedDB wrapper with live queries
- `@supabase/supabase-js@^2.45.0` - Supabase client
- `zustand@^4.5.0` - Sync engine state management
- `@tanstack/react-query@^5.40.0` - Caching invalidation on sync completion

**Utilities**
- Custom `useOfflineSync` hook for component sync status
- `SyncQueue` class (Dexie instance)
- `ConflictResolver` class with LWW + field-level merge logic
- `BackoffRetry` utility (exponential with jitter)
- Service Worker `sync` event listener setup

**Testing**
- Mock `navigator.onLine` for offline scenarios
- Playwright: simulate network latency, disconnection mid-operation
- Vitest: unit test conflict resolution algorithms
- E2E: verify sync completes correctly after reconnection

**Monitoring**
- Log sync attempts, conflicts, retries to Supabase audit table
- Track sync queue depth (length) as metric
- Alert if queue size exceeds 1000 items
- Monitor failed sync recovery rate
