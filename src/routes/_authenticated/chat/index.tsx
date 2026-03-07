import { createFileRoute } from '@tanstack/react-router'
import { MessageSquare } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/chat/')({
  component: ChatIndex,
})

function ChatIndex() {
  return (
    <div className="flex items-center justify-center h-full text-muted-foreground">
      <div className="text-center">
        <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-40" />
        <p className="text-sm">Select or create a channel</p>
      </div>
    </div>
  )
}
