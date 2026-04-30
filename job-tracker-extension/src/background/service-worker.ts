import { StoredAuth, MessageType, DetectedJob } from '../types'

const DEFAULT_API_URL = 'https://job-application-tracker-git-main-sohanrajr-7379s-projects.vercel.app'
const RECENT_KEY = 'recent_jobs'
const MAX_RECENT = 5

chrome.runtime.onMessage.addListener((message: MessageType, _sender, sendResponse) => {
  if (message.type === 'SYNC_JOB') {
    syncJob(message.payload).then((result) => {
      if (result.ok) saveRecent(message.payload)
      sendResponse(result)
    })
    return true // keep channel open for async response
  }
  if (message.type === 'GET_AUTH') {
    chrome.storage.local.get(['extension_token', 'api_base_url'], (result) => {
      sendResponse(result as StoredAuth)
    })
    return true
  }
  if (message.type === 'SET_AUTH') {
    chrome.storage.local.set(message.payload, () => sendResponse({ ok: true }))
    return true
  }
})

async function syncJob(job: DetectedJob): Promise<{ ok: boolean; error?: string }> {
  const auth = await getAuth()
  if (!auth.extension_token) {
    return { ok: false, error: 'No token configured. Open extension popup to set up.' }
  }

  const baseUrl = auth.api_base_url || DEFAULT_API_URL

  try {
    const res = await fetch(`${baseUrl}/api/extension/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.extension_token}`,
      },
      body: JSON.stringify({ ...job, source: 'extension' }),
    })
    const data = await res.json()
    if (!res.ok) return { ok: false, error: data.error ?? 'Server error' }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: 'Network error' }
  }
}

function getAuth(): Promise<StoredAuth> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['extension_token', 'api_base_url'], (r) => {
      resolve({ extension_token: r.extension_token ?? '', api_base_url: r.api_base_url ?? '' })
    })
  })
}

function saveRecent(job: DetectedJob): void {
  chrome.storage.local.get([RECENT_KEY], (r) => {
    const existing: DetectedJob[] = r[RECENT_KEY] ?? []
    const updated = [job, ...existing].slice(0, MAX_RECENT)
    chrome.storage.local.set({ [RECENT_KEY]: updated })
  })
}
