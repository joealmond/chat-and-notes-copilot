import type { Doc } from '@convex/_generated/dataModel'
import { useMutation } from '@tanstack/react-query'
import { useConvexMutation } from '@convex-dev/react-query'
import { api } from '@convex/_generated/api'
import { useSession } from '@/lib/auth-client'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'

interface MessageItemProps {
  message: Doc<'chatMessages'>
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function MessageItem({ message }: MessageItemProps) {
  const { data: session } = useSession()
  const isOwn = session?.user?.id === message.authorId
  const [hovering, setHovering] = useState(false)

  const removeMessage = useMutation({
    mutationFn: useConvexMutation(api.chatMessages.remove),
  })

  return (
    <div
      className="group flex items-start gap-2 py-1.5 hover:bg-surface-hover px-2 -mx-2 transition-colors"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Avatar placeholder */}
      <div className="w-6 h-6 bg-surface border border-border flex items-center justify-center text-xs text-muted-foreground shrink-0 mt-0.5">
        {message.authorName?.charAt(0)?.toUpperCase() ?? '?'}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-foreground">
            {message.authorName}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatTime(message._creationTime)}
          </span>
        </div>
        <p className="text-sm text-foreground whitespace-pre-wrap break-words">
          {message.content}
        </p>
      </div>

      {/* Delete button for own messages */}
      {isOwn && hovering && (
        <button
          onClick={() => removeMessage.mutate({ id: message._id })}
          className="p-1 text-muted-foreground hover:text-destructive transition-colors shrink-0"
          title="Delete message"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
