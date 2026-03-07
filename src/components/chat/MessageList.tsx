import { useSuspenseQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { useRef, useEffect } from 'react'
import { MessageItem } from './MessageItem'

interface MessageListProps {
  channelId: Id<'channels'>
}

export function MessageList({ channelId }: MessageListProps) {
  const { data: messages } = useSuspenseQuery(
    convexQuery(api.chatMessages.list, { channelId }),
  )
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  // Messages come desc from DB, reverse for display
  const sorted = [...messages].reverse()

  return (
    <div className="flex-1 overflow-y-auto px-4 py-2">
      {sorted.length === 0 && (
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          No messages yet. Start the conversation!
        </div>
      )}
      {sorted.map((msg) => (
        <MessageItem key={msg._id} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
