import { useState, useRef, useEffect, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface ContextMenuProps {
  children: ReactNode
  items: ContextMenuItem[]
}

interface ContextMenuItem {
  label: string
  onClick: () => void
  destructive?: boolean
  disabled?: boolean
}

export function ContextMenu({ children, items }: ContextMenuProps) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = () => setOpen(false)
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('click', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('click', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setPos({ x: e.clientX, y: e.clientY })
    setOpen(true)
  }

  return (
    <>
      <div onContextMenu={handleContextMenu}>{children}</div>
      {open && (
        <div
          ref={menuRef}
          className="fixed z-50 min-w-[160px] bg-popover border border-border py-1"
          style={{ left: pos.x, top: pos.y }}
        >
          {items.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                item.onClick()
                setOpen(false)
              }}
              disabled={item.disabled}
              className={cn(
                'block w-full text-left px-3 py-1.5 text-sm transition-colors',
                'disabled:opacity-50 disabled:pointer-events-none',
                item.destructive
                  ? 'text-destructive hover:bg-destructive/10'
                  : 'text-popover-foreground hover:bg-surface-hover',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </>
  )
}
