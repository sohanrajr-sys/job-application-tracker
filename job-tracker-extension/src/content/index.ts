import { DetectedJob, MessageType } from '../types'
import { isLinkedIn, scrapeLinkedIn, detectLinkedInSubmit } from './platforms/linkedin'
import { isGreenhouse, scrapeGreenhouse, detectGreenhouseSubmit } from './platforms/greenhouse'
import { isLever, scrapeLever, detectLeverSubmit } from './platforms/lever'
import { isWorkday, scrapeWorkday, detectWorkdaySubmit } from './platforms/workday'

function getPlatformHandlers(): {
  is: () => boolean
  scrape: () => Partial<DetectedJob> | null
  detect: (cb: () => void) => void
} | null {
  if (isLinkedIn()) return { is: isLinkedIn, scrape: scrapeLinkedIn, detect: detectLinkedInSubmit }
  if (isGreenhouse()) return { is: isGreenhouse, scrape: scrapeGreenhouse, detect: detectGreenhouseSubmit }
  if (isLever()) return { is: isLever, scrape: scrapeLever, detect: detectLeverSubmit }
  if (isWorkday()) return { is: isWorkday, scrape: scrapeWorkday, detect: detectWorkdaySubmit }
  return null
}

function init() {
  const platform = getPlatformHandlers()
  if (!platform) return

  platform.detect(() => {
    const scraped = platform.scrape()
    if (!scraped?.company || !scraped?.title) return

    const job: DetectedJob = {
      company: scraped.company,
      title: scraped.title,
      url: location.href,
      platform: scraped.platform ?? 'unknown',
      applied_at: new Date().toISOString(),
    }

    const msg: MessageType = { type: 'SYNC_JOB', payload: job }
    chrome.runtime.sendMessage(msg, (response: { ok: boolean; error?: string }) => {
      if (chrome.runtime.lastError) return
      if (response?.ok) {
        showToast(`✓ Saved to Job Tracker — ${job.company}`)
      } else if (response?.error) {
        showToast(`⚠ Job Tracker: ${response.error}`, true)
      }
    })
  })
}

function showToast(text: string, isError = false) {
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
