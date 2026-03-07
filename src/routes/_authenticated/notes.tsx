import { createFileRoute, Outlet } from '@tanstack/react-router'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '@convex/_generated/api'
import { NoteTree } from '@/components/notes/NoteTree'

export const Route = createFileRoute('/_authenticated/notes')({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(convexQuery(api.notes.list, {}))
  },
  component: NotesLayout,
})

function NotesLayout() {
  return (
    <div className="flex h-full">
      <aside className="w-60 border-r border-border bg-surface overflow-y-auto shrink-0">
        <NoteTree />
      </aside>
      <div className="flex-1 overflow-auto flex flex-col">
        <Outlet />
      </div>
    </div>
  )
}
