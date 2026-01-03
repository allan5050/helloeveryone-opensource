'use client'

import { useState } from 'react'
import { Database, Download, Upload, AlertCircle, CheckCircle, ToggleLeft, ToggleRight } from 'lucide-react'
import { fallbackData } from '@/lib/fallback/demo-data'
import demoBackup from '@/data/demo-backup.json'

export default function DemoModePage() {
  const [isDemoMode, setIsDemoMode] = useState(fallbackData.isFallbackActive())
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null)

  const toggleDemoMode = () => {
    if (isDemoMode) {
      fallbackData.disableFallback()
      setIsDemoMode(false)
      setMessage({ type: 'info', text: 'Demo mode disabled. Using live database.' })
    } else {
      fallbackData.enableFallback()
      setIsDemoMode(true)
      setMessage({ type: 'success', text: 'Demo mode enabled. Using local backup data.' })
    }
  }

  const exportCurrentData = async () => {
    try {
      const response = await fetch('/api/admin/export-data')
      if (!response.ok) throw new Error('Export failed')

      const data = await response.blob()
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = `demo-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()

      setMessage({ type: 'success', text: 'Data exported successfully!' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to export data. Check console for details.' })
      console.error('Export error:', error)
    }
  }

  const getDataStats = () => {
    return {
      profiles: demoBackup.metadata?.profile_count || 0,
      events: demoBackup.metadata?.event_count || 0,
      matches: demoBackup.metadata?.match_scores_count || 0,
      favorites: demoBackup.metadata?.favorites_count || 0,
      insights: demoBackup.metadata?.ai_insights_count || 0,
      exportedAt: demoBackup.metadata?.exported_at || 'Unknown'
    }
  }

  const stats = getDataStats()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Demo Mode Control</h1>
          <p className="mt-2 text-gray-600">
            Manage fallback demo data for presentations and testing
          </p>
        </div>

        {/* Status Card */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Database className={`h-8 w-8 ${isDemoMode ? 'text-orange-500' : 'text-green-500'}`} />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Current Mode: {isDemoMode ? 'Demo (Offline)' : 'Live Database'}
                </h2>
                <p className="text-sm text-gray-600">
                  {isDemoMode
                    ? 'Using local backup data - no database connection required'
                    : 'Connected to Supabase database'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleDemoMode}
              className="flex items-center space-x-2 rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
            >
              {isDemoMode ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
              <span>{isDemoMode ? 'Switch to Live' : 'Switch to Demo'}</span>
            </button>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`mb-6 rounded-lg border p-4 ${
            message.type === 'success' ? 'border-green-200 bg-green-50' :
            message.type === 'error' ? 'border-red-200 bg-red-50' :
            'border-blue-200 bg-blue-50'
          }`}>
            <div className="flex items-center space-x-3">
              {message.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : message.type === 'error' ? (
                <AlertCircle className="h-5 w-5 text-red-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-blue-600" />
              )}
              <p className={`text-sm font-medium ${
                message.type === 'success' ? 'text-green-800' :
                message.type === 'error' ? 'text-red-800' :
                'text-blue-800'
              }`}>
                {message.text}
              </p>
            </div>
          </div>
        )}

        {/* Demo Data Stats */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Backup Data Statistics</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-gray-600">Profiles</p>
              <p className="text-2xl font-bold text-gray-900">{stats.profiles}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Events</p>
              <p className="text-2xl font-bold text-gray-900">{stats.events}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Match Scores</p>
              <p className="text-2xl font-bold text-gray-900">{stats.matches}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Favorites</p>
              <p className="text-2xl font-bold text-gray-900">{stats.favorites}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">AI Insights</p>
              <p className="text-2xl font-bold text-gray-900">{stats.insights}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Export</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(stats.exportedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Actions</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
              <div>
                <h4 className="font-medium text-gray-900">Export Current Data</h4>
                <p className="text-sm text-gray-600">
                  Download current database data as JSON backup
                </p>
              </div>
              <button
                onClick={exportCurrentData}
                disabled={isDemoMode}
                className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
              <div>
                <h4 className="font-medium text-gray-900">Update Demo Data</h4>
                <p className="text-sm text-gray-600">
                  Run the export script to update local backup: <code className="text-xs bg-gray-200 px-1 rounded">npm run export-demo</code>
                </p>
              </div>
              <button
                disabled
                className="flex items-center space-x-2 rounded-lg bg-gray-400 px-4 py-2 text-white cursor-not-allowed"
              >
                <Upload className="h-4 w-4" />
                <span>Manual Only</span>
              </button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h3 className="mb-3 flex items-center text-lg font-semibold text-blue-900">
            <AlertCircle className="mr-2 h-5 w-5" />
            Demo Mode Instructions
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Demo mode uses local JSON data stored in <code>/data/demo-backup.json</code></li>
            <li>• Perfect for presentations when internet/database might be unreliable</li>
            <li>• All features work normally but changes are not persisted</li>
            <li>• To update demo data: <code>node scripts/export-demo-data.js</code></li>
            <li>• Demo indicator appears in bottom-right when active</li>
          </ul>
        </div>
      </div>
    </div>
  )
}