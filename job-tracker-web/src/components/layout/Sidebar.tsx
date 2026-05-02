'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Briefcase,
  Bookmark,
  Bell,
  LogOut,
  Shield,
  Users,
  Activity,
  PuzzleIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/applications', label: 'Applications', icon: Briefcase },
  { href: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
  { href: '/reminders', label: 'Reminders', icon: Bell },
]

interface SidebarProps {
  isAdmin?: boolean
}

export function Sidebar({ isAdmin }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Signed out')
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="hidden md:flex w-64 min-h-screen bg-[#18181b] border-r border-[#3f3f46] flex-col">
      <div className="p-6 border-b border-[#3f3f46]">
        <h1 className="text-xl font-bold text-zinc-50">Job Tracker</h1>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150',
              pathname === href || pathname.startsWith(href + '/')
                ? 'bg-violet-900/40 text-violet-400 border-r-2 border-violet-500'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
        {isAdmin && (
          <div className="pt-4">
            <p className="px-3 py-1 text-xs font-semibold text-zinc-600 uppercase tracking-wider">Admin</p>
            {[
              { href: '/admin', label: 'Overview', icon: Shield, exact: true },
              { href: '/admin/users', label: 'Users', icon: Users, exact: false },
              { href: '/admin/activity', label: 'Activity Log', icon: Activity, exact: false },
            ].map(({ href, label, icon: Icon, exact }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150',
                  (exact ? pathname === href : pathname.startsWith(href))
                    ? 'bg-violet-900/40 text-violet-400 border-r-2 border-violet-500'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>
        )}
      </nav>
      <div className="p-4 border-t border-[#3f3f46] space-y-1">
        <Link
          href="/setup"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 w-full',
            pathname === '/setup'
              ? 'bg-violet-900/40 text-violet-400'
              : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
          )}
        >
          <PuzzleIcon className="w-4 h-4" />
          Get Extension
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-zinc-400 hover:bg-zinc-800 hover:text-red-400"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </Button>
      </div>
    </aside>
  )
}
