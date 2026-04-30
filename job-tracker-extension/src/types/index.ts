export interface DetectedJob {
  company: string
  title: string
  url: string
  platform: string
  applied_at: string
  status?: 'applied' | 'saved'
  bookmarked?: boolean
}

export interface StoredAuth {
  extension_token: string
}

export type MessageType =
  | { type: 'JOB_DETECTED'; payload: DetectedJob }
  | { type: 'PLATFORM_DETECTED'; payload: { platform: string } }
  | { type: 'GET_AUTH' }
  | { type: 'SET_AUTH'; payload: StoredAuth }
  | { type: 'SYNC_JOB'; payload: DetectedJob }
  | { type: 'SYNC_RESULT'; ok: boolean; error?: string }
