import { Link, useMatches } from '@tanstack/react-router'
import { useSession, signOut } from '@/lib/auth-client'
import { cn } from '@/lib/cn'
import {
  FileText,
  MessageSquare,
  Globe,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  User,
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { to: '/notes', icon: FileText, label: 'Notes' },
  { to: '/chat', icon: MessageSquare, label: 'Chat' },
  { to: '/publish', icon: Globe, label: 'Publish' },
] as const

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { data: session } = useSession()
  const matches = useMatches()

  const currentPath = matches[matches.length - 1]?.pathname ?? ''

  return (
    <nav
      className={cn(
        'flex flex-col h-full bg-sidebar border-r border-border transition-[width] duration-150',
        collapsed ? 'w-12' : 'w-48',
      )}
    >
      {/* Nav items */}
      <div className="flex-1 flex flex-col gap-0.5 pt-2 px-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = currentPath.startsWith(to)
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-2 px-2 py-1.5 text-sm transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground',
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          )
        })}
      </div>

      {/* Bottom section */}
      <div className="flex flex-col gap-0.5 px-1 pb-2 border-t border-border pt-2">
        {/* User info */}
        {session?.user && (
          <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt=""
                className="w-4 h-4 rounded-full shrink-0"
              />
            ) : (
              <User className="w-4 h-4 shrink-0" />
            )}
            {!collapsed && (
              <span className="truncate text-xs">{session.user.name}</span>
            )}
          </div>
        )}

        {/* Sign out */}
        <button
          onClick={() => signOut()}
          className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors w-full text-left"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors w-full text-left"
        >
          {collapsed ? (
            <PanelLeft className="w-4 h-4 shrink-0" />
          ) : (
            <>
              <PanelLeftClose className="w-4 h-4 shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </nav>
  )
}
