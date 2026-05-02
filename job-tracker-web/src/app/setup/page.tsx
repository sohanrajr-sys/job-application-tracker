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
    const handler = () => setDetected(true)
    window.addEventListener('job-tracker-installed', handler)
    const timer = setTimeout(() => {
      window.removeEventListener('job-tracker-installed', handler)
    }, 3000)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('job-tracker-installed', handler)
    }
  }, [])

  async function finishOnboarding(setter: (v: boolean) => void) {
    setter(true)
    const supabase = createClient()
    const { error } = await supabase.rpc('complete_onboarding')
    if (error) {
      await supabase.from('profiles').update({ onboarding_done: true })
        .eq('id', (await supabase.auth.getUser()).data.user?.id ?? '')
    }
    router.refresh()
    router.push('/dashboard')
  }

  const completeOnboarding = () => finishOnboarding(setCompleting)
  const skipOnboarding = () => finishOnboarding(setSkipping)

  return (
    <div className="min-h-screen bg-[#18181b] flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-xl space-y-6">

        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-700 text-white text-2xl mb-2">
            📋
          </div>
          <h1 className="text-2xl font-bold text-zinc-50">Set up your extension</h1>
          <p className="text-zinc-400">
            The Chrome extension auto-tracks job applications as you browse. Set it up once — it runs silently in the background.
          </p>
        </div>

        {detected && (
          <div className="flex items-center gap-3 p-4 bg-emerald-950/50 border border-emerald-800 rounded-xl text-emerald-300">
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">Extension detected!</p>
              <p className="text-xs text-emerald-400">Your extension is installed and active.</p>
            </div>
          </div>
        )}

        <div className="bg-[#27272a] border border-[#3f3f46] rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-zinc-50">Job Tracker Extension</p>
              <p className="text-sm text-zinc-500">Chrome · Developer Mode install</p>
            </div>
            <a
              href="/extension.zip"
              download="job-tracker-extension.zip"
              className="inline-flex items-center gap-2 px-4 py-2 bg-violet-700 text-white text-sm font-medium rounded-lg hover:bg-violet-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download .zip
            </a>
          </div>
        </div>

        <div className="bg-[#27272a] border border-[#3f3f46] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#3f3f46]">
            <h2 className="font-semibold text-zinc-100">Installation steps</h2>
          </div>
          <div className="divide-y divide-[#3f3f46]">
            {STEPS.map((step, i) => (
              <div key={i} className="flex gap-4 px-6 py-4">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-violet-900/50 text-violet-400 text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </div>
                <div className="space-y-1 min-w-0">
                  <p className="font-medium text-sm text-zinc-100">{step.title}</p>
                  <p className="text-sm text-zinc-400">{step.description}</p>
                  {step.code && (
                    <code className="text-xs bg-[#18181b] text-violet-300 px-2 py-0.5 rounded font-mono">
                      {step.code}
                    </code>
                  )}
                  {step.action === 'token' && (
                    <a
                      href="/dashboard"
                      className="inline-flex items-center gap-1 text-xs text-violet-400 hover:underline"
                    >
                      Get your token from the dashboard <ArrowRight className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={completeOnboarding}
            disabled={completing || skipping}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-violet-700 text-white font-semibold rounded-xl hover:bg-violet-600 transition-colors disabled:opacity-60"
          >
            {completing
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting…</>
              : <><CheckCircle className="w-4 h-4" /> I&apos;ve installed the extension</>
            }
          </button>
          <button
            onClick={skipOnboarding}
            disabled={completing || skipping}
            className="w-full text-sm text-zinc-500 hover:text-zinc-300 transition-colors py-1"
          >
            {skipping ? 'Redirecting…' : 'Skip for now'}
          </button>
        </div>

      </div>
    </div>
  )
}
