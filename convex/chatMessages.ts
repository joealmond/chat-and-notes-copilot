import { v, ConvexError } from 'convex/values'
import { authQuery, authMutation } from './lib/customFunctions'
import { rateLimiter } from './lib/services/rateLimitService'

// =========================================================================
// Queries
// =========================================================================

/**
 * List messages for a channel (verify membership). Newest first.
 */
export const list = authQuery({
  args: {
    channelId: v.id('channels'),
  },
  handler: async (ctx, args) => {
    // Verify membership
    const member = await ctx.db
      .query('channelMembers')
      .withIndex('by_channel_user', (q) =>
        q.eq('channelId', args.channelId).eq('userId', ctx.userId),
      )
      .first()
    if (!member) throw new ConvexError('Not a member of this channel')

    return await ctx.db
      .query('chatMessages')
      .withIndex('by_channel', (q) => q.eq('channelId', args.channelId))
      .order('desc')
      .take(100)
  },
})

// =========================================================================
// Mutations
// =========================================================================

/**
 * Send a message to a channel.
 */
export const send = authMutation({
  args: {
    channelId: v.id('channels'),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await rateLimiter.limit(ctx, 'sendMessage', { key: ctx.userId })

    // Verify membership
    const member = await ctx.db
      .query('channelMembers')
      .withIndex('by_channel_user', (q) =>
        q.eq('channelId', args.channelId).eq('userId', ctx.userId),
      )
      .first()
    if (!member) throw new ConvexError('Not a member of this channel')

    const content = args.content.trim()
    if (!content) throw new ConvexError('Message cannot be empty')
    if (content.length > 4000) throw new ConvexError('Message too long')

    return await ctx.db.insert('chatMessages', {
      content,
      channelId: args.channelId,
      authorId: ctx.userId,
      authorName: ctx.user.name,
    })
  },
})

/**
 * Delete own message.
 */
export const remove = authMutation({
  args: { id: v.id('chatMessages') },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.id)
    if (!message) throw new ConvexError('Message not found')
    if (message.authorId !== ctx.userId) {
      throw new ConvexError('Can only delete your own messages')
    }
    await ctx.db.delete(args.id)
  },
})
