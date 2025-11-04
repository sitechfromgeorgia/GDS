/**
 * Winston Logger Configuration for Production
 * Provides structured logging with log aggregation support
 */

import winston from 'winston'
import path from 'path'

const { combine, timestamp, json, printf, colorize, errors } = winston.format

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}] : ${message}`
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`
  }
  return msg
})

// Determine log level from environment
const getLogLevel = (): string => {
  if (process.env.LOG_LEVEL) {
    return process.env.LOG_LEVEL
  }
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug'
}

// Create transports based on environment
const createTransports = () => {
  const transports: winston.transport[] = []

  // Console transport (always enabled)
  transports.push(
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        consoleFormat
      ),
    })
  )

  // File transports (production only)
  if (process.env.NODE_ENV === 'production') {
    const logsDir = process.env.LOGS_DIR || '/var/log/app'

    // Combined log file
    transports.push(
      new winston.transports.File({
        filename: path.join(logsDir, 'combined.log'),
        format: combine(timestamp(), errors({ stack: true }), json()),
        maxsize: 10485760, // 10MB
        maxFiles: 10,
        tailable: true,
      })
    )

    // Error log file
    transports.push(
      new winston.transports.File({
        filename: path.join(logsDir, 'error.log'),
        level: 'error',
        format: combine(timestamp(), errors({ stack: true }), json()),
        maxsize: 10485760, // 10MB
        maxFiles: 10,
        tailable: true,
      })
    )

    // Access log file
    transports.push(
      new winston.transports.File({
        filename: path.join(logsDir, 'access.log'),
        format: combine(timestamp(), json()),
        maxsize: 10485760, // 10MB
        maxFiles: 10,
        tailable: true,
      })
    )
  }

  // Optional: HTTP transport for log aggregation services
  if (process.env.LOG_AGGREGATION_URL) {
    // Example: Logtail, Datadog, Logstash, etc.
    transports.push(
      new winston.transports.Http({
        host: process.env.LOG_AGGREGATION_HOST || 'localhost',
        port: parseInt(process.env.LOG_AGGREGATION_PORT || '3000'),
        path: process.env.LOG_AGGREGATION_PATH || '/logs',
        ssl: process.env.LOG_AGGREGATION_SSL === 'true',
        auth: process.env.LOG_AGGREGATION_AUTH
          ? {
              username: process.env.LOG_AGGREGATION_USERNAME || '',
              password: process.env.LOG_AGGREGATION_PASSWORD || '',
            }
          : undefined,
      })
    )
  }

  return transports
}

// Create the Winston logger instance
export const winstonLogger = winston.createLogger({
  level: getLogLevel(),
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    json()
  ),
  defaultMeta: {
    service: 'georgian-distribution-system',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
  },
  transports: createTransports(),
  exitOnError: false,
})

// Create a stream for Morgan HTTP logging middleware
export const morganStream = {
  write: (message: string) => {
    winstonLogger.info(message.trim())
  },
}

// Helper functions for structured logging
export const logRequest = (req: {
  method: string
  url: string
  ip?: string
  userId?: string
}) => {
  winstonLogger.info('HTTP Request', {
    type: 'request',
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: req.userId,
  })
}

export const logResponse = (req: {
  method: string
  url: string
  statusCode: number
  duration: number
}) => {
  winstonLogger.info('HTTP Response', {
    type: 'response',
    method: req.method,
    url: req.url,
    statusCode: req.statusCode,
    duration: req.duration,
  })
}

export const logError = (error: Error, context?: Record<string, any>) => {
  winstonLogger.error('Application Error', {
    type: 'error',
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    ...context,
  })
}

export const logDatabase = (query: {
  table: string
  operation: string
  duration: number
  rowCount?: number
}) => {
  winstonLogger.debug('Database Query', {
    type: 'database',
    ...query,
  })
}

export const logPerformance = (metric: {
  operation: string
  duration: number
  metadata?: Record<string, any>
}) => {
  winstonLogger.info('Performance Metric', {
    type: 'performance',
    ...metric,
  })
}

export const logSecurity = (event: {
  type: 'auth' | 'access_denied' | 'suspicious_activity'
  userId?: string
  ip?: string
  details: string
}) => {
  winstonLogger.warn('Security Event', {
    type: 'security',
    ...event,
  })
}

// Export the logger for general use
export default winstonLogger
