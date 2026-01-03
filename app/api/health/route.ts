/**
 * Health Check API Route
 * Provides system status and database connectivity check
 */

import { handleApiError } from '@/lib/api/errors'
import { success, error } from '@/lib/api/responses'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const startTime = Date.now()

    // Basic system info
    const systemInfo = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    }

    // Test database connectivity
    let dbStatus = 'unknown'
    let dbLatency = 0

    try {
      const dbStartTime = Date.now()
      const supabase = await createServerClient()

      // Simple query to test connectivity
      const { error: dbError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
        .single()

      dbLatency = Date.now() - dbStartTime

      if (dbError && dbError.code !== 'PGRST116') {
        // PGRST116 is "not found" which is acceptable
        dbStatus = 'error'
        console.error('Database health check failed:', dbError)
      } else {
        dbStatus = 'healthy'
      }
    } catch (dbError) {
      dbStatus = 'error'
      console.error('Database connection failed:', dbError)
    }

    const responseTime = Date.now() - startTime

    const healthData = {
      ...systemInfo,
      database: {
        status: dbStatus,
        latency: `${dbLatency}ms`,
      },
      performance: {
        responseTime: `${responseTime}ms`,
      },
      services: {
        supabase: dbStatus === 'healthy' ? 'operational' : 'degraded',
        auth: 'operational', // We'll assume auth is working if DB is working
      },
    }

    // Return appropriate status code based on health
    if (dbStatus === 'error') {
      return error(
        'HEALTH_CHECK_FAILED',
        'One or more services are unhealthy',
        503,
        healthData
      )
    }

    return success(healthData)
  } catch (err) {
    console.error('Health check error:', err)

    const { status, body } = handleApiError(err)
    return Response.json(body, { status })
  }
}

// Disable caching for health checks
export const dynamic = 'force-dynamic'
export const revalidate = 0
