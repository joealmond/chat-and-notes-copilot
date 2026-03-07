import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '@convex/_generated/api'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export const Route = createFileRoute('/p/$slug')({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      convexQuery(api.notes.getPublished, { slug: params.slug }),
    )
  },
  component: PublicNote,
})

function PublicNote() {
  const { slug } = Route.useParams()
  const { data: note } = useSuspenseQuery(
    convexQuery(api.notes.getPublished, { slug }),
  )

  if (!note) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium">Not Found</p>
          <p className="text-sm mt-1">This note doesn't exist or isn't published.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <article className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-semibold text-foreground mb-1">
          {note.title}
        </h1>
        <time className="text-xs text-muted-foreground block mb-8">
          {new Date(note._creationTime).toLocaleDateString()}
        </time>
        <div className="prose-editor">
          <Markdown remarkPlugins={[remarkGfm]}>{note.content}</Markdown>
        </div>
      </article>
    </div>
  )
}
