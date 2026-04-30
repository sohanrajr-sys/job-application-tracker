import { StoredAuth, MessageType, DetectedJob } from '../types'

const DEFAULT_URL = 'https://job-application-tracker-git-main-sohanrajr-7379s-projects.vercel.app'
const RECENT_KEY = 'recent_jobs'
const MAX_RECENT = 5

// DOM refs
const statusDot = document.getElementById('status-dot') as HTMLSpanElement
const statusText = document.getElementById('status-text') as HTMLSpanElement
const setupSection = document.getElementById('setup-section') as HTMLDivElement
const setupToggle = document.getElementById('setup-toggle') as HTMLButtonElement
const tokenInput = document.getElementById('token-input') as HTMLInputElement
const urlInput = document.getElementById('url-input') as HTMLInputElement
const saveBtn = document.getElementById('save-btn') as HTMLButtonElement
const clearBtn = document.getElementById('clear-btn') as HTMLButtonElement
const openDashboardBtn = document.getElementById('open-dashboard-btn') as HTMLButtonElement
const recentList = document.getElementById('recent-list') as HTMLUListElement
const toast = document.getElementById('toast') as HTMLDivElement

// Track-this-page DOM refs
const trackToggleBtn = document.getElementById('track-toggle-btn') as HTMLButtonElement
const trackForm = document.getElementById('track-form') as HTMLDivElement
const trackUrl = document.getElementById('track-url') as HTMLDivElement
const trackCompany = document.getElementById('track-company') as HTMLInputElement
const trackTitle = document.getElementById('track-title') as HTMLInputElement
const trackApplyBtn = document.getElementById('track-apply-btn') as HTMLButtonElement
const trackBookmarkBtn = document.getElementById('track-bookmark-btn') as HTMLButtonElement
const trackCancelBtn = document.getElementById('track-cancel-btn') as HTMLButtonElement

let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(msg: string, isError = false) {
  toast.textContent = msg
  toast.className = 'toast show' + (isError ? ' error' : '')
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.className = 'toast' }, 2500)
}

function setStatus(connected: boolean, message?: string) {
  if (connected) {
    statusDot.className = 'dot green'
    statusText.textContent = message ?? 'Connected'
  } else {
    statusDot.className = 'dot red'
    statusText.textContent = message ?? 'Not connected — paste your token below'
  }
}

function collapseSetup() {
  setupSection.classList.add('collapsed')
  setupToggle.textContent = '⚙ Edit token / URL'
}

function expandSetup() {
  setupSection.classList.remove('collapsed')
  setupToggle.textContent = '▲ Close'
}

async function loadAuth(): Promise<StoredAuth> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['extension_token', 'api_base_url'], (r) => {
      resolve({
        extension_token: r.extension_token ?? '',
        api_base_url: r.api_base_url ?? '',
      })
    })
  })
}

async function checkConnection(auth: StoredAuth): Promise<boolean> {
  if (!auth.extension_token) return false
  const base = auth.api_base_url || DEFAULT_URL
  try {
    const res = await fetch(`${base}/api/extension/sync`, { method: 'OPTIONS' })
    return res.ok || res.status === 204 || res.status === 200
  } catch {
    return false
  }
}

async function loadRecent(): Promise<DetectedJob[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get([RECENT_KEY], (r) => {
      resolve(r[RECENT_KEY] ?? [])
    })
  })
}

function renderRecent(jobs: DetectedJob[]) {
  if (!jobs.length) {
    recentList.innerHTML = '<li class="empty">No applications tracked yet</li>'
    return
  }
  recentList.innerHTML = jobs
    .slice(0, MAX_RECENT)
    .map((j) => `
      <li>
        <span class="company">${esc(j.company)}</span>
        <span class="title">${esc(j.title)}</span>
        <span class="meta">${esc(j.platform)} · ${formatDate(j.applied_at)}</span>
      </li>
    `)
    .join('')
}

function esc(s: string): string {
  const d = document.createElement('div')
  d.textContent = s
  return d.innerHTML
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return iso }
}

async function init() {
  const auth = await loadAuth()

  if (auth.extension_token) {
    tokenInput.value = auth.extension_token
    setStatus(false, 'Verifying connection…')
    const ok = await checkConnection(auth)
    if (ok) {
      setStatus(true)
      collapseSetup()
    } else {
      setStatus(false, 'Cannot reach dashboard — check URL')
      expandSetup()
    }
  } else {
    setStatus(false)
    expandSetup()
  }

  if (auth.api_base_url) urlInput.value = auth.api_base_url

  setupToggle.addEventListener('click', () => {
    if (setupSection.classList.contains('collapsed')) expandSetup()
    else collapseSetup()
  })

  openDashboardBtn.addEventListener('click', async () => {
    const a = await loadAuth()
    const base = a.api_base_url || DEFAULT_URL
    chrome.tabs.create({ url: `${base}/dashboard` })
  })

  const recent = await loadRecent()
  renderRecent(recent)

  saveBtn.addEventListener('click', async () => {
    const token = tokenInput.value.trim()
    const apiUrl = urlInput.value.trim().replace(/\/$/, '')

    if (!token) { showToast('Token is required', true); return }

    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRe.test(token)) { showToast('Invalid token format', true); return }

    saveBtn.disabled = true
    saveBtn.textContent = 'Saving…'

    const payload: StoredAuth = { extension_token: token, api_base_url: apiUrl }
    const msg: MessageType = { type: 'SET_AUTH', payload }

    chrome.runtime.sendMessage(msg, async () => {
      const ok = await checkConnection(payload)
      if (ok) {
        setStatus(true)
        showToast('Connected!')
        collapseSetup()
      } else {
        setStatus(false, 'Saved — but cannot reach dashboard')
        showToast('Token saved. Check your dashboard URL.', true)
      }
      saveBtn.disabled = false
      saveBtn.textContent = 'Save & Connect'
    })
  })

  clearBtn.addEventListener('click', () => {
    chrome.storage.local.remove(['extension_token', 'api_base_url'], () => {
      tokenInput.value = ''
      urlInput.value = ''
      setStatus(false)
      expandSetup()
      showToast('Cleared')
    })
  })

  // ── Track this page ─────────────────────────────────────────────
  let currentTab: chrome.tabs.Tab | null = null

  trackToggleBtn.addEventListener('click', async () => {
    if (trackForm.classList.contains('open')) {
      trackForm.classList.remove('open')
      return
    }
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    currentTab = tab ?? null
    trackUrl.textContent = tab?.url || '(no URL)'
    trackTitle.value = guessTitle(tab?.title ?? '')
    trackCompany.value = ''
    trackForm.classList.add('open')
    trackCompany.focus()
  })

  trackCancelBtn.addEventListener('click', () => trackForm.classList.remove('open'))

  async function submitTrack(status: 'applied' | 'saved', bookmarked: boolean) {
    const company = trackCompany.value.trim()
    const title = trackTitle.value.trim()
    if (!company) { showToast('Company name required', true); return }
    if (!title) { showToast('Job title required', true); return }

    // Always read fresh from storage — avoids stale closure bug
    const freshAuth = await loadAuth()
    if (!freshAuth.extension_token) {
      showToast('Paste your token in the setup section first', true)
      expandSetup()
      return
    }

    const job: DetectedJob = {
      company,
      title,
      url: currentTab?.url ?? '',
      platform: guessPlatform(currentTab?.url ?? ''),
      applied_at: new Date().toISOString(),
      status,
      bookmarked,
    }

    trackApplyBtn.disabled = true
    trackBookmarkBtn.disabled = true

    const msg: MessageType = { type: 'SYNC_JOB', payload: job }
    chrome.runtime.sendMessage(msg, (response: { ok: boolean; error?: string }) => {
      trackApplyBtn.disabled = false
      trackBookmarkBtn.disabled = false
      if (chrome.runtime.lastError || !response?.ok) {
        showToast(response?.error ?? 'Failed to save', true)
      } else {
        showToast(bookmarked ? '🔖 Bookmarked!' : '✓ Tracked!')
        trackForm.classList.remove('open')
      }
    })
  }

  trackApplyBtn.addEventListener('click', () => submitTrack('applied', false))
  trackBookmarkBtn.addEventListener('click', () => submitTrack('saved', true))
}

function guessTitle(pageTitle: string): string {
  return pageTitle
    .replace(/\s*[|\-–—]\s*(LinkedIn|Indeed|Glassdoor|Wellfound|Handshake|ZipRecruiter|Monster|Dice|Google Jobs|Greenhouse|Lever|Workday|SmartRecruiters|Ashby|Rippling|Jobvite|Taleo|iCIMS).*$/i, '')
    .trim()
}

function guessPlatform(url: string): string {
  if (!url) return 'manual'
  let h: string
  try { h = new URL(url).hostname } catch { return 'other' }
  if (h.includes('linkedin.com')) return 'linkedin'
  if (h.includes('indeed.com')) return 'indeed'
  if (h.includes('greenhouse.io')) return 'greenhouse'
  if (h.includes('lever.co')) return 'lever'
  if (h.includes('workday.com') || h.includes('myworkdayjobs.com')) return 'workday'
  if (h.includes('smartrecruiters.com')) return 'smartrecruiters'
  if (h.includes('ashbyhq.com')) return 'ashby'
  if (h.includes('wellfound.com') || h.includes('angel.co')) return 'wellfound'
  if (h.includes('handshake.com')) return 'handshake'
  if (h.includes('glassdoor.com')) return 'glassdoor'
  if (h.includes('ziprecruiter.com')) return 'ziprecruiter'
  if (h.includes('dice.com')) return 'dice'
  if (h.includes('icims.com')) return 'icims'
  if (h.includes('rippling.com')) return 'rippling'
  if (h.includes('jobvite.com')) return 'jobvite'
  if (h.includes('taleo.net')) return 'taleo'
  return 'other'
}

chrome.storage.onChanged.addListener((changes) => {
  if (changes[RECENT_KEY]) renderRecent(changes[RECENT_KEY].newValue ?? [])
})

init()
