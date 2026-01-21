## SKILL 4: Real-Time Logistics Orchestrator

### Metadata
- **Name:** Real-Time Logistics Orchestrator
- **Category:** Real-Time Systems & Geolocation
- **Priority:** P1 (Critical for driver experience)
- **Domain:** WebSockets, geolocation, live tracking, Supabase Realtime
- **Owner Role:** Full-Stack Engineer
- **Complexity:** High
- **Skills Required:** WebSockets, geolocation APIs, Supabase Realtime, React hooks

### Mission
Orchestrate real-time driver tracking, live order status updates, and dynamic delivery assignments. Use WebSockets for low-latency geolocation streaming, Supabase Realtime for data sync, and optimistic updates for responsive UI. Handle geofencing, ETA calculation, and driver availability in real-time.

### Key Directives

1. **Geolocation Streaming**
   - Driver app sends GPS coordinates every 5-10 seconds (configurable)
   - Batch updates: accumulate 3-5 points, send as array to reduce API calls
   - Include: latitude, longitude, accuracy, timestamp, heading (optional)
   - Fallback to less frequent updates (20s) if battery low
   - Store raw location points in time-series table for route replay

2. **WebSocket Real-Time Channel**
   - Use Supabase Realtime: subscribe to `driver_locations` channel
   - Subscribe to order-specific channels: `order:{orderId}:updates`
   - Delivery assignment channel: `driver:{driverId}:assignments`
   - Automatic reconnection with exponential backoff on disconnect
   - Message integrity: include message ID + sequence number for dedup

3. **Live Order Status Propagation**
   - Admin → order status change → broadcast to restaurant & customer
   - Driver → delivery status change (arrived, collected, delivered) → propagate to order
   - Customer receives push notification on major status changes
   - UI updates in real-time via Zustand store listening to Realtime events

4. **Geofencing & Alerts**
   - Define geofence zones: restaurant location, delivery address, warehouse
   - Trigger alerts when driver enters/exits zone (automatically on location update)
   - Calculate distance to destination in real-time
   - Alert if driver deviates from route (>500m off path)

5. **ETA Calculation Engine**
   - Real-time ETA based on current speed + remaining distance
   - Factor traffic patterns (time-of-day multiplier from historical data)
   - Recalculate every 10 seconds as driver location updates
   - Show confidence interval: "In 12-18 minutes" vs exact time

6. **Offline Handling**
   - When driver goes offline, pause real-time updates but queue them
   - On reconnect, catch up with queued location points (replay)
   - Current visible delivery assignment persists even offline

### Workflows

**Workflow: Real-Time Driver Tracking**
```typescript
// app/components/driver-tracking/DriverTracking.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { useDriverStore } from '@/stores/driver-store';

export function DriverTracking({ deliveryId }: { deliveryId: string }) {
  const locationRef = useRef<GeolocationPosition | null>(null);
  const batchRef = useRef<any[]>([]);
  const { updateDriverLocation } = useDriverStore();

  // Subscribe to real-time driver location updates
  useRealtimeSubscription(
    'driver_locations',
    { filter: `delivery_id=eq.${deliveryId}` },
    (payload) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        updateDriverLocation(payload.new);
        // Trigger ETA recalculation
        calculateETA(payload.new);
      }
    }
  );

  // Geolocation tracking
  useEffect(() => {
    if (!navigator.geolocation) return;

    let watchId: number;
    const startTracking = () => {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          locationRef.current = position;
          batchRef.current.push({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString(),
            heading: position.coords.heading,
          });

          // Send batch every 5 locations or 30 seconds
          if (batchRef.current.length >= 5 || Date.now() - lastSendTime > 30000) {
            sendLocationBatch(batchRef.current);
            batchRef.current = [];
          }
        },
        (error) => console.error('Geolocation error:', error),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    };

    startTracking();
    return () => navigator.geolocation.clearWatch(watchId);
  }, [deliveryId]);

  return (
    <div>
      {/* Map component showing live driver + delivery location */}
    </div>
  );
}
```

**Workflow: Geofence Trigger**
```typescript
// lib/geofencing.ts
import { haversineDistance } from '@/lib/geo-utils';

const GEOFENCE_RADIUS_M = 100; // 100 meters

export function checkGeofenceViolation(
  currentLocation: { lat: number; lng: number },
  expectedRoute: { lat: number; lng: number }[],
  previousLocation: { lat: number; lng: number } | null
): string | null {
  // Check if driver is on expected route
  const minDistToRoute = expectedRoute.reduce((min, point) => {
    const dist = haversineDistance(currentLocation, point);
    return Math.min(min, dist);
  }, Infinity);

  if (minDistToRoute > 500) {
    return 'ROUTE_DEVIATION: Driver is 500m+ off assigned route';
  }

  // Check warehouse geofence (reading point)
  const warehouseLocation = { lat: 41.6367, lng: 41.6287 }; // Example: Batumi
  const distToWarehouse = haversineDistance(currentLocation, warehouseLocation);
  
  if (distToWarehouse < GEOFENCE_RADIUS_M && previousLocation) {
    const prevDist = haversineDistance(previousLocation, warehouseLocation);
    if (prevDist >= GEOFENCE_RADIUS_M) {
      return 'GEOFENCE_ENTERED: Driver entered warehouse zone';
    }
  }

  return null;
}
```

**Workflow: ETA Calculation**
```typescript
// lib/eta-calculator.ts
import { haversineDistance } from '@/lib/geo-utils';

interface TrafficPattern {
  hour: number;
  avgSpeedMps: number; // meters per second
}

const TRAFFIC_PATTERNS: TrafficPattern[] = [
  // Rush hours 8am-9am, 5pm-7pm
  { hour: 8, avgSpeedMps: 8 }, // ~29 km/h
  { hour: 12, avgSpeedMps: 12 }, // ~43 km/h
  { hour: 17, avgSpeedMps: 7 }, // ~25 km/h
  // Off-peak
  { hour: 14, avgSpeedMps: 15 }, // ~54 km/h
];

export function calculateETA(
  currentLocation: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  currentSpeedMps: number
): { etaMinutes: number; confidenceRange: [number, number] } {
  const distanceM = haversineDistance(currentLocation, destination) * 1000;
  const currentHour = new Date().getHours();

  // Find traffic pattern for current hour
  const trafficPattern = TRAFFIC_PATTERNS.find(p => p.hour === currentHour) || {
    avgSpeedMps: 12,
  };

  // Average: 60% current speed, 40% traffic pattern
  const estimatedSpeedMps = currentSpeedMps * 0.6 + trafficPattern.avgSpeedMps * 0.4;
  const etaSeconds = distanceM / estimatedSpeedMps;
  const etaMinutes = Math.round(etaSeconds / 60);

  // Confidence interval: ±5 minutes
  return {
    etaMinutes,
    confidenceRange: [Math.max(1, etaMinutes - 5), etaMinutes + 5],
  };
}
```

### Tooling

**Core**
- `@supabase/realtime-js@^2.x.x` - WebSocket subscriptions
- `geolocation-utils` or custom haversine distance calculator
- `zustand@^4.5.0` - Driver location store
- Maps SDK: Google Maps / Mapbox for visualization

**Utilities**
- `useRealtimeSubscription` hook wrapper
- `useGeolocation` hook for position tracking
- Geofence checker utility
- ETA calculator with traffic patterns
- Route optimization utility (Google Maps / OSRM)

**Testing**
- Playwright: mock geolocation, simulate moving driver
- Vitest: test ETA calculation with various speeds/distances
- E2E: verify real-time updates propagate to admin + customer UI

**Monitoring**
- Track WebSocket connection uptime, message latency
- Monitor geofence violation frequency per driver
- ETA accuracy metrics: predicted vs actual arrival
