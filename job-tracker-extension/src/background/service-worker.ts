import { StoredAuth, MessageType, DetectedJob } from '../types'

const API_URL = 'https://job-application-tracker-git-main-sohanrajr-7379s-projects.vercel.app'
const RECENT_KEY = 'recent_jobs'
const MAX_RECENT = 5

chrome.runtime.onMessage.addListener((message: MessageType, sender, sendResponse) => {
  if (message.type === 'SYNC_JOB') {
    syncJob(message.payload).then((result) => {
      if (result.ok) saveRecent(message.payload)
      sendResponse(result)
    })
    return true
  }
  if (message.type === 'PLATFORM_DETECTED') {
    const tabId = sender.tab?.id
    if (tabId) {
      chrome.action.setBadgeText({ text: '●', tabId })
      chrome.action.setBadgeBackgroundColor({ color: '#22c55e', tabId })
    }
    sendResponse({ ok: true })
    return true
  }
  if (message.type === 'GET_AUTH') {
    chrome.storage.local.get(['extension_token'], (result) => {
      sendResponse(result as StoredAuth)
    })
    return true
  }
  if (message.type === 'SET_AUTH') {
    chrome.storage.local.set(message.payload, () => sendResponse({ ok: true }))
    return true
  }
})

// Clear badge when navigating away
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    chrome.action.setBadgeText({ text: '', tabId })
  }
})

async function syncJob(job: DetectedJob): Promise<{ ok: boolean; error?: string }> {
  const auth = await getAuth()
  if (!auth.extension_token) {
    return { ok: false, error: 'No token. Open extension popup to set up.' }
  }

  try {
    const res = await fetch(`${API_URL}/api/extension/sync`, {
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
  } catch {
    return { ok: false, error: 'Network error' }
  }
}

function getAuth(): Promise<StoredAuth> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['extension_token'], (r) => {
      resolve({ extension_token: r.extension_token ?? '' })
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
