import { DetectedJob } from '../../types'

export function isWorkday(): boolean {
  return location.hostname.includes('myworkdayjobs.com') || location.hostname.includes('workday.com')
}

export function scrapeWorkday(): Partial<DetectedJob> | null {
  const company =
    document.querySelector<HTMLElement>('[data-automation-id="siteTitle"]')?.innerText?.trim() ||
    document.querySelector<HTMLElement>('meta[property="og:title"]')?.getAttribute('content') ||
    'Unknown'

  const title =
    document.querySelector<HTMLElement>('[data-automation-id="jobPostingHeader"]')?.innerText?.trim() ||
    document.querySelector<HTMLElement>('h2.gwt-Label')?.innerText?.trim()

  if (!title) return null
  return { company, title, platform: 'workday' }
}

export function detectWorkdaySubmit(onSubmit: () => void): void {
  const observer = new MutationObserver(() => {
    const thankYou = document.querySelector('[data-automation-id="thankYouPage"]')
    const heading = document.querySelector('h1, h2')
    if (thankYou || heading?.textContent?.toLowerCase().includes('thank you for applying')) {
      observer.disconnect()
      onSubmit()
    }
  })
  observer.observe(document.body, { childList: true, subtree: true })
}
