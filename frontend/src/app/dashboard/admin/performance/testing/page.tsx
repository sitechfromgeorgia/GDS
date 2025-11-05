'use client'
import { logger } from '@/lib/logger'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Play, Pause, RotateCcw, CheckCircle, XCircle, Clock, Zap, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import {
  runComprehensivePerformanceTests,
  PerformanceTester,
  PerformanceTestResult,
} from '@/utils/performance-testing'
import { useToast } from '@/hooks/use-toast'

const PerformanceTestingPage = () => {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isRunning, setIsRunning] = useState(false)
  const [testResults, setTestResults] = useState<PerformanceTestResult[]>([])
  const [progress, setProgress] = useState(0)
  const [totalTests, setTotalTests] = useState(0)

  // Check if user is admin
  if (user?.app_metadata?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">You do not have permission to access this page.</p>
            <Button onClick={() => router.push('/dashboard')} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  /**
   * Run performance tests
   */
  const runTests = async () => {
    if (isRunning) return

    setIsRunning(true)
    setTestResults([])
    setProgress(0)

    try {
      const tester = await runComprehensivePerformanceTests()
      const results = tester.getResults()

      setTestResults(results)

      // Show toast notification
      toast({
        title: 'Performance Tests Completed',
        description: `Ran ${results.length} tests with ${results.filter((r) => r.success).length} passing.`,
      })
    } catch (error) {
      logger.error('Performance testing failed:', error)
      toast({
        title: 'Performance Testing Failed',
        description: 'An error occurred while running performance tests.',
        variant: 'destructive',
      })
    } finally {
      setIsRunning(false)
      setProgress(100)
    }
  }

  /**
   * Clear test results
   */
  const clearResults = () => {
    setTestResults([])
    setProgress(0)
  }

  /**
   * Get test statistics
   */
  const getTestStats = () => {
    const passed = testResults.filter((r) => r.success).length
    const failed = testResults.filter((r) => !r.success).length
    const avgDuration =
      testResults.length > 0
        ? testResults.reduce((sum, r) => sum + r.duration, 0) / testResults.length
        : 0

    return { passed, failed, avgDuration }
  }

  const { passed, failed, avgDuration } = getTestStats()

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Performance Testing</h1>
        <Button onClick={() => router.push('/dashboard/admin/performance')} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Performance Dashboard
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tests Run</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testResults.length}</div>
            <p className="text-xs text-muted-foreground">Total tests executed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {testResults.length > 0
                ? `${Math.round((passed / testResults.length) * 100)}%`
                : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">
              {passed} passed, {failed} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgDuration > 0 ? `${avgDuration.toFixed(2)}ms` : '0ms'}
            </div>
            <p className="text-xs text-muted-foreground">Average test duration</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Run Performance Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={runTests} disabled={isRunning} className="flex-1">
              {isRunning ? (
                <>
                  <Pause className="mr-2 h-4 w-4" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run Comprehensive Tests
                </>
              )}
            </Button>

            <Button
              onClick={clearResults}
              variant="outline"
              disabled={isRunning || testResults.length === 0}
              className="flex-1"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Clear Results
            </Button>
          </div>

          {isRunning && (
            <div className="mt-4">
              <Progress value={progress} className="w-full" />
              <p className="text-center text-sm text-muted-foreground mt-2">
                Running performance tests...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center mb-2 sm:mb-0">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mr-3" />
                    )}
                    <div>
                      <h3 className="font-medium">{result.testName}</h3>
                      <p className="text-sm text-muted-foreground">
                        Duration: {result.duration.toFixed(2)}ms
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Badge variant={result.success ? 'default' : 'destructive'}>
                      {result.success ? 'PASS' : 'FAIL'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default PerformanceTestingPage
