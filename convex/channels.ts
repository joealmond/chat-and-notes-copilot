import { v, ConvexError } from 'convex/values'
import { authQuery, authMutation } from './lib/customFunctions'
import { rateLimiter } from './lib/services/rateLimitService'
import type { QueryCtx } from './_generated/server'
import type { Id } from './_generated/dataModel'

// =========================================================================
// Helpers
// =========================================================================

type AuthCtx = QueryCtx & { userId: string }

async function requireMembership(ctx: AuthCtx, channelId: Id<'channels'>) {
  const member = await ctx.db
    .query('channelMembers')
    .withIndex('by_channel_user', (q) =>
      q.eq('channelId', channelId).eq('userId', ctx.userId),
    )
    .first()
  if (!member) throw new ConvexError('Not a member of this channel')
  return member
}

async function requireOwnership(ctx: AuthCtx, channelId: Id<'channels'>) {
  const member = await requireMembership(ctx, channelId)
  if (member.role !== 'owner') throw new ConvexError('Not the channel owner')
  return member
}

// =========================================================================
// Channel Queries
// =========================================================================

/**
 * List all channels the user is a member of.
 */
export const list = authQuery({
  args: {},
  handler: async (ctx) => {
    const memberships = await ctx.db
      .query('channelMembers')
      .withIndex('by_user', (q) => q.eq('userId', ctx.userId))
      .collect()

    const channels = await Promise.all(
      memberships.map(async (m) => {
        const channel = await ctx.db.get(m.channelId)
        return channel ? { ...channel, memberRole: m.role } : null
      }),
    )
    return channels.filter(Boolean)
  },
})

/**
 * Get a single channel (verify membership).
 */
export const get = authQuery({
  args: { id: v.id('channels') },
  handler: async (ctx, args) => {
    await requireMembership(ctx, args.id)
    const channel = await ctx.db.get(args.id)
    if (!channel) throw new ConvexError('Channel not found')

    // Get members
    const members = await ctx.db
      .query('channelMembers')
      .withIndex('by_channel', (q) => q.eq('channelId', args.id))
      .collect()

    return { ...channel, members }
  },
})

// =========================================================================
// Channel Mutations
// =========================================================================

/**
 * Create a new channel. Creator becomes owner.
 */
export const create = authMutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await rateLimiter.limit(ctx, 'createChannel', { key: ctx.userId })

    const channelId = await ctx.db.insert('channels', {
      name: args.name,
      description: args.description,
      createdBy: ctx.userId,
      type: 'channel',
    })

    await ctx.db.insert('channelMembers', {
      channelId,
      userId: ctx.userId,
      role: 'owner',
    })

    return channelId
  },
})

/**
 * Find or create a DM channel between current user and another user.
 */
export const createDM = authMutation({
  args: { otherUserId: v.string() },
  handler: async (ctx, args) => {
    if (args.otherUserId === ctx.userId) {
      throw new ConvexError('Cannot DM yourself')
    }

    // Check if a DM already exists between these two users
    const myMemberships = await ctx.db
      .query('channelMembers')
      .withIndex('by_user', (q) => q.eq('userId', ctx.userId))
      .collect()

    for (const m of myMemberships) {
      const channel = await ctx.db.get(m.channelId)
      if (channel?.type !== 'dm') continue

      const otherMember = await ctx.db
        .query('channelMembers')
        .withIndex('by_channel_user', (q) =>
          q.eq('channelId', m.channelId).eq('userId', args.otherUserId),
        )
        .first()
      if (otherMember) return m.channelId
    }

    // Create new DM channel
    const channelId = await ctx.db.insert('channels', {
      name: 'DM',
      createdBy: ctx.userId,
      type: 'dm',
    })

    await ctx.db.insert('channelMembers', {
      channelId,
      userId: ctx.userId,
      role: 'owner',
    })
    await ctx.db.insert('channelMembers', {
      channelId,
      userId: args.otherUserId,
      role: 'member',
    })

    return channelId
  },
})

/**
 * Add a member to a channel (owner only).
 */
export const addMember = authMutation({
  args: {
    channelId: v.id('channels'),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireOwnership(ctx, args.channelId)

    // Check not already a member
    const existing = await ctx.db
      .query('channelMembers')
      .withIndex('by_channel_user', (q) =>
        q.eq('channelId', args.channelId).eq('userId', args.userId),
      )
      .first()
    if (existing) throw new ConvexError('User is already a member')

    await ctx.db.insert('channelMembers', {
      channelId: args.channelId,
      userId: args.userId,
      role: 'member',
    })
  },
})

/**
 * Remove a member from a channel (owner only).
 */
export const removeMember = authMutation({
  args: {
    channelId: v.id('channels'),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireOwnership(ctx, args.channelId)
    if (args.userId === ctx.userId) {
      throw new ConvexError('Cannot remove yourself. Use leave instead.')
    }

    const member = await ctx.db
      .query('channelMembers')
      .withIndex('by_channel_user', (q) =>
        q.eq('channelId', args.channelId).eq('userId', args.userId),
      )
      .first()
    if (!member) throw new ConvexError('User is not a member')

    await ctx.db.delete(member._id)
  },
})

/**
 * Leave a channel.
 */
export const leave = authMutation({
  args: { channelId: v.id('channels') },
  handler: async (ctx, args) => {
    const member = await requireMembership(ctx, args.channelId)
    await ctx.db.delete(member._id)

    // If no members left, delete the channel
    const remaining = await ctx.db
      .query('channelMembers')
      .withIndex('by_channel', (q) => q.eq('channelId', args.channelId))
      .first()
    if (!remaining) {
      // Delete all messages first
      const msgs = await ctx.db
        .query('chatMessages')
        .withIndex('by_channel', (q) => q.eq('channelId', args.channelId))
        .collect()
      for (const msg of msgs) {
        await ctx.db.delete(msg._id)
      }
      await ctx.db.delete(args.channelId)
    }
  },
})

/**
 * Delete a channel (owner only).
 */
export const remove = authMutation({
  args: { channelId: v.id('channels') },
  handler: async (ctx, args) => {
    await requireOwnership(ctx, args.channelId)

    // Delete all messages
    const msgs = await ctx.db
      .query('chatMessages')
      .withIndex('by_channel', (q) => q.eq('channelId', args.channelId))
      .collect()
    for (const msg of msgs) {
      await ctx.db.delete(msg._id)
    }

    // Delete all members
    const members = await ctx.db
      .query('channelMembers')
      .withIndex('by_channel', (q) => q.eq('channelId', args.channelId))
      .collect()
    for (const m of members) {
      await ctx.db.delete(m._id)
    }

    await ctx.db.delete(args.channelId)
  },
})
