import { DetectedJob } from '../../types'

export function isLinkedIn(): boolean {
  return location.hostname.includes('linkedin.com')
}

export function scrapeLinkedIn(): Partial<DetectedJob> | null {
  // Company — try multiple selector patterns (LinkedIn updates frequently)
  const company =
    document.querySelector<HTMLElement>('.job-details-jobs-unified-top-card__company-name a')?.innerText?.trim() ||
    document.querySelector<HTMLElement>('[data-tracking-control-name="public_jobs_topcard-org-name"]')?.innerText?.trim() ||
    document.querySelector<HTMLElement>('.jobs-unified-top-card__company-name a')?.innerText?.trim() ||
    document.querySelector<HTMLElement>('.job-details-jobs-unified-top-card__primary-description-without-tagline a')?.innerText?.trim() ||
    document.querySelector<HTMLElement>('meta[property="og:site_name"]')?.getAttribute('content') ||
    undefined

  const title =
    document.querySelector<HTMLElement>('h1.job-details-jobs-unified-top-card__job-title')?.innerText?.trim() ||
    document.querySelector<HTMLElement>('h1.jobs-unified-top-card__job-title')?.innerText?.trim() ||
    document.querySelector<HTMLElement>('h1.topcard__title')?.innerText?.trim() ||
    document.querySelector<HTMLElement>('h1[class*="job-title"]')?.innerText?.trim() ||
    document.querySelector<HTMLElement>('h1')?.innerText?.trim() ||
    undefined

  if (!company || !title) return null
  return { company, title, platform: 'linkedin' }
}

export function detectLinkedInSubmit(onSubmit: () => void): void {
  const SUBMIT_PHRASES = [
    'application submitted',
    'your application was sent',
    'applied to',
    'you applied',
  ]

  function checkForConfirmation(): boolean {
    // Modal heading
    const headings = document.querySelectorAll<HTMLElement>(
      '.artdeco-modal h2, .artdeco-modal h3, ' +
      '[data-test-modal] h2, [data-test-modal] h3, ' +
      '.jobs-easy-apply-content h2, .jobs-easy-apply-modal__content h2, ' +
      '.ip-fuse-limit-alert h2, ' +
      '[role="dialog"] h2, [role="dialog"] h3'
    )
    for (const el of headings) {
      const text = el.textContent?.toLowerCase() ?? ''
      if (SUBMIT_PHRASES.some(p => text.includes(p))) return true
    }

    // Post-apply banner / toast
    const banners = document.querySelectorAll<HTMLElement>(
      '.artdeco-toast-item, .jobs-apply-button, .post-apply-timeline, ' +
      '[data-test-job-post-apply-actions]'
    )
    for (const el of banners) {
      const text = el.textContent?.toLowerCase() ?? ''
      if (SUBMIT_PHRASES.some(p => text.includes(p))) return true
    }

    return false
  }

  // Check immediately in case already on confirmation
  if (checkForConfirmation()) { onSubmit(); return }

  const observer = new MutationObserver(() => {
    if (checkForConfirmation()) {
      observer.disconnect()
      onSubmit()
    }
  })
  observer.observe(document.body, { childList: true, subtree: true })
}
