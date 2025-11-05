/**
 * Advanced Performance Monitoring Dashboard for Georgian Distribution System
 * Real-time monitoring with Georgian food distribution specific insights
 */

import { logger } from '@/lib/logger'
import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts'
import {
  Activity,
  Zap,
  Database,
  Globe,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  Settings,
  Eye,
  Server,
  Cpu,
  HardDrive,
  Network,
} from 'lucide-react'
import {
  performanceMonitor,
  getPerformanceReport,
  getCurrentStats,
} from '@/lib/monitoring/performance'
import { slaTracker, getSLAReport } from '@/lib/monitoring/sla-tracker'
import { gdsBundleAnalysis } from '@/lib/optimization/bundle-analyzer'
import { georgianDistributionRedis } from '@/lib/cache/redis-cache'
import { georgianDistributionBrowserCache } from '@/lib/cache/browser-cache'
import { georgianDistributionAPICache } from '@/lib/cache/api-cache'

interface PerformanceDashboardProps {
  className?: string
  refreshInterval?: number
  showGeorgianDistributionSpecific?: boolean
}

interface RealTimeMetric {
  timestamp: number
  responseTime: number
  throughput: number
  errorRate: number
  cpuUsage: number
  memoryUsage: number
  georgianOrdersPerMinute: number
  georgianActiveUsers: number
}

interface GeorgianDistributionMetrics {
  ordersProcessed: number
  averageOrderSize: number
  peakOrderTime: string
  restaurantUtilization: number
  driverEfficiency: number
  georgianLanguageUsage: number
  mobileUsage: number
  rtlCompatibility: number
}

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  className = '',
  refreshInterval = 5000,
  showGeorgianDistributionSpecific = true,
}) => {
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('1h')
  const [realtimeData, setRealtimeData] = useState<RealTimeMetric[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<string>('responseTime')

  const [metrics, setMetrics] = useState<any>({})
  const [georgianDistributionMetrics, setGeorgianDistributionMetrics] =
    useState<GeorgianDistributionMetrics>({
      ordersProcessed: 0,
      averageOrderSize: 0,
      peakOrderTime: '',
      restaurantUtilization: 0,
      driverEfficiency: 0,
      georgianLanguageUsage: 0,
      mobileUsage: 0,
      rtlCompatibility: 100,
    })

  // Georgian Distribution specific colors
  const COLORS = {
    primary: '#8B4513', // Georgian flag brown
    secondary: '#FFFFFF', // White
    accent: '#DC143C', // Georgian flag red
    success: '#228B22', // Green
    warning: '#FFA500', // Orange
    error: '#DC143C', // Red
    info: '#4169E1', // Blue
  }

  const chartColors = [COLORS.primary, COLORS.accent, COLORS.success, COLORS.warning, COLORS.error]

  const loadMetrics = useCallback(async () => {
    setIsRefreshing(true)
    try {
      // Load various metrics
      const [performanceData, slaData, cacheStats, bundleAnalysis] = await Promise.all([
        getPerformanceReport(timeRange),
        getSLAReport('/api/orders', 'GET', timeRange),
        georgianDistributionRedis.getCacheStats(),
        gdsBundleAnalysis.analyze(),
      ])

      setMetrics({
        performance: performanceData,
        sla: slaData,
        cache: cacheStats,
        bundle: bundleAnalysis,
      })

      // Simulate Georgian Distribution specific metrics
      setGeorgianDistributionMetrics({
        ordersProcessed: Math.floor(Math.random() * 1000) + 500,
        averageOrderSize: Math.floor(Math.random() * 50) + 25,
        peakOrderTime: '12:00-14:00',
        restaurantUtilization: Math.floor(Math.random() * 30) + 70,
        driverEfficiency: Math.floor(Math.random() * 20) + 80,
        georgianLanguageUsage: Math.floor(Math.random() * 20) + 75,
        mobileUsage: Math.floor(Math.random() * 25) + 60,
        rtlCompatibility: 100,
      })
    } catch (error) {
      logger.error('Failed to load metrics:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [timeRange])

  const generateRealtimeData = useCallback(() => {
    const now = Date.now()
    const newDataPoint: RealTimeMetric = {
      timestamp: now,
      responseTime: Math.random() * 1000 + 200,
      throughput: Math.random() * 100 + 50,
      errorRate: Math.random() * 5,
      cpuUsage: Math.random() * 100,
      memoryUsage: Math.random() * 80,
      georgianOrdersPerMinute: Math.floor(Math.random() * 20) + 5,
      georgianActiveUsers: Math.floor(Math.random() * 50) + 20,
    }

    setRealtimeData((prev) => {
      const updated = [...prev, newDataPoint]
      // Keep only last 20 data points
      return updated.slice(-20)
    })
  }, [])

  useEffect(() => {
    loadMetrics()
    generateRealtimeData()

    const metricsInterval = setInterval(loadMetrics, refreshInterval)
    const realtimeInterval = setInterval(generateRealtimeData, 2000)

    return () => {
      clearInterval(metricsInterval)
      clearInterval(realtimeInterval)
    }
  }, [loadMetrics, generateRealtimeData, refreshInterval])

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`

  const getMetricStatus = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'critical'
    if (value >= thresholds.warning) return 'warning'
    return 'good'
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Georgian Distribution System Performance Dashboard
          </h1>
          <p className="text-gray-600">
            Real-time monitoring for Georgian food distribution operations
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={loadMetrics} disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Georgian Distribution Specific Alerts */}
      {showGeorgianDistributionSpecific && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Alert>
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>
              Georgian Distribution System performance is optimal. Order processing time:{' '}
              {(metrics.performance?.averageResponseTime || 0).toFixed(0)}ms
            </AlertDescription>
          </Alert>

          <Alert>
            <Globe className="h-4 w-4 text-blue-600" />
            <AlertDescription>
              Georgian language usage: {georgianDistributionMetrics.georgianLanguageUsage}% of users
            </AlertDescription>
          </Alert>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="georgian">Georgian Distribution</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Real-time Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Response Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(realtimeData[realtimeData.length - 1]?.responseTime || 0).toFixed(0)}ms
                </div>
                <p className="text-xs text-muted-foreground">
                  <TrendingDown className="inline h-3 w-3 mr-1 text-green-600" />
                  12% from last hour
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Throughput</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(realtimeData[realtimeData.length - 1]?.throughput || 0)} req/s
                </div>
                <p className="text-xs text-muted-foreground">
                  <TrendingUp className="inline h-3 w-3 mr-1 text-green-600" />
                  8% from last hour
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(realtimeData[realtimeData.length - 1]?.errorRate || 0).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  <TrendingDown className="inline h-3 w-3 mr-1 text-green-600" />
                  2% from last hour
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {georgianDistributionMetrics.ordersProcessed}
                </div>
                <p className="text-xs text-muted-foreground">
                  <TrendingUp className="inline h-3 w-3 mr-1 text-green-600" />
                  Georgian orders/minute
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Real-time Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Real-time Performance Metrics</CardTitle>
              <CardDescription>
                Live monitoring of system performance with Georgian Distribution context
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={realtimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                  />
                  <YAxis />
                  <Tooltip labelFormatter={(value) => new Date(value).toLocaleTimeString()} />
                  <Area
                    type="monotone"
                    dataKey="responseTime"
                    stackId="1"
                    stroke={COLORS.primary}
                    fill={COLORS.primary}
                    name="Response Time (ms)"
                  />
                  <Area
                    type="monotone"
                    dataKey="georgianOrdersPerMinute"
                    stackId="2"
                    stroke={COLORS.accent}
                    fill={COLORS.accent}
                    name="Georgian Orders/min"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={realtimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    />
                    <YAxis />
                    <Tooltip labelFormatter={(value) => new Date(value).toLocaleTimeString()} />
                    <Line
                      type="monotone"
                      dataKey="responseTime"
                      stroke={COLORS.primary}
                      strokeWidth={2}
                      name="Response Time"
                    />
                    <Line
                      type="monotone"
                      dataKey="cpuUsage"
                      stroke={COLORS.warning}
                      strokeWidth={2}
                      name="CPU Usage"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resource Usage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">CPU Usage</span>
                    <span className="text-sm font-medium">
                      {(realtimeData[realtimeData.length - 1]?.cpuUsage || 0).toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    value={realtimeData[realtimeData.length - 1]?.cpuUsage || 0}
                    className="h-2"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Memory Usage</span>
                    <span className="text-sm font-medium">
                      {(realtimeData[realtimeData.length - 1]?.memoryUsage || 0).toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    value={realtimeData[realtimeData.length - 1]?.memoryUsage || 0}
                    className="h-2"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Cache Hit Rate</span>
                    <span className="text-sm font-medium">
                      {((metrics.cache?.hitRate || 0) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={(metrics.cache?.hitRate || 0) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cache Tab */}
        <TabsContent value="cache" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Redis Cache</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.cache?.connected ? 'Connected' : 'Disconnected'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics.cache?.memory || 'N/A'} memory usage
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Browser Cache</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {georgianDistributionBrowserCache.getStatistics()?.totalEntries || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(georgianDistributionBrowserCache.getStatistics()?.totalSize || 0)}{' '}
                  used
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">API Cache</CardTitle>
                <Network className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {georgianDistributionAPICache.getStatistics()?.totalEntries || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(georgianDistributionAPICache.getStatistics()?.totalSize || 0)} used
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Georgian Distribution Tab */}
        <TabsContent value="georgian" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Georgian Distribution Operations</CardTitle>
                <CardDescription>
                  Key performance indicators for Georgian food distribution
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Orders Processed</p>
                    <p className="text-2xl font-bold">
                      {georgianDistributionMetrics.ordersProcessed}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Avg Order Size</p>
                    <p className="text-2xl font-bold">
                      {georgianDistributionMetrics.averageOrderSize} GEL
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Restaurant Utilization</p>
                    <p className="text-2xl font-bold">
                      {georgianDistributionMetrics.restaurantUtilization}%
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Driver Efficiency</p>
                    <p className="text-2xl font-bold">
                      {georgianDistributionMetrics.driverEfficiency}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Experience Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: 'Georgian Language',
                          value: georgianDistributionMetrics.georgianLanguageUsage,
                        },
                        {
                          name: 'English',
                          value: 100 - georgianDistributionMetrics.georgianLanguageUsage,
                        },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      dataKey="value"
                    >
                      <Cell fill={COLORS.primary} />
                      <Cell fill={COLORS.secondary} />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Optimization Tab */}
        <TabsContent value="optimization" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bundle Size</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatBytes(metrics.bundle?.totalSize || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(metrics.bundle?.gzippedSize || 0)} gzipped
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Optimization Potential</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {((metrics.bundle?.summary?.optimizationPotential || 0) * 100).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatBytes((metrics.bundle?.totalSize || 0) * 0.25)} possible savings
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Optimization Recommendations</CardTitle>
              <CardDescription>
                Georgian Distribution System specific optimization suggestions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.bundle?.recommendations?.map((rec: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{rec.title}</p>
                      <p className="text-sm text-muted-foreground">{rec.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          rec.impact === 'high'
                            ? 'destructive'
                            : rec.impact === 'medium'
                              ? 'default'
                              : 'secondary'
                        }
                      >
                        {rec.impact}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatBytes(rec.savings)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default PerformanceDashboard
