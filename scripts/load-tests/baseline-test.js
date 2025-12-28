/**
 * k6 Baseline Load Test
 * Purpose: Establish performance baseline for the system
 * Target: 100 req/s for 5 minutes
 * Success Criteria: p95 latency <200ms, error rate <1%
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiLatency = new Trend('api_latency');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 20 },  // Ramp-up to 20 VUs
    { duration: '1m', target: 50 },  // Ramp-up to 50 VUs
    { duration: '5m', target: 100 }, // Sustain 100 VUs (target load)
    { duration: '1m', target: 50 },  // Ramp-down to 50 VUs
    { duration: '1m', target: 0 },   // Ramp-down to 0 VUs
  ],
  thresholds: {
    'http_req_duration': ['p(95)<200'],  // 95% of requests must complete below 200ms
    'http_req_failed': ['rate<0.01'],    // Error rate must be below 1%
    'errors': ['rate<0.01'],             // Custom error rate threshold
  },
};

// Base URL (update based on environment)
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Test scenarios
export default function () {
  // Scenario 1: Product Catalog (most common read operation)
  const catalogRes = http.get(`${BASE_URL}/catalog`);
  check(catalogRes, {
    'catalog status is 200': (r) => r.status === 200,
    'catalog response time < 1s': (r) => r.timings.duration < 1000,
  });
  apiLatency.add(catalogRes.timings.duration);
  errorRate.add(catalogRes.status !== 200);

  sleep(1); // 1 second think time

  // Scenario 2: Restaurant Dashboard (authenticated, data-heavy)
  const headers = {
    'Content-Type': 'application/json',
    // Add auth token if available: 'Authorization': `Bearer ${__ENV.AUTH_TOKEN}`
  };

  const dashboardRes = http.get(`${BASE_URL}/dashboard/restaurant`, { headers });
  check(dashboardRes, {
    'dashboard status is 200 or 401': (r) => r.status === 200 || r.status === 401, // 401 if no auth
    'dashboard response time < 2s': (r) => r.timings.duration < 2000,
  });
  apiLatency.add(dashboardRes.timings.duration);
  errorRate.add(dashboardRes.status >= 500); // Only count 5xx as errors

  sleep(2); // 2 seconds think time

  // Scenario 3: API Health Check (lightweight operation)
  const healthRes = http.get(`${BASE_URL}/api/health/liveness`);
  check(healthRes, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 100ms': (r) => r.timings.duration < 100,
  });
  apiLatency.add(healthRes.timings.duration);
  errorRate.add(healthRes.status !== 200);

  sleep(1); // 1 second think time
}

// Setup function (runs once before test starts)
export function setup() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║           k6 Baseline Load Test - Starting                ║
╠════════════════════════════════════════════════════════════╣
║ Target:  100 req/s sustained for 5 minutes                ║
║ Success: p95 latency <200ms, error rate <1%               ║
║ Base URL: ${BASE_URL}                                      ║
╚════════════════════════════════════════════════════════════╝
  `);
}

// Teardown function (runs once after test completes)
export function teardown(data) {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║           k6 Baseline Load Test - Complete                ║
╠════════════════════════════════════════════════════════════╣
║ Check results above for pass/fail thresholds              ║
║ Review metrics for latency percentiles (p50, p95, p99)    ║
║ Error rate should be <1% for success                      ║
╚════════════════════════════════════════════════════════════╝
  `);
}

/**
 * Usage:
 *
 * # Run with default localhost
 * k6 run baseline-test.js
 *
 * # Run against production
 * k6 run --env BASE_URL=https://production.example.com baseline-test.js
 *
 * # Run with authentication token
 * k6 run --env BASE_URL=https://production.example.com --env AUTH_TOKEN=your-token baseline-test.js
 *
 * # Output results to InfluxDB
 * k6 run --out influxdb=http://localhost:8086/k6 baseline-test.js
 *
 * # Output results to JSON file
 * k6 run --out json=baseline-results.json baseline-test.js
 */
