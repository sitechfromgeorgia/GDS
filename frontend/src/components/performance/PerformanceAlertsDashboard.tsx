'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bell, BellOff, AlertTriangle, AlertCircle, Info, XCircle, CheckCircle } from 'lucide-react'
import { usePerformanceAlerts } from '@/hooks/usePerformanceAlerts'
import { formatDistanceToNow } from 'date-fns'

const PerformanceAlertsDashboard = () => {
  const {
    alerts,
    thresholds,
    isEnabled,
    enableAlerting,
    disableAlerting,
    clearAlerts,
    getAlertCountBySeverity,
    getRecentAlerts,
  } = usePerformanceAlerts()

  const alertCounts = getAlertCountBySeverity()
  const recentAlerts = getRecentAlerts(20)

  /**
   * Get icon for alert severity
   * @param severity Alert severity
   * @returns Icon component
   */
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-destructive" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />
    }
  }

  /**
   * Get badge variant for alert severity
   * @param severity Alert severity
   * @returns Badge variant
   */
  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'error':
        return 'destructive'
      case 'warning':
        return 'default'
      case 'info':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center">
          <Bell className="mr-2 h-6 w-6" />
          Performance Alerts
        </h2>
        <div className="flex items-center space-x-2">
          <Badge variant={isEnabled ? 'default' : 'secondary'}>
            {isEnabled ? 'Alerts Enabled' : 'Alerts Disabled'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={isEnabled ? disableAlerting : enableAlerting}
          >
            {isEnabled ? (
              <>
                <BellOff className="mr-2 h-4 w-4" />
                Disable
              </>
            ) : (
              <>
                <Bell className="mr-2 h-4 w-4" />
                Enable
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={clearAlerts} disabled={alerts.length === 0}>
            <XCircle className="mr-2 h-4 w-4" />
            Clear Alerts
          </Button>
        </div>
      </div>

      {/* Alert Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertCircle className="mr-2 h-4 w-4 text-destructive" />
              Critical
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertCounts.critical}</div>
            <p className="text-xs text-muted-foreground">Requires immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <XCircle className="mr-2 h-4 w-4 text-destructive" />
              Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertCounts.error}</div>
            <p className="text-xs text-muted-foreground">Application errors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertTriangle className="mr-2 h-4 w-4 text-yellow-500" />
              Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertCounts.warning}</div>
            <p className="text-xs text-muted-foreground">Performance warnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Info className="mr-2 h-4 w-4 text-blue-500" />
              Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertCounts.info}</div>
            <p className="text-xs text-muted-foreground">Informational alerts</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="mr-2 h-5 w-5" />
            Recent Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mb-4 text-green-500" />
              <h3 className="text-lg font-medium mb-2">No Recent Alerts</h3>
              <p className="text-center">
                All systems are operating normally. Alerts will appear here when performance issues
                are detected.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {recentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start mb-2 sm:mb-0">
                      <div className="mt-0.5 mr-3">{getSeverityIcon(alert.severity)}</div>
                      <div>
                        <h3 className="font-medium">{alert.metric}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="outline">Value: {alert.value.toFixed(2)}</Badge>
                          <Badge variant="outline">Threshold: {alert.threshold.toFixed(2)}</Badge>
                          {alert.tags &&
                            Object.entries(alert.tags).map(([key, value]) => (
                              <Badge key={key} variant="outline">
                                {key}: {value}
                              </Badge>
                            ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center mt-2 sm:mt-0">
                      <Badge variant={getSeverityVariant(alert.severity)}>
                        {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                      </Badge>
                      <span className="text-xs text-muted-foreground ml-3 whitespace-nowrap">
                        {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Thresholds Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Alert Thresholds
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {thresholds.map((threshold, index) => (
              <div
                key={`${threshold.metric}-${index}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <h3 className="font-medium">{threshold.metric}</h3>
                  <p className="text-sm text-muted-foreground">
                    Threshold: {threshold.threshold} | Cooldown:{' '}
                    {Math.floor(threshold.cooldownPeriod / 1000 / 60)} minutes
                  </p>
                </div>

                <div className="flex items-center mt-2 sm:mt-0">
                  <Badge variant={threshold.enabled ? 'default' : 'secondary'}>
                    {threshold.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                  <Badge variant="outline" className="ml-2">
                    {threshold.severity}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PerformanceAlertsDashboard
