import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery, useMutation } from '@tanstack/react-query'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { NoteEditor } from '@/components/notes/NoteEditor'
import { NoteHeader } from '@/components/notes/NoteHeader'
import { useCallback } from 'react'

export const Route = createFileRoute('/_authenticated/notes/$noteId')({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      convexQuery(api.notes.get, { id: params.noteId as Id<'notes'> }),
    )
  },
  component: NoteEditorPage,
})

function NoteEditorPage() {
  const { noteId } = Route.useParams()
  const { data: note } = useSuspenseQuery(
    convexQuery(api.notes.get, { id: noteId as Id<'notes'> }),
  )

  const updateNote = useMutation({
    mutationFn: useConvexMutation(api.notes.update),
  })

  const handleContentUpdate = useCallback(
    (content: string) => {
      updateNote.mutate({ id: noteId as Id<'notes'>, content })
    },
    [noteId, updateNote],
  )

  return (
    <>
      <NoteHeader note={note} />
      <NoteEditor
        key={noteId}
        content={note.content}
        onUpdate={handleContentUpdate}
      />
    </>
  )
}
