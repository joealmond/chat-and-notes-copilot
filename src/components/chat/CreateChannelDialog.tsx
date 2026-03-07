import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useConvexMutation } from '@convex-dev/react-query'
import { api } from '@convex/_generated/api'
import { useNavigate } from '@tanstack/react-router'
import { Dialog, DialogHeader, DialogFooter } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface CreateChannelDialogProps {
  open: boolean
  onClose: () => void
}

export function CreateChannelDialog({ open, onClose }: CreateChannelDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const navigate = useNavigate()

  const createChannel = useMutation({
    mutationFn: useConvexMutation(api.channels.create),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return

    const channelId = await createChannel.mutateAsync({
      name: trimmed,
      description: description.trim() || undefined,
    })
    setName('')
    setDescription('')
    onClose()
    navigate({ to: '/chat/$channelId', params: { channelId } })
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>Create Channel</DialogHeader>
        <div className="flex flex-col gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Channel name"
            autoFocus
          />
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!name.trim() || createChannel.isPending}>
            Create
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
