import { useSuspenseQuery, useMutation } from '@tanstack/react-query'
import { useConvexMutation, convexQuery } from '@convex-dev/react-query'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { useNavigate, useParams } from '@tanstack/react-router'
import { NoteTreeItem } from './NoteTreeItem'
import { Plus } from 'lucide-react'
import { useState } from 'react'

export function NoteTree() {
  const { data: notes } = useSuspenseQuery(convexQuery(api.notes.list, {}))
  const createNote = useMutation({
    mutationFn: useConvexMutation(api.notes.create),
  })
  const navigate = useNavigate()
  const params = useParams({ strict: false }) as { noteId?: string }

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Build tree structure from flat list
  const rootNotes = notes
    .filter((n) => !n.parentId)
    .sort((a, b) => a.order - b.order)

  const childrenOf = (parentId: Id<'notes'>) =>
    notes.filter((n) => n.parentId === parentId).sort((a, b) => a.order - b.order)

  const handleCreate = async (parentId?: Id<'notes'>) => {
    const id = await createNote.mutateAsync({ title: 'Untitled', parentId })
    if (parentId) {
      setExpandedIds((prev) => new Set(prev).add(parentId))
    }
    navigate({ to: '/notes/$noteId', params: { noteId: id } })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Notes
        </span>
        <button
          onClick={() => handleCreate()}
          className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"
          title="New note"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-1">
        {rootNotes.map((note) => (
          <NoteTreeItem
            key={note._id}
            note={note}
            depth={0}
            childrenOf={childrenOf}
            expandedIds={expandedIds}
            toggleExpand={toggleExpand}
            selectedId={params.noteId as Id<'notes'> | undefined}
            onNavigate={(id) =>
              navigate({ to: '/notes/$noteId', params: { noteId: id } })
            }
            onCreate={handleCreate}
          />
        ))}
        {rootNotes.length === 0 && (
          <p className="px-2 py-4 text-xs text-muted-foreground text-center">
            No notes yet
          </p>
        )}
      </div>
    </div>
  )
}
