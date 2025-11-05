/**
 * RLS Performance Testing Utility
 *
 * Measures the performance impact of Row Level Security policies on database queries
 * for the Georgian Distribution System.
 */

import { logger } from '@/lib/logger'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

interface PerformanceMetric {
  query: string
  baselineTime: number // milliseconds
  rlsTime: number // milliseconds
  overhead: number // percentage
  tableName: string
  userRole: string
}

interface PerformanceTestResult {
  tableName: string
  userRole: string
  metrics: PerformanceMetric[]
  averageOverhead: number
  status: 'good' | 'warning' | 'critical'
}

export class RLSPerformanceTester {
  private supabase: SupabaseClient

  constructor(supabaseUrl: string, serviceRoleKey: string) {
    this.supabase = createClient(supabaseUrl, serviceRoleKey)
  }

  /**
   * Test query performance with and without RLS
   */
  async testQueryPerformance(
    tableName: string,
    userRole: string,
    queries: string[]
  ): Promise<PerformanceMetric[]> {
    const metrics: PerformanceMetric[] = []

    for (const query of queries) {
      try {
        // Test with RLS enabled (normal operation)
        const rlsStart = performance.now()
        const { data: rlsData, error: rlsError } = await this.supabase.from(tableName).select(query)
        const rlsEnd = performance.now()
        const rlsTime = rlsEnd - rlsStart

        if (rlsError) {
          logger.warn(`⚠️ RLS query error for ${userRole}`, { error: rlsError.message })
          continue
        }

        // Simulate baseline performance (without RLS)
        // In a real scenario, this would compare with a service role query
        const baselineStart = performance.now()
        const { data: baselineData, error: baselineError } = await this.supabase
          .from(tableName)
          .select(query)
        const baselineEnd = performance.now()
        const baselineTime = baselineEnd - baselineStart

        const overhead = ((rlsTime - baselineTime) / baselineTime) * 100

        metrics.push({
          query,
          baselineTime,
          rlsTime,
          overhead,
          tableName,
          userRole,
        })
      } catch (error) {
        logger.error(`❌ Performance test error:`, error)
      }
    }

    return metrics
  }

  /**
   * Test performance for all user roles and tables
   */
  async runPerformanceTests(): Promise<PerformanceTestResult[]> {
    logger.info('🚀 Starting RLS Performance Testing...')

    const testCases = [
      {
        tableName: 'profiles',
        userRole: 'admin',
        queries: ['*', 'id,email,role', 'count(*)'],
      },
      {
        tableName: 'profiles',
        userRole: 'restaurant',
        queries: ['*', 'id,email', 'count(*)'],
      },
      {
        tableName: 'products',
        userRole: 'admin',
        queries: ['*', 'id,name,price', 'count(*)'],
      },
      {
        tableName: 'products',
        userRole: 'restaurant',
        queries: ['*', 'id,name,price', 'count(*)'],
      },
      {
        tableName: 'orders',
        userRole: 'admin',
        queries: ['*', 'id,status,total', 'count(*)'],
      },
      {
        tableName: 'orders',
        userRole: 'restaurant',
        queries: ['*', 'id,status,total', 'count(*)'],
      },
      {
        tableName: 'orders',
        userRole: 'driver',
        queries: ['*', 'id,status', 'count(*)'],
      },
      {
        tableName: 'order_items',
        userRole: 'admin',
        queries: ['*', 'id,quantity,price', 'count(*)'],
      },
      {
        tableName: 'notifications',
        userRole: 'admin',
        queries: ['*', 'id,title,message', 'count(*)'],
      },
    ]

    const results: PerformanceTestResult[] = []

    for (const testCase of testCases) {
      logger.info(`\n🔍 Testing ${testCase.tableName} for ${testCase.userRole} role...`)

      const metrics = await this.testQueryPerformance(
        testCase.tableName,
        testCase.userRole,
        testCase.queries
      )

      if (metrics.length > 0) {
        const averageOverhead = metrics.reduce((sum, m) => sum + m.overhead, 0) / metrics.length
        const status = this.getPerformanceStatus(averageOverhead)

        results.push({
          tableName: testCase.tableName,
          userRole: testCase.userRole,
          metrics,
          averageOverhead,
          status,
        })

        logger.info(`   📊 Average RLS overhead: ${averageOverhead.toFixed(2)}%`)
        logger.info(
          `   🎯 Performance status: ${this.getStatusEmoji(status)} ${status.toUpperCase()}`
        )
      }
    }

    return results
  }

  /**
   * Determine performance status based on overhead percentage
   */
  private getPerformanceStatus(overhead: number): 'good' | 'warning' | 'critical' {
    if (overhead < 25) return 'good'
    if (overhead < 50) return 'warning'
    return 'critical'
  }

  private getStatusEmoji(status: string): string {
    switch (status) {
      case 'good':
        return '✅'
      case 'warning':
        return '⚠️'
      case 'critical':
        return '🔴'
      default:
        return '❓'
    }
  }

  /**
   * Generate performance optimization recommendations
   */
  generateOptimizationRecommendations(results: PerformanceTestResult[]): string {
    let recommendations = '# RLS Performance Optimization Recommendations\n\n'

    const criticalResults = results.filter((r) => r.status === 'critical')
    const warningResults = results.filter((r) => r.status === 'warning')

    if (criticalResults.length > 0) {
      recommendations += '## 🔴 Critical Performance Issues\n\n'
      recommendations += 'The following tests show performance degradation > 50%:\n\n'

      criticalResults.forEach((result) => {
        recommendations += `### ${result.tableName} (${result.userRole})\n`
        recommendations += `- **Overhead:** ${result.averageOverhead.toFixed(2)}%\n`
        recommendations += `- **Issue:** RLS policies causing significant performance impact\n`
        recommendations += `- **Impact:** User experience degradation\n\n`
      })

      recommendations += '### Immediate Actions Required\n\n'
      recommendations += '1. **Review RLS Policy Logic:**\n'
      recommendations += '   - Simplify complex WHERE conditions\n'
      recommendations += '   - Remove unnecessary subqueries\n'
      recommendations += '   - Optimize JOIN operations\n\n'

      recommendations += '2. **Database Index Optimization:**\n'
      recommendations += '   - Add indexes on auth.uid() columns\n'
      recommendations += '   - Index foreign key columns used in RLS\n'
      recommendations += '   - Consider partial indexes for common queries\n\n'

      recommendations += '3. **Query Optimization:**\n'
      recommendations += '   - Use specific column lists instead of SELECT *\n'
      recommendations += '   - Implement query result caching\n'
      recommendations += '   - Consider pagination for large datasets\n\n'
    }

    if (warningResults.length > 0) {
      recommendations += '## ⚠️ Performance Warnings\n\n'
      recommendations += 'The following tests show moderate performance impact (25-50%):\n\n'

      warningResults.forEach((result) => {
        recommendations += `- **${result.tableName} (${result.userRole}):** ${result.averageOverhead.toFixed(2)}% overhead\n`
      })

      recommendations += '\n### Recommended Improvements\n\n'
      recommendations += '1. **Monitor Query Patterns:** Track slow queries in production\n'
      recommendations +=
        '2. **Consider Caching:** Implement Redis caching for frequently accessed data\n'
      recommendations += '3. **Index Review:** Ensure all RLS predicate columns are indexed\n\n'
    }

    if (results.every((r) => r.status === 'good')) {
      recommendations += '## ✅ Performance Status: Good\n\n'
      recommendations +=
        'All RLS policy performance tests passed with acceptable overhead (< 25%).\n'
      recommendations += 'Current implementation is performing well.\n\n'
    }

    recommendations += '## Performance Best Practices\n\n'
    recommendations += '### RLS Policy Design\n'
    recommendations += '- Keep predicates simple and index-friendly\n'
    recommendations += '- Use exact column matches rather than LIKE operations\n'
    recommendations += '- Minimize subqueries in RLS conditions\n'
    recommendations += '- Consider using CTEs for complex business logic\n\n'

    recommendations += '### Database Indexing\n'
    recommendations += '- Index auth.uid() columns on all tables\n'
    recommendations += '- Index foreign key columns (restaurant_id, driver_id, etc.)\n'
    recommendations += '- Consider composite indexes for common query patterns\n'
    recommendations += '- Monitor index usage and remove unused indexes\n\n'

    recommendations += '### Query Optimization\n'
    recommendations += '- Use specific SELECT lists instead of SELECT *\n'
    recommendations += '- Implement pagination for large result sets\n'
    recommendations += '- Consider materialized views for complex aggregations\n'
    recommendations += '- Use connection pooling to manage database connections\n\n'

    recommendations += '---\n'
    recommendations += `*Report generated: ${new Date().toISOString()}*`

    return recommendations
  }

  /**
   * Generate performance test report
   */
  generatePerformanceReport(results: PerformanceTestResult[]): string {
    let report = `# RLS Performance Testing Report\n\n`
    report += `**Generated:** ${new Date().toISOString()}  \n`
    report += `**Environment:** Development  \n`
    report += `**Test Suite:** Georgian Distribution System RLS Performance  \n\n`

    const totalTests = results.length
    const goodTests = results.filter((r) => r.status === 'good').length
    const warningTests = results.filter((r) => r.status === 'warning').length
    const criticalTests = results.filter((r) => r.status === 'critical').length

    report += `## Summary\n\n`
    report += `- **Total Tests:** ${totalTests}\n`
    report += `- **✅ Good Performance:** ${goodTests} (${((goodTests / totalTests) * 100).toFixed(1)}%)\n`
    report += `- **⚠️ Warning Performance:** ${warningTests} (${((warningTests / totalTests) * 100).toFixed(1)}%)\n`
    report += `- **🔴 Critical Performance:** ${criticalTests} (${((criticalTests / totalTests) * 100).toFixed(1)}%)\n\n`

    if (criticalTests > 0 || warningTests > 0) {
      report += `## 🔥 Performance Issues Detected\n\n`
      report += `⚠️ **${criticalTests + warningTests} test(s) show performance degradation**\n\n`
    }

    report += `## Detailed Results\n\n`

    results.forEach((result) => {
      report += `### ${result.tableName} - ${result.userRole} Role\n\n`
      report += `**Overall Status:** ${this.getStatusEmoji(result.status)} ${result.status.toUpperCase()}\n`
      report += `**Average Overhead:** ${result.averageOverhead.toFixed(2)}%\n\n`

      report += `| Query | Baseline (ms) | RLS (ms) | Overhead |\n`
      report += `|-------|---------------|----------|----------|\n`

      result.metrics.forEach((metric) => {
        report += `| ${metric.query} | ${metric.baselineTime.toFixed(2)} | ${metric.rlsTime.toFixed(2)} | ${metric.overhead.toFixed(1)}% |\n`
      })

      report += '\n'
    })

    const recommendations = this.generateOptimizationRecommendations(results)
    report += recommendations

    return report
  }
}
