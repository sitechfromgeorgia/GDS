/**
 * Performance Monitoring Types
 * Created: 2025-11-25
 * Purpose: Type definitions for database performance monitoring, slow query tracking, and connection pool status
 */

/**
 * Performance metric for database operations
 */
export interface PerformanceMetric {
  /** Metric identifier (e.g., "query_latency", "connection_pool_utilization") */
  name: string
  /** Metric value */
  value: number
  /** Measurement unit (e.g., "ms", "percent", "count") */
  unit: 'ms' | 'percent' | 'count' | 'bytes'
  /** Timestamp when metric was recorded */
  timestamp: Date
  /** Optional labels for metric dimensions (e.g., { table: "orders", operation: "select" }) */
  labels?: Record<string, string>
}

/**
 * Slow query log entry from pg_stat_statements
 */
export interface SlowQueryLog {
  /** Query ID from pg_stat_statements */
  queryid: number
  /** SQL query text (potentially truncated) */
  query: string
  /** Number of times this query was executed */
  calls: number
  /** Total execution time in milliseconds */
  total_exec_time: number
  /** Average execution time in milliseconds */
  mean_exec_time: number
  /** Minimum execution time in milliseconds */
  min_exec_time: number
  /** Maximum execution time in milliseconds */
  max_exec_time: number
  /** Standard deviation of execution time */
  stddev_exec_time: number
  /** Number of rows affected/returned */
  rows: number
  /** When query was first seen */
  first_seen?: Date
  /** When query was last executed */
  last_seen?: Date
}

/**
 * Connection pool status from PgBouncer
 */
export interface ConnectionPoolStatus {
  /** Database name */
  database: string
  /** Current number of active client connections */
  active_clients: number
  /** Current number of waiting client connections */
  waiting_clients: number
  /** Maximum allowed client connections */
  max_client_conn: number
  /** Current number of active server connections to PostgreSQL */
  active_servers: number
  /** Number of idle server connections */
  idle_servers: number
  /** Pool size (target number of server connections) */
  pool_size: number
  /** Connection pool utilization percentage (0-100) */
  utilization_percent: number
  /** Pool mode (transaction, session, statement) */
  pool_mode: 'transaction' | 'session' | 'statement'
  /** Average query duration in milliseconds */
  avg_query_time?: number
  /** Timestamp when status was recorded */
  timestamp: Date
}

/**
 * Cache status metrics
 */
export interface CacheStatus {
  /** Cache name/type (e.g., "redis", "product_cache") */
  name: string
  /** Total cache hits */
  hits: number
  /** Total cache misses */
  misses: number
  /** Cache hit ratio (0-1) */
  hit_ratio: number
  /** Number of keys in cache */
  keys: number
  /** Memory usage in bytes */
  memory_used: number
  /** Maximum memory allowed in bytes */
  memory_max: number
  /** Memory utilization percentage (0-100) */
  memory_utilization: number
  /** Cache eviction count */
  evictions: number
  /** Timestamp when status was recorded */
  timestamp: Date
}

/**
 * WebSocket connection health metrics
 */
export interface WebSocketHealth {
  /** Total active WebSocket connections */
  active_connections: number
  /** Maximum allowed connections */
  max_connections: number
  /** Number of subscriptions (channels) */
  subscriptions: number
  /** Average message delivery latency in milliseconds */
  avg_latency_ms: number
  /** p95 message delivery latency in milliseconds */
  p95_latency_ms: number
  /** p99 message delivery latency in milliseconds */
  p99_latency_ms: number
  /** Total messages sent */
  messages_sent: number
  /** Total messages received */
  messages_received: number
  /** Number of connection errors */
  errors: number
  /** Number of reconnections */
  reconnections: number
  /** Timestamp when health was recorded */
  timestamp: Date
}

/**
 * Aggregated performance dashboard data
 */
export interface PerformanceDashboard {
  /** Database performance metrics */
  database: {
    /** Average query latency (p50) in milliseconds */
    query_latency_p50: number
    /** p95 query latency in milliseconds */
    query_latency_p95: number
    /** p99 query latency in milliseconds */
    query_latency_p99: number
    /** Queries per second */
    queries_per_second: number
    /** Connection pool status */
    pool_status: ConnectionPoolStatus
    /** Top 10 slow queries */
    slow_queries: SlowQueryLog[]
  }
  /** Cache performance metrics */
  cache?: {
    /** Overall cache hit ratio (0-1) */
    hit_ratio: number
    /** Cache statuses by type */
    statuses: CacheStatus[]
  }
  /** WebSocket/real-time metrics */
  realtime?: {
    /** WebSocket connection health */
    health: WebSocketHealth
  }
  /** Timestamp when dashboard was generated */
  timestamp: Date
}

/**
 * Alert threshold configuration
 */
export interface AlertThreshold {
  /** Metric name to monitor */
  metric: string
  /** Alert severity level */
  severity: 'info' | 'warning' | 'critical'
  /** Threshold value */
  threshold: number
  /** Comparison operator */
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq'
  /** Alert message template */
  message: string
  /** Whether alert is currently active */
  active: boolean
}

/**
 * Performance alert
 */
export interface PerformanceAlert {
  /** Alert unique identifier */
  id: string
  /** Metric that triggered the alert */
  metric: string
  /** Current metric value */
  value: number
  /** Configured threshold */
  threshold: AlertThreshold
  /** When alert was triggered */
  triggered_at: Date
  /** Whether alert has been acknowledged */
  acknowledged: boolean
  /** When alert was acknowledged */
  acknowledged_at?: Date
  /** User who acknowledged the alert */
  acknowledged_by?: string
}
