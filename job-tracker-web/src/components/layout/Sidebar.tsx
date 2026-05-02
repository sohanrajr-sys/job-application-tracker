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
    <aside className="w-64 min-h-screen bg-white border-r flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-gray-900">Job Tracker</h1>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              pathname === href || pathname.startsWith(href + '/')
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
        {isAdmin && (
          <div className="pt-2">
            <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin</p>
            {[
              { href: '/admin', label: 'Overview', icon: Shield, exact: true },
              { href: '/admin/users', label: 'Users', icon: Users, exact: false },
              { href: '/admin/activity', label: 'Activity Log', icon: Activity, exact: false },
            ].map(({ href, label, icon: Icon, exact }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  (exact ? pathname === href : pathname.startsWith(href))
                    ? 'bg-purple-50 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>
        )}
      </nav>
      <div className="p-4 border-t space-y-1">
        <Link
          href="/setup"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full',
            pathname === '/setup'
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          )}
        >
          <PuzzleIcon className="w-4 h-4" />
          Get Extension
        </Link>
        <Button variant="ghost" className="w-full justify-start gap-3 text-gray-600" onClick={handleLogout}>
          <LogOut className="w-4 h-4" />
          Sign out
        </Button>
      </div>
    </aside>
  )
}
