import { useState, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useConvexMutation } from '@convex-dev/react-query'
import { api } from '@convex/_generated/api'
import type { Doc } from '@convex/_generated/dataModel'
import { Globe, GlobeLock } from 'lucide-react'

interface NoteHeaderProps {
  note: Doc<'notes'>
}

export function NoteHeader({ note }: NoteHeaderProps) {
  const [title, setTitle] = useState(note.title)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updateNote = useMutation({
    mutationFn: useConvexMutation(api.notes.update),
  })
  const publishNote = useMutation({
    mutationFn: useConvexMutation(api.notes.publish),
  })
  const unpublishNote = useMutation({
    mutationFn: useConvexMutation(api.notes.unpublish),
  })

  // Sync title from props when note changes
  useEffect(() => {
    setTitle(note.title)
  }, [note._id, note.title])

  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      updateNote.mutate({ id: note._id, title: value })
    }, 500)
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const togglePublish = () => {
    if (note.isPublished) {
      unpublishNote.mutate({ id: note._id })
    } else {
      publishNote.mutate({ id: note._id })
    }
  }

  return (
    <header className="flex items-center gap-2 px-12 py-3 border-b border-border">
      <input
        value={title}
        onChange={(e) => handleTitleChange(e.target.value)}
        className="flex-1 bg-transparent text-lg font-medium text-foreground outline-none placeholder:text-muted-foreground"
        placeholder="Untitled"
      />
      <button
        onClick={togglePublish}
        className={
          note.isPublished
            ? 'p-1 text-green-500 hover:text-green-400 transition-colors'
            : 'p-1 text-muted-foreground hover:text-foreground transition-colors'
        }
        title={note.isPublished ? `Published at /p/${note.slug}` : 'Publish note'}
      >
        {note.isPublished ? (
          <Globe className="w-4 h-4" />
        ) : (
          <GlobeLock className="w-4 h-4" />
        )}
      </button>
    </header>
  )
}
