import { v, ConvexError } from 'convex/values'
import { authQuery, authMutation, publicQuery } from './lib/customFunctions'
import { rateLimiter } from './lib/services/rateLimitService'

/**
 * List all notes for the authenticated user.
 */
export const list = authQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('notes')
      .withIndex('by_user', (q) => q.eq('userId', ctx.userId))
      .collect()
  },
})

/**
 * Get a single note by ID (verify ownership).
 */
export const get = authQuery({
  args: { id: v.id('notes') },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.id)
    if (!note || note.userId !== ctx.userId) {
      throw new ConvexError('Note not found')
    }
    return note
  },
})

/**
 * Create a new note.
 */
export const create = authMutation({
  args: {
    title: v.string(),
    parentId: v.optional(v.id('notes')),
  },
  handler: async (ctx, args) => {
    await rateLimiter.limit(ctx, 'createNote', { key: ctx.userId })

    // Verify parent ownership if provided
    if (args.parentId) {
      const parent = await ctx.db.get(args.parentId)
      if (!parent || parent.userId !== ctx.userId) {
        throw new ConvexError('Parent note not found')
      }
    }

    // Determine order: append after last sibling
    const siblings = await ctx.db
      .query('notes')
      .withIndex('by_parent', (q) =>
        q.eq('userId', ctx.userId).eq('parentId', args.parentId),
      )
      .collect()
    const order = siblings.length > 0
      ? Math.max(...siblings.map((s) => s.order)) + 1
      : 0

    return await ctx.db.insert('notes', {
      title: args.title,
      content: '',
      parentId: args.parentId,
      userId: ctx.userId,
      order,
    })
  },
})

/**
 * Update note title and/or content (called frequently via debounced auto-save).
 */
export const update = authMutation({
  args: {
    id: v.id('notes'),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await rateLimiter.limit(ctx, 'updateNote', { key: ctx.userId })

    const note = await ctx.db.get(args.id)
    if (!note || note.userId !== ctx.userId) {
      throw new ConvexError('Note not found')
    }

    const updates: Record<string, string> = {}
    if (args.title !== undefined) updates.title = args.title
    if (args.content !== undefined) updates.content = args.content

    await ctx.db.patch(args.id, updates)
  },
})

/**
 * Move/reorder a note (change parent or order).
 */
export const updateOrder = authMutation({
  args: {
    id: v.id('notes'),
    parentId: v.optional(v.id('notes')),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.id)
    if (!note || note.userId !== ctx.userId) {
      throw new ConvexError('Note not found')
    }

    if (args.parentId) {
      const parent = await ctx.db.get(args.parentId)
      if (!parent || parent.userId !== ctx.userId) {
        throw new ConvexError('Parent note not found')
      }
    }

    await ctx.db.patch(args.id, {
      parentId: args.parentId,
      order: args.order,
    })
  },
})

/**
 * Delete a note and cascade to all children.
 */
export const remove = authMutation({
  args: { id: v.id('notes') },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.id)
    if (!note || note.userId !== ctx.userId) {
      throw new ConvexError('Note not found')
    }

    // Recursively collect all descendant IDs
    const toDelete = [args.id]
    let i = 0
    while (i < toDelete.length) {
      const children = await ctx.db
        .query('notes')
        .withIndex('by_parent', (q) =>
          q.eq('userId', ctx.userId).eq('parentId', toDelete[i]),
        )
        .collect()
      for (const child of children) {
        toDelete.push(child._id)
      }
      i++
    }

    for (const id of toDelete) {
      await ctx.db.delete(id)
    }
  },
})

// =========================================================================
// Publishing
// =========================================================================

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

/**
 * Publish a note with a custom slug.
 */
export const publish = authMutation({
  args: {
    id: v.id('notes'),
    slug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.id)
    if (!note || note.userId !== ctx.userId) {
      throw new ConvexError('Note not found')
    }

    const slug = args.slug
      ? slugify(args.slug)
      : slugify(note.title) || `note-${Date.now()}`

    if (!slug) {
      throw new ConvexError('Invalid slug')
    }

    // Check uniqueness
    const existing = await ctx.db
      .query('notes')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .first()
    if (existing && existing._id !== args.id) {
      throw new ConvexError('Slug already in use')
    }

    await ctx.db.patch(args.id, { isPublished: true, slug })
  },
})

/**
 * Unpublish a note.
 */
export const unpublish = authMutation({
  args: { id: v.id('notes') },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.id)
    if (!note || note.userId !== ctx.userId) {
      throw new ConvexError('Note not found')
    }
    await ctx.db.patch(args.id, { isPublished: false })
  },
})

/**
 * Get a published note by slug (public, no auth required).
 */
export const getPublished = publicQuery({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const note = await ctx.db
      .query('notes')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .first()

    if (!note || !note.isPublished) return null

    return {
      _id: note._id,
      title: note.title,
      content: note.content,
      slug: note.slug,
      _creationTime: note._creationTime,
    }
  },
})

/**
 * List published notes for the current user (for the publish manager).
 */
export const listPublished = authQuery({
  args: {},
  handler: async (ctx) => {
    const notes = await ctx.db
      .query('notes')
      .withIndex('by_user', (q) => q.eq('userId', ctx.userId))
      .collect()
    return notes.filter((n) => n.isPublished)
  },
})
