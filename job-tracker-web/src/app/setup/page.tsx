'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, Download, Globe, FolderOpen, Key, ArrowRight, Loader2 } from 'lucide-react'

const STEPS = [
  {
    icon: Download,
    title: 'Download the extension',
    description: 'Download and unzip the extension package to a folder on your computer.',
    action: 'download',
  },
  {
    icon: Globe,
    title: 'Open Chrome extensions',
    description: 'Go to chrome://extensions in your browser.',
    code: 'chrome://extensions',
  },
  {
    icon: Globe,
    title: 'Enable Developer Mode',
    description: 'Toggle "Developer mode" on in the top-right corner of the extensions page.',
  },
  {
    icon: FolderOpen,
    title: 'Load the extension',
    description: 'Click "Load unpacked" and select the dist folder you just extracted.',
  },
  {
    icon: Key,
    title: 'Paste your token',
    description: 'Click the extension icon → paste your token from the dashboard → Save & Connect.',
    action: 'token',
  },
]

export default function SetupPage() {
  const router = useRouter()
  const [detected, setDetected] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [skipping, setSkipping] = useState(false)

  useEffect(() => {
    // Listen for the signal injected by the content script
    const handler = () => setDetected(true)
    window.addEventListener('job-tracker-installed', handler)
    // Give the content script a moment to fire after page load
    const timer = setTimeout(() => {
      window.removeEventListener('job-tracker-installed', handler)
    }, 3000)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('job-tracker-installed', handler)
    }
  }, [])

  async function completeOnboarding() {
    setCompleting(true)
    const supabase = createClient()
    await supabase.rpc('complete_onboarding')
    router.push('/dashboard')
  }

  async function skipOnboarding() {
    setSkipping(true)
    const supabase = createClient()
    await supabase.rpc('complete_onboarding')
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-16 px-4">
      <div className="w-full max-w-xl space-y-8">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white text-2xl mb-2">
            📋
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Set up your extension</h1>
          <p className="text-gray-500">
            The Chrome extension auto-tracks job applications as you browse. Set it up once — it runs silently in the background.
          </p>
        </div>

        {/* Detection banner */}
        {detected && (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">Extension detected!</p>
              <p className="text-xs text-green-600">Your extension is installed and active.</p>
            </div>
          </div>
        )}

        {/* Download card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">Job Tracker Extension</p>
              <p className="text-sm text-gray-500">Chrome · Developer Mode install</p>
            </div>
            <a
              href="/extension.zip"
              download="job-tracker-extension.zip"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download .zip
            </a>
          </div>
        </div>

        {/* Steps */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Installation steps</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {STEPS.map((step, i) => {
              const Icon = step.icon
              return (
                <div key={i} className="flex gap-4 px-6 py-4">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900">{step.title}</p>
                    <p className="text-sm text-gray-500">{step.description}</p>
                    {step.code && (
                      <code className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono">
                        {step.code}
                      </code>
                    )}
                    {step.action === 'token' && (
                      <a
                        href="/dashboard"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                      >
                        Get your token from the dashboard <ArrowRight className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3">
          <button
            onClick={completeOnboarding}
            disabled={completing || skipping}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            {completing
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting…</>
              : <><CheckCircle className="w-4 h-4" /> I&apos;ve installed the extension</>
            }
          </button>
          <button
            onClick={skipOnboarding}
            disabled={completing || skipping}
            className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors py-1"
          >
            {skipping ? 'Redirecting…' : 'Skip for now'}
          </button>
        </div>

      </div>
    </div>
  )
}
