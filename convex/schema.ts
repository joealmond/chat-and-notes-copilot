import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  // Legacy demo tables — kept for backward compatibility
  messages: defineTable({
    content: v.string(),
    authorId: v.optional(v.string()),
    authorName: v.optional(v.string()),
    createdAt: v.optional(v.number()),
  }),

  files: defineTable({
    storageId: v.id('_storage'),
    name: v.string(),
    type: v.string(),
    size: v.number(),
    uploadedBy: v.optional(v.string()),
    createdAt: v.optional(v.number()),
  }).index('by_uploader', ['uploadedBy']),

  // =========================================================================
  // Notes
  // =========================================================================
  notes: defineTable({
    title: v.string(),
    content: v.string(),
    parentId: v.optional(v.id('notes')),
    userId: v.string(),
    isPublished: v.optional(v.boolean()),
    slug: v.optional(v.string()),
    order: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_parent', ['userId', 'parentId'])
    .index('by_slug', ['slug'])
    .index('by_published', ['isPublished']),

  // =========================================================================
  // Chat — Channels & DMs
  // =========================================================================
  channels: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    createdBy: v.string(),
    type: v.union(v.literal('channel'), v.literal('dm')),
  }).index('by_type', ['type']),

  channelMembers: defineTable({
    channelId: v.id('channels'),
    userId: v.string(),
    role: v.union(v.literal('owner'), v.literal('member')),
  })
    .index('by_channel', ['channelId'])
    .index('by_user', ['userId'])
    .index('by_channel_user', ['channelId', 'userId']),

  chatMessages: defineTable({
    content: v.string(),
    channelId: v.id('channels'),
    authorId: v.string(),
    authorName: v.string(),
  }).index('by_channel', ['channelId']),
})
