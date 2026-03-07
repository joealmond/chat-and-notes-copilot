import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { MessageList } from '@/components/chat/MessageList'
import { ChatInput } from '@/components/chat/ChatInput'
import { Hash } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/chat/$channelId')({
  loader: async ({ context, params }) => {
    const channelId = params.channelId as Id<'channels'>
    await Promise.all([
      context.queryClient.ensureQueryData(
        convexQuery(api.channels.get, { id: channelId }),
      ),
      context.queryClient.ensureQueryData(
        convexQuery(api.chatMessages.list, { channelId }),
      ),
    ])
  },
  component: ChannelView,
})

function ChannelView() {
  const { channelId } = Route.useParams()
  const id = channelId as Id<'channels'>
  const { data: channel } = useSuspenseQuery(
    convexQuery(api.channels.get, { id }),
  )

  return (
    <div className="flex flex-col h-full">
      <header className="px-4 py-2 border-b border-border flex items-center gap-2">
        <Hash className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">{channel.name}</span>
        {channel.description && (
          <span className="text-xs text-muted-foreground ml-2">
            {channel.description}
          </span>
        )}
      </header>
      <MessageList channelId={id} />
      <ChatInput channelId={id} />
    </div>
  )
}
