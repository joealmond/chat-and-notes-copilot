import type { Doc, Id } from '@convex/_generated/dataModel'
import { cn } from '@/lib/cn'
import { ChevronRight, FileText, Plus, Trash2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { useConvexMutation } from '@convex-dev/react-query'
import { api } from '@convex/_generated/api'
import { useState } from 'react'

interface NoteTreeItemProps {
  note: Doc<'notes'>
  depth: number
  childrenOf: (parentId: Id<'notes'>) => Doc<'notes'>[]
  expandedIds: Set<string>
  toggleExpand: (id: string) => void
  selectedId?: Id<'notes'>
  onNavigate: (id: Id<'notes'>) => void
  onCreate: (parentId?: Id<'notes'>) => void
}

export function NoteTreeItem({
  note,
  depth,
  childrenOf,
  expandedIds,
  toggleExpand,
  selectedId,
  onNavigate,
  onCreate,
}: NoteTreeItemProps) {
  const children = childrenOf(note._id)
  const hasChildren = children.length > 0
  const isExpanded = expandedIds.has(note._id)
  const isSelected = selectedId === note._id
  const [showActions, setShowActions] = useState(false)

  const removeNote = useMutation({
    mutationFn: useConvexMutation(api.notes.remove),
  })

  return (
    <>
      <div
        className={cn(
          'group flex items-center gap-0.5 py-0.5 pr-1 text-sm cursor-pointer transition-colors',
          isSelected
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground',
        )}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
        onClick={() => onNavigate(note._id)}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Expand/collapse chevron */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            toggleExpand(note._id)
          }}
          className="p-0.5 shrink-0"
        >
          <ChevronRight
            className={cn(
              'w-3 h-3 transition-transform',
              hasChildren ? 'opacity-100' : 'opacity-0',
              isExpanded && 'rotate-90',
            )}
          />
        </button>

        <FileText className="w-3.5 h-3.5 shrink-0 opacity-60" />
        <span className="truncate flex-1 ml-1">{note.title || 'Untitled'}</span>

        {/* Hover actions */}
        {showActions && (
          <span className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCreate(note._id)
              }}
              className="p-0.5 hover:text-foreground"
              title="Add sub-note"
            >
              <Plus className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                removeNote.mutate({ id: note._id })
              }}
              className="p-0.5 hover:text-destructive"
              title="Delete note"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </span>
        )}
      </div>

      {/* Render children if expanded */}
      {isExpanded &&
        children.map((child) => (
          <NoteTreeItem
            key={child._id}
            note={child}
            depth={depth + 1}
            childrenOf={childrenOf}
            expandedIds={expandedIds}
            toggleExpand={toggleExpand}
            selectedId={selectedId}
            onNavigate={onNavigate}
            onCreate={onCreate}
          />
        ))}
    </>
  )
}
