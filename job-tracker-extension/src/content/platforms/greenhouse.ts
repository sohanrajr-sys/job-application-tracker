import { DetectedJob } from '../../types'

export function isGreenhouse(): boolean {
  return location.hostname.includes('greenhouse.io')
}

export function scrapeGreenhouse(): Partial<DetectedJob> | null {
  const company =
    document.querySelector<HTMLElement>('meta[property="og:site_name"]')?.getAttribute('content') ||
    location.hostname.replace('boards.greenhouse.io', '').replace('.greenhouse.io', '').replace(/^\//, '') ||
    'Unknown'

  const title =
    document.querySelector<HTMLElement>('h1.app-title')?.innerText?.trim() ||
    document.querySelector<HTMLElement>('#header h1')?.innerText?.trim() ||
    document.querySelector<HTMLElement>('h1')?.innerText?.trim()

  if (!title) return null
  return { company, title, platform: 'greenhouse' }
}

export function detectGreenhouseSubmit(onSubmit: () => void): void {
  // Confirmation URL or thank you heading
  if (location.pathname.includes('confirmation') || location.pathname.includes('thank')) {
    onSubmit()
    return
  }

  const observer = new MutationObserver(() => {
    const heading = document.querySelector('h1, h2')
    if (heading?.textContent?.toLowerCase().includes('thank you for applying')) {
      observer.disconnect()
      onSubmit()
    }
  })
  observer.observe(document.body, { childList: true, subtree: true })
}
