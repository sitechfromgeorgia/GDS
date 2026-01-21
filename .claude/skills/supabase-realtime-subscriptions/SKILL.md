---
name: supabase-realtime-nextjs-15
description: Implements production-ready Supabase Realtime features (postgres_changes, broadcast, presence) in Next.js 15 with React 19, focusing on Chat, Notifications, and Live Trackers. Includes robust useRealtime hooks, RLS security patterns, and WebSocket connection management. Use when building real-time collaborative apps, live dashboards, chat systems, or online presence indicators.
---

# Supabase Realtime for Next.js 15: Production Masterclass

## Quick Start

Install Supabase v2:

```bash
npm install @supabase/supabase-js@2
```

Create a client in a utility file (Client Component context):

```typescript
// lib/supabase/client.ts
'use client';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

Basic postgres_changes subscription:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export function ChatMessages() {
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    // Subscribe to new messages INSERT events
    const channel = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return <div>{messages.map((msg) => <p key={msg.id}>{msg.content}</p>)}</div>;
}
```

---

## The Three Engines: Architecture Decision Tree

### 1. **Postgres Changes** (Database Events)

**When to use:**
- Persisted data changes (chat messages, database records)
- You need RLS policy filtering automatically
- Data must survive browser refresh
- Collaborative editing, activity feeds

**Why it's different:**
- Listens to INSERT/UPDATE/DELETE in PostgreSQL
- Automatically enforces RLS policies per-user
- Slower (~50-500ms latency) but consistent with DB
- Survives server restart (event-sourced from WAL)

**Event types:**
- `INSERT` - New rows
- `UPDATE` - Modified rows (includes `old` and `new` payload)
- `DELETE` - Removed rows

```typescript
// Chat app: Listen for new messages AND edits
channel.on(
  'postgres_changes',
  { event: 'INSERT', schema: 'public', table: 'messages' },
  (payload) => handleNewMessage(payload.new)
);

channel.on(
  'postgres_changes',
  { event: 'UPDATE', schema: 'public', table: 'messages' },
  (payload) => handleEditMessage(payload.new, payload.old)
);
```

### 2. **Broadcast** (Ephemeral Messaging)

**When to use:**
- Real-time UI state (mouse cursors, typing indicators)
- High-frequency updates (100+ per second)
- Client-to-client messaging
- Don't need persistence

**Why it's different:**
- Instant delivery (<10ms latency)
- **No database writes** (cheaper, faster)
- Cleared when broadcast channel closes
- Perfect for "who is online" or cursor positions

**Cost comparison:**
- `postgres_changes`: Every event touches DB + RLS check = $0.00025 per 10K events
- `broadcast`: In-memory only, no DB = $0.00001 per 10K events (25x cheaper)

```typescript
// Live cursors: Use broadcast, NOT database
const broadcastChannel = supabase.channel('cursors:editor');

broadcastChannel.on('broadcast', { event: 'cursor' }, (payload) => {
  updateCursorPosition(payload.x, payload.y);
});

broadcastChannel.subscribe();

// Send cursor every mousemove
document.addEventListener('mousemove', (e) => {
  broadcastChannel.send({
    type: 'broadcast',
    event: 'cursor',
    payload: { x: e.clientX, y: e.clientY, userId: currentUser.id },
  });
});
```

### 3. **Presence** (CRDT-Based State)

**When to use:**
- "Who is online" state
- Avatar stacks
- Live collaborator lists
- Conflict-free state across users

**Why it's different:**
- Uses Conflict-free Replicated Data Type (CRDT)
- Automatically syncs state when users join/leave
- Fault-tolerant (handles network partitions)
- Presence track/untrack granular state

```typescript
// Online users: Use presence
const presenceChannel = supabase.channel('room:1', {
  config: { presence: { key: userId } },
});

// Track user presence
presenceChannel.subscribe(async (status) => {
  if (status === 'SUBSCRIBED') {
    await presenceChannel.track({
      user_id: userId,
      username: 'Alice',
      color: 'blue',
      cursor: null,
    });
  }
});

// Listen for presence changes
presenceChannel.on('presence', { event: 'sync' }, () => {
  const state = presenceChannel.presenceState();
  renderOnlineUsers(state);
});
```

### Decision Matrix

| Feature | postgres_changes | broadcast | presence |
|---------|-----------------|-----------|----------|
| **Persistence** | ✅ Yes | ❌ No | ⚠️ In-memory |
| **RLS Enforced** | ✅ Auto | ⚠️ Manual policies | ⚠️ Manual policies |
| **Latency** | 50-500ms | <10ms | <50ms |
| **DB Cost** | $$$$ | $ | $$ |
| **Scale** | 1000s concurrent | 100K+ events/sec | 10K+ presence state |
| **Use Case** | Chat messages | Cursors, typing | Online status |

---

## Robust useRealtime Hook (React 19)

### Core Hook: useRealtimeSubscription

Production-grade hook with proper cleanup and error handling:

```typescript
'use client';

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';

export interface UseRealtimeOptions {
  table?: string;
  schema?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string; // Filter syntax: "id=eq.123" or "status=in.(active,pending)"
  onError?: (error: Error) => void;
  onSubscribed?: () => void;
}

export function useRealtimeSubscription<T>(
  channelName: string,
  onData: (payload: RealtimePostgresChangesPayload<T>) => void,
  options: UseRealtimeOptions = {}
) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Create channel
    const channel = supabase.channel(channelName);

    channelRef.current = channel;

    // Subscribe with error handling
    if (options.table) {
      channel
        .on(
          'postgres_changes',
          {
            event: options.event || '*',
            schema: options.schema || 'public',
            table: options.table,
            filter: options.filter,
          },
          (payload: RealtimePostgresChangesPayload<T>) => {
            try {
              onData(payload);
            } catch (err) {
              console.error('Error processing realtime event:', err);
              options.onError?.(
                err instanceof Error
                  ? err
                  : new Error('Unknown error processing event')
              );
            }
          }
        )
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            console.log(`✅ Subscribed to ${channelName}`);
            options.onSubscribed?.();
          } else if (status === 'CHANNEL_ERROR') {
            const error = new Error(`Channel error: ${err?.message}`);
            console.error(error);
            options.onError?.(error);
          } else if (status === 'CLOSED') {
            console.log(`⏹️  Channel ${channelName} closed`);
          }
        });
    }

    // Cleanup: Unsubscribe on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [channelName, options.table, options.event, options.filter, onData, options]);

  // Return channel for manual operations
  return channelRef.current;
}
```

### Advanced: useRealtimeState Hook with Syncing

Auto-syncs state with database:

```typescript
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import { supabase } from '@/lib/supabase/client';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export function useRealtimeState<T extends { id: any }>(
  table: string,
  id: string | number,
  initialData: T | null = null,
  schema: string = 'public'
) {
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<Error | null>(null);

  // Initial fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: result, error: err } = await supabase
          .from(table)
          .select('*')
          .eq('id', id)
          .single();

        if (err) throw err;
        setData(result);
        setLoading(false);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error('Failed to fetch data')
        );
        setLoading(false);
      }
    };

    if (!initialData) {
      fetchData();
    }
  }, [table, id, initialData]);

  // Subscribe to updates
  useRealtimeSubscription<T>(
    `${schema}:${table}:${id}`,
    (payload: RealtimePostgresChangesPayload<T>) => {
      if (payload.eventType === 'UPDATE') {
        setData(payload.new);
      } else if (payload.eventType === 'DELETE') {
        setData(null);
      }
    },
    {
      table,
      schema,
      event: '*',
      filter: `id=eq.${id}`,
    }
  );

  return { data, loading, error };
}
```

### Usage Example: Chat Component

```typescript
'use client';

import { useState } from 'react';
import { useRealtimeState } from '@/hooks/useRealtimeState';

interface Message {
  id: string;
  content: string;
  created_at: string;
}

export function ChatThread({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);

  // Subscribe to all messages in room (with pagination, load once)
  useRealtimeSubscription<Message>(
    `chat:room:${roomId}`,
    (payload) => {
      if (payload.eventType === 'INSERT') {
        setMessages((prev) => [...prev, payload.new]);
      }
    },
    {
      table: 'messages',
      event: 'INSERT',
      filter: `room_id=eq.${roomId}`,
    }
  );

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>{msg.content}</div>
      ))}
    </div>
  );
}
```

---

## RLS Security Checklist

### ✅ Postgres Changes: Automatic RLS Filtering

RLS policies automatically apply to `postgres_changes` subscriptions:

```sql
-- Table: messages
-- RLS Policy: Users can only see messages in their rooms
create policy "user_messages_visibility"
on public.messages
for select
using (
  room_id in (
    select id from public.rooms 
    where user_id = auth.uid()
  )
);
```

**Why this is secure:**
- Realtime server checks RLS for EACH change
- RLS runs with user's JWT context (auth.uid() works)
- If user loses access, they stop receiving updates
- Works across all channels with same table

### ✅ Broadcast & Presence: Manual RLS Policies

You must create RLS policies on `realtime.messages` table:

```sql
-- Allow authenticated users to send broadcast messages
create policy "authenticated_broadcast_send"
on realtime.messages
for insert
to authenticated
with check (
  extension = 'broadcast' and
  realtime.topic() = 'cursors:public'
);

-- Allow authenticated users to receive broadcast messages
create policy "authenticated_broadcast_receive"
on realtime.messages
for select
to authenticated
using (
  extension = 'broadcast' and
  realtime.topic() = 'cursors:public'
);
```

### ✅ Private Channels: Authorization Check

Use `private: true` config to enforce channel-level RLS:

```typescript
// Will check RLS policies on realtime.messages before subscribing
const channel = supabase.channel('chat:room:123', {
  config: { private: true },
});

channel.subscribe((status, err) => {
  if (status === 'SUBSCRIBED') {
    console.log('Authorized to access this channel');
  } else if (err?.message.includes('permissions')) {
    console.error('User not authorized for this channel');
  }
});
```

### ⚠️ Common Security Mistakes

```typescript
// ❌ WRONG: Creating generic channels anyone can read
supabase.channel('notifications'); // No filtering

// ✅ RIGHT: Include user/room context in channel name
supabase.channel(`notifications:user:${userId}`);

// ❌ WRONG: Broadcasting sensitive data
channel.send({
  type: 'broadcast',
  event: 'data',
  payload: { password: user.password }, // EXPOSED
});

// ✅ RIGHT: Only broadcast what's needed
channel.send({
  type: 'broadcast',
  event: 'presence',
  payload: { user_id: userId, online: true },
});

// ❌ WRONG: Forgetting to validate on client
const data = payload.new; // Trust but verify!

// ✅ RIGHT: Always validate received data
const validated = messageSchema.parse(payload.new);
```

---

## Production Patterns: Three Real-World Scenarios

### Scenario 1: Live Chat with Message Edits

```typescript
'use client';

import { useState } from 'react';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { supabase } from '@/lib/supabase/client';

interface ChatMessage {
  id: string;
  content: string;
  edited_at: string | null;
}

export function LiveChat({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Listen to INSERTs (new messages)
  useRealtimeSubscription<ChatMessage>(
    `chat:${roomId}:new`,
    (payload) => {
      if (payload.eventType === 'INSERT') {
        setMessages((prev) => [...prev, payload.new]);
      }
    },
    {
      table: 'messages',
      event: 'INSERT',
      schema: 'public',
      filter: `room_id=eq.${roomId}`,
    }
  );

  // Listen to UPDATEs (edited messages)
  useRealtimeSubscription<ChatMessage>(
    `chat:${roomId}:edits`,
    (payload) => {
      if (payload.eventType === 'UPDATE') {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === payload.new.id ? payload.new : msg
          )
        );
      }
    },
    {
      table: 'messages',
      event: 'UPDATE',
      schema: 'public',
      filter: `room_id=eq.${roomId}`,
    }
  );

  return (
    <div className="space-y-2">
      {messages.map((msg) => (
        <div key={msg.id} className="flex justify-between">
          <span>{msg.content}</span>
          {msg.edited_at && <small>edited</small>}
        </div>
      ))}
    </div>
  );
}
```

### Scenario 2: Live Cursors with Broadcast

```typescript
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

interface Cursor {
  userId: string;
  x: number;
  y: number;
  color: string;
}

export function LiveCursors({ userId, color }: { userId: string; color: string }) {
  const [cursors, setCursors] = useState<Record<string, Cursor>>({});

  useEffect(() => {
    const channel = supabase.channel(`cursors:editor`, {
      config: { broadcast: { self: false } }, // Don't receive own events
    });

    channel
      .on('broadcast', { event: 'cursor_move' }, (payload) => {
        setCursors((prev) => ({
          ...prev,
          [payload.payload.userId]: payload.payload,
        }));
      })
      .subscribe();

    // Send cursor position on mousemove
    const handleMouseMove = (e: MouseEvent) => {
      channel.send({
        type: 'broadcast',
        event: 'cursor_move',
        payload: {
          userId,
          x: e.clientX,
          y: e.clientY,
          color,
        },
      });
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      supabase.removeChannel(channel);
    };
  }, [userId, color]);

  return (
    <div className="relative w-full h-screen">
      {Object.entries(cursors).map(([id, cursor]) => (
        <div
          key={id}
          style={{
            position: 'absolute',
            left: `${cursor.x}px`,
            top: `${cursor.y}px`,
            width: '20px',
            height: '20px',
            backgroundColor: cursor.color,
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />
      ))}
    </div>
  );
}
```

### Scenario 3: Online Presence with Presence API

```typescript
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

interface PresenceUser {
  user_id: string;
  username: string;
  avatar_color: string;
}

export function OnlineUsers({ roomId }: { roomId: string }) {
  const [users, setUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    const channel = supabase.channel(`room:${roomId}`, {
      config: { presence: { key: Math.random().toString() } },
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Track current user in room
        await channel.track({
          user_id: 'user-123',
          username: 'Alice',
          avatar_color: 'bg-blue-500',
        });
      }
    });

    // Listen for presence changes
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState() as Record<string, PresenceUser[]>;
      const allUsers: PresenceUser[] = [];

      Object.values(state).forEach((userList) => {
        allUsers.push(...userList);
      });

      setUsers(allUsers);
    });

    channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('User joined:', newPresences);
    });

    channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      console.log('User left:', leftPresences);
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  return (
    <div className="flex gap-2">
      {users.map((user) => (
        <div key={user.user_id} className={`w-8 h-8 rounded-full ${user.avatar_color}`}>
          <span className="text-xs text-white">{user.username[0]}</span>
        </div>
      ))}
    </div>
  );
}
```

---

## Connection Management: Exponential Backoff

Production apps must handle connection failures gracefully:

```typescript
'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';

const MAX_RETRIES = 5;
const BASE_DELAY = 1000; // 1 second

export function useRealtimeWithRetry(
  channelName: string,
  onConnected: () => void
) {
  const retriesRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const attemptConnection = () => {
      const channel = supabase.channel(channelName);

      channel.subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Connected to ${channelName}`);
          retriesRef.current = 0; // Reset retries on success
          onConnected();
        } else if (status === 'CHANNEL_ERROR' && retriesRef.current < MAX_RETRIES) {
          const delay = BASE_DELAY * Math.pow(2, retriesRef.current);
          console.warn(
            `⚠️  Connection error, retrying in ${delay}ms (attempt ${retriesRef.current + 1}/${MAX_RETRIES})`
          );

          retriesRef.current += 1;
          timeoutRef.current = setTimeout(attemptConnection, delay);
        } else if (retriesRef.current >= MAX_RETRIES) {
          console.error(`❌ Failed to connect after ${MAX_RETRIES} attempts`);
        }
      });
    };

    attemptConnection();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [channelName, onConnected]);
}
```

---

## Common Errors & Troubleshooting

### Error: "You do not have permissions to read from this Topic"

**Cause:** RLS policy on `realtime.messages` table denies access.

**Solution:**
1. Check if you're using `config: { private: true }`
2. Verify RLS policy grants SELECT permission for authenticated users
3. Test policy in SQL Editor (simulate as authenticated user)

```sql
-- Debug: Check if user can access realtime.messages
select * from realtime.messages
where realtime.topic() = 'your-channel'
limit 1; -- Run as authenticated user in SQL Editor
```

### Error: "Payload Size Exceeded"

**Cause:** Message >64KB on Free tier (limits vary by plan).

**Solution:** Split large payloads or upgrade plan:

```typescript
// ❌ WRONG: Sending entire file
channel.send({ type: 'broadcast', event: 'data', payload: largeFile });

// ✅ RIGHT: Chunk large payloads
const chunks = splitIntoChunks(largeFile, 50000);
chunks.forEach((chunk, idx) => {
  channel.send({
    type: 'broadcast',
    event: 'data_chunk',
    payload: { chunk, index: idx, total: chunks.length },
  });
});
```

### Error: "Realtime server logs show no activity"

**Cause:** Client component not actually subscribing.

**Solution:** Verify Client Component directive:

```typescript
// ❌ WRONG: Missing 'use client'
export function ChatMessages() {
  useEffect(() => {
    supabase.channel(...).subscribe(); // Server component, never runs!
  });
}

// ✅ RIGHT: With 'use client' directive
'use client';

export function ChatMessages() {
  useEffect(() => {
    supabase.channel(...).subscribe(); // Runs in browser
  });
}
```

### Error: "RLS policy on 'messages' table never evals true"

**Cause:** RLS policy too restrictive or references non-existent column.

**Solution:** Test with simpler policy first:

```sql
-- ❌ WRONG: Complex join, slow
create policy "complex_access" on public.messages
for select using (
  user_id in (
    select user_id from public.teams
    where team_id in (
      select team_id from public.team_members
      where user_id = auth.uid()
    )
  )
);

-- ✅ RIGHT: Simple equality check
create policy "simple_access" on public.messages
for select using (user_id = auth.uid());
```

---

## Debugging: Inspecting WebSocket Frames

### Browser DevTools Inspection

1. Open Chrome DevTools → Network tab
2. Filter by "WS" (WebSocket)
3. Click `realtime` connection
4. Check "Messages" tab to see real-time frames

Typical flow:
```
← {"v":"1.0","hello":1,...}    # Server hello
→ {"topic":"...","event":"subscribe",...}
← {"topic":"...","event":"phx_reply","status":"ok",...}
→ {"topic":"...","event":"broadcast","payload":{...}}
```

### Client-Side Logging

```typescript
'use client';

import { supabase } from '@/lib/supabase/client';

// Enable debug logging
supabase.realtime.setAuth(token); // After auth

const channel = supabase.channel('test');

channel.subscribe((status, err) => {
  console.log('📡 Status:', status);
  if (err) console.error('❌ Error:', err);
});

channel.on('*', (payload) => {
  console.log('📨 All events:', payload);
});

// Also check WebSocket state
console.log('🔌 Socket state:', supabase.realtime.socket?.state());
// Possible states: "connecting", "open", "closing", "closed"
```

---

## Best Practices

| Practice | Why | Example |
|----------|-----|---------|
| **Use `useEffect` for subscriptions** | Server Components can't subscribe; cleanup on unmount | `useEffect(() => { channel.subscribe(); return () => channel.remove(); }, [])` |
| **Channel names include context** | Prevents accidental cross-talk | `notifications:user:${userId}` not `notifications` |
| **Filter server-side** | Reduces client-side processing, saves bandwidth | `.filter('status=eq.active')` in subscription |
| **Validate received data** | Malicious data could be sent via broadcast | Use Zod: `messageSchema.parse(payload.new)` |
| **Unsubscribe on unmount** | Prevents memory leaks and orphaned connections | `return () => supabase.removeChannel(channel)` |
| **Use RLS policies** | Single source of truth for authorization | RLS applies to postgres_changes automatically |
| **Monitor connection state** | Graceful degradation when offline | Check `status === 'SUBSCRIBED'` before sending |
| **Batch high-frequency events** | Reduces re-renders and improves perf | Debounce cursor updates with `requestAnimationFrame` |

---

## References

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)
- [Broadcast & Presence Auth](https://supabase.com/blog/supabase-realtime-broadcast-and-presence-authorization)
- [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase JS v2 API](https://supabase.com/docs/reference/javascript/introduction)
- [Next.js Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components)
