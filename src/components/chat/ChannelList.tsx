import { useSuspenseQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '@convex/_generated/api'
import { useNavigate, useParams } from '@tanstack/react-router'
import { cn } from '@/lib/cn'
import { Hash, MessageSquare, Plus } from 'lucide-react'
import { useState } from 'react'
import { CreateChannelDialog } from './CreateChannelDialog'

export function ChannelList() {
  const { data: channels } = useSuspenseQuery(convexQuery(api.channels.list, {}))
  const navigate = useNavigate()
  const params = useParams({ strict: false }) as { channelId?: string }
  const [showCreate, setShowCreate] = useState(false)

  const channelItems = (channels ?? []).filter((c): c is NonNullable<typeof c> => c !== null)
  const groupChannels = channelItems.filter((c) => c.type === 'channel')
  const dmChannels = channelItems.filter((c) => c.type === 'dm')

  return (
    <div className="flex flex-col h-full">
      {/* Channels section */}
      <div className="flex items-center justify-between p-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Channels
        </span>
        <button
          onClick={() => setShowCreate(true)}
          className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"
          title="New channel"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-1">
        {groupChannels.map((channel) => (
          <button
            key={channel._id}
            onClick={() =>
              navigate({
                to: '/chat/$channelId',
                params: { channelId: channel._id },
              })
            }
            className={cn(
              'flex items-center gap-2 w-full px-2 py-1.5 text-sm transition-colors text-left',
              params.channelId === channel._id
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground',
            )}
          >
            <Hash className="w-3.5 h-3.5 shrink-0 opacity-60" />
            <span className="truncate">{channel.name}</span>
          </button>
        ))}

        {/* DMs section */}
        {dmChannels.length > 0 && (
          <>
            <div className="px-2 pt-4 pb-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Direct Messages
            </div>
            {dmChannels.map((channel) => (
              <button
                key={channel._id}
                onClick={() =>
                  navigate({
                    to: '/chat/$channelId',
                    params: { channelId: channel._id },
                  })
                }
                className={cn(
                  'flex items-center gap-2 w-full px-2 py-1.5 text-sm transition-colors text-left',
                  params.channelId === channel._id
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground',
                )}
              >
                <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-60" />
                <span className="truncate">{channel.name}</span>
              </button>
            ))}
          </>
        )}

        {groupChannels.length === 0 && dmChannels.length === 0 && (
          <p className="px-2 py-4 text-xs text-muted-foreground text-center">
            No channels yet
          </p>
        )}
      </div>

      <CreateChannelDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  )
}
