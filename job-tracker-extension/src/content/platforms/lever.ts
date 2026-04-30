import { DetectedJob } from '../../types'

export function isLever(): boolean {
  return location.hostname.includes('lever.co')
}

export function scrapeLever(): Partial<DetectedJob> | null {
  // URL: jobs.lever.co/{company}/{job-id}
  const pathParts = location.pathname.split('/').filter(Boolean)
  const company = pathParts[0] ?? 'Unknown'

  const title =
    document.querySelector<HTMLElement>('h2.posting-headline')?.innerText?.trim() ||
    document.querySelector<HTMLElement>('[data-qa="posting-name"]')?.innerText?.trim() ||
    document.querySelector<HTMLElement>('h2')?.innerText?.trim()

  if (!title) return null
  return { company, title, platform: 'lever' }
}

export function detectLeverSubmit(onSubmit: () => void): void {
  const observer = new MutationObserver(() => {
    const el = document.querySelector('h2, .application-confirmation')
    if (el?.textContent?.toLowerCase().includes('thank you for applying')) {
      observer.disconnect()
      onSubmit()
    }
  })
  observer.observe(document.body, { childList: true, subtree: true })
}
