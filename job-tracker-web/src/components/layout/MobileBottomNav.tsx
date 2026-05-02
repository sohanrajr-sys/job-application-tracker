'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Briefcase, Bookmark, Menu, X,
  Bell, PuzzleIcon, LogOut, Shield, Users, Activity,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/applications', label: 'Apps', icon: Briefcase },
  { href: '/bookmarks', label: 'Saved', icon: Bookmark },
]

const MORE_ITEMS = [
  { href: '/reminders', label: 'Reminders', icon: Bell },
  { href: '/setup', label: 'Get Extension', icon: PuzzleIcon },
]

const ADMIN_ITEMS = [
  { href: '/admin', label: 'Overview', icon: Shield, exact: true },
  { href: '/admin/users', label: 'Users', icon: Users, exact: false },
  { href: '/admin/activity', label: 'Activity Log', icon: Activity, exact: false },
]

interface Props {
  isAdmin?: boolean
}

export function MobileBottomNav({ isAdmin }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Signed out')
    setDrawerOpen(false)
    router.push('/login')
    router.refresh()
  }

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')

  return (
    <>
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <div
        className={cn(
          'fixed left-0 right-0 z-50 md:hidden bg-[#18181b] border-t border-[#3f3f46] rounded-t-2xl transition-transform duration-200',
          drawerOpen ? 'bottom-14 translate-y-0' : 'bottom-14 translate-y-full'
        )}
      >
        <div className="p-4 space-y-1">
          <div className="flex justify-center mb-3">
            <div className="w-8 h-1 bg-zinc-600 rounded-full" />
          </div>
          {MORE_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setDrawerOpen(false)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                isActive(href)
                  ? 'bg-violet-900/40 text-violet-400'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
              )}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
          {isAdmin && (
            <>
              <div className="pt-2 pb-1 px-4">
                <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">Admin</p>
              </div>
              {ADMIN_ITEMS.map(({ href, label, icon: Icon, exact }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setDrawerOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                    isActive(href, exact)
                      ? 'bg-violet-900/40 text-violet-400'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </Link>
              ))}
            </>
          )}
          <div className="pt-2 border-t border-[#3f3f46] mt-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-red-400 transition-colors w-full"
            >
              <LogOut className="w-5 h-5" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 h-14 bg-[#18181b] border-t border-[#3f3f46] z-50 md:hidden flex items-stretch">
        {TABS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors',
              isActive(href) ? 'text-violet-400' : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            <Icon className="w-5 h-5" />
            {label}
          </Link>
        ))}
        <button
          className={cn(
            'flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors',
            drawerOpen ? 'text-violet-400' : 'text-zinc-500 hover:text-zinc-300'
          )}
          onClick={() => setDrawerOpen(v => !v)}
        >
          {drawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          More
        </button>
      </div>
    </>
  )
}
