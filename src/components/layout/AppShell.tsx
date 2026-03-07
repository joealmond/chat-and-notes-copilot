import { type ReactNode } from 'react'

interface AppShellProps {
  sidebar?: ReactNode
  secondaryPanel?: ReactNode
  children: ReactNode
}

export function AppShell({ sidebar, secondaryPanel, children }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {sidebar}
      {secondaryPanel}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
