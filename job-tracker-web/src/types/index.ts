export type ApplicationStatus = 'applied' | 'screening' | 'interview' | 'offer' | 'rejected' | 'withdrawn' | 'saved'

export type ApplicationSource = 'extension' | 'manual'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: 'user' | 'admin'
  extension_token: string
  created_at: string
  updated_at: string
}

export interface Application {
  id: string
  user_id: string
  company: string
  title: string
  url: string | null
  platform: string
  status: ApplicationStatus
  applied_at: string
  bookmarked: boolean
  notes: string | null
  salary_min: number | null
  salary_max: number | null
  location: string | null
  remote: boolean | null
  source: ApplicationSource
  created_at: string
  updated_at: string
}

export interface Reminder {
  id: string
  user_id: string
  application_id: string | null
  title: string
  message: string | null
  remind_at: string
  sent: boolean
  sent_at: string | null
  email_to: string
  created_at: string
  application?: Application
}

export interface ApplicationEvent {
  id: string
  application_id: string
  user_id: string
  event_type: 'created' | 'status_changed' | 'bookmarked' | 'note_added'
  old_value: string | null
  new_value: string | null
  created_at: string
}

export interface ExtensionSyncPayload {
  company: string
  title: string
  url: string
  platform: string
  applied_at: string
  source: 'extension'
  status?: string
  bookmarked?: boolean
}
