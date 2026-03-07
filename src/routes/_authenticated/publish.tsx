import { createFileRoute, Link } from '@tanstack/react-router'
import { useSuspenseQuery, useMutation } from '@tanstack/react-query'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { api } from '@convex/_generated/api'
import { Globe, ExternalLink, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export const Route = createFileRoute('/_authenticated/publish')({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(
      convexQuery(api.notes.listPublished, {}),
    )
  },
  component: PublishManager,
})

function PublishManager() {
  const { data: publishedNotes } = useSuspenseQuery(
    convexQuery(api.notes.listPublished, {}),
  )

  const unpublish = useMutation({
    mutationFn: useConvexMutation(api.notes.unpublish),
  })

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-2 mb-4">
        <Globe className="w-5 h-5 text-muted-foreground" />
        <h1 className="text-lg font-medium">Published Notes</h1>
      </div>

      {publishedNotes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No published notes yet. Open a note and click the publish icon to make it
          public.
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          {publishedNotes.map((note) => (
            <div
              key={note._id}
              className="flex items-center gap-3 px-3 py-2 border border-border hover:bg-surface-hover transition-colors"
            >
              <div className="flex-1 min-w-0">
                <Link
                  to="/notes/$noteId"
                  params={{ noteId: note._id }}
                  className="text-sm font-medium text-foreground hover:underline truncate block"
                >
                  {note.title || 'Untitled'}
                </Link>
                {note.slug && (
                  <span className="text-xs text-muted-foreground">
                    /p/{note.slug}
                  </span>
                )}
              </div>
              <a
                href={`/p/${note.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                title="Open public page"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => unpublish.mutate({ id: note._id })}
                title="Unpublish"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
