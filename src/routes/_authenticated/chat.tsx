import { createFileRoute, Outlet } from '@tanstack/react-router'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '@convex/_generated/api'
import { ChannelList } from '@/components/chat/ChannelList'

export const Route = createFileRoute('/_authenticated/chat')({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(convexQuery(api.channels.list, {}))
  },
  component: ChatLayout,
})

function ChatLayout() {
  return (
    <div className="flex h-full">
      <aside className="w-60 border-r border-border bg-surface overflow-y-auto shrink-0">
        <ChannelList />
      </aside>
      <div className="flex-1 overflow-hidden flex flex-col">
        <Outlet />
      </div>
    </div>
  )
}
