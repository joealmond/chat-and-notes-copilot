import { useState, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useConvexMutation } from '@convex-dev/react-query'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { SendHorizontal } from 'lucide-react'

interface ChatInputProps {
  channelId: Id<'channels'>
}

export function ChatInput({ channelId }: ChatInputProps) {
  const [content, setContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const sendMessage = useMutation({
    mutationFn: useConvexMutation(api.chatMessages.send),
  })

  const handleSubmit = async () => {
    const trimmed = content.trim()
    if (!trimmed) return

    setContent('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    await sendMessage.mutateAsync({ channelId, content: trimmed })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleInput = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }

  return (
    <div className="border-t border-border px-4 py-3">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Send a message… (Shift+Enter for new line)"
          rows={1}
          className="flex-1 bg-surface border border-border px-3 py-2 text-sm text-foreground resize-none outline-none focus:border-ring placeholder:text-muted-foreground"
        />
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || sendMessage.isPending}
          className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:pointer-events-none transition-colors"
          title="Send"
        >
          <SendHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
