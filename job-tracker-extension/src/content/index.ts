import { DetectedJob, MessageType } from '../types'
import { isLinkedIn, scrapeLinkedIn, detectLinkedInSubmit } from './platforms/linkedin'
import { isGreenhouse, scrapeGreenhouse, detectGreenhouseSubmit } from './platforms/greenhouse'
import { isLever, scrapeLever, detectLeverSubmit } from './platforms/lever'
import { isWorkday, scrapeWorkday, detectWorkdaySubmit } from './platforms/workday'

function getPlatformHandlers(): {
  platform: string
  scrape: () => Partial<DetectedJob> | null
  detect: (cb: () => void) => void
} | null {
  if (isLinkedIn()) return { platform: 'linkedin', scrape: scrapeLinkedIn, detect: detectLinkedInSubmit }
  if (isGreenhouse()) return { platform: 'greenhouse', scrape: scrapeGreenhouse, detect: detectGreenhouseSubmit }
  if (isLever()) return { platform: 'lever', scrape: scrapeLever, detect: detectLeverSubmit }
  if (isWorkday()) return { platform: 'workday', scrape: scrapeWorkday, detect: detectWorkdaySubmit }
  return null
}

function init() {
  const handler = getPlatformHandlers()
  if (!handler) return

  // Tell service worker to show green badge on this tab
  const detectMsg: MessageType = { type: 'PLATFORM_DETECTED', payload: { platform: handler.platform } }
  chrome.runtime.sendMessage(detectMsg)

  // Show subtle in-page indicator
  showPageBanner(handler.platform)

  handler.detect(() => {
    const scraped = handler.scrape()
    if (!scraped?.company || !scraped?.title) return

    const job: DetectedJob = {
      company: scraped.company,
      title: scraped.title,
      url: location.href,
      platform: scraped.platform ?? handler.platform,
      applied_at: new Date().toISOString(),
    }

    const msg: MessageType = { type: 'SYNC_JOB', payload: job }
    chrome.runtime.sendMessage(msg, (response: { ok: boolean; error?: string }) => {
      if (chrome.runtime.lastError) return
      if (response?.ok) {
        showPageToast(`✓ Saved — ${job.company}`)
      } else if (response?.error) {
        showPageToast(`⚠ Job Tracker: ${response.error}`, true)
      }
    })
  })
}

function showPageBanner(platform: string) {
  const el = document.createElement('div')
  el.textContent = `🎯 Job Tracker active on ${platform}`
  Object.assign(el.style, {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: '2147483647',
    background: '#1e293b',
    color: '#94a3b8',
    padding: '8px 14px',
    borderRadius: '8px',
    fontSize: '12px',
    fontFamily: 'system-ui, sans-serif',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    opacity: '1',
    transition: 'opacity 0.4s',
    pointerEvents: 'none',
  })
  document.body.appendChild(el)
  // Fade out after 4s
  setTimeout(() => { el.style.opacity = '0' }, 4000)
  setTimeout(() => el.remove(), 4400)
}

function showPageToast(text: string, isError = false) {
  const el = document.createElement('div')
  el.textContent = text
  Object.assign(el.style, {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: '2147483647',
    background: isError ? '#ef4444' : '#22c55e',
    color: '#fff',
    padding: '10px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'system-ui, sans-serif',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    transition: 'opacity 0.3s',
    opacity: '1',
  })
  document.body.appendChild(el)
  setTimeout(() => {
    el.style.opacity = '0'
    setTimeout(() => el.remove(), 300)
  }, 4000)
}

init()
