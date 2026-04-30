import { DetectedJob } from '../../types'

export function isLinkedIn(): boolean {
  return location.hostname.includes('linkedin.com')
}

export function scrapeLinkedIn(): Partial<DetectedJob> | null {
  const company =
    document.querySelector<HTMLElement>('.job-details-jobs-unified-top-card__company-name a')?.innerText?.trim() ||
    document.querySelector<HTMLElement>('[data-tracking-control-name="public_jobs_topcard-org-name"]')?.innerText?.trim()

  const title =
    document.querySelector<HTMLElement>('h1.job-details-jobs-unified-top-card__job-title')?.innerText?.trim() ||
    document.querySelector<HTMLElement>('h1.topcard__title')?.innerText?.trim()

  if (!company || !title) return null
  return { company, title, platform: 'linkedin' }
}

export function detectLinkedInSubmit(onSubmit: () => void): void {
  // Easy Apply confirmation modal
  const observer = new MutationObserver(() => {
    const confirmed = document.querySelector('[data-test-modal] h2, .jobs-easy-apply-content h2')
    if (confirmed?.textContent?.toLowerCase().includes('application submitted')) {
      observer.disconnect()
      onSubmit()
    }
  })
  observer.observe(document.body, { childList: true, subtree: true })
}
