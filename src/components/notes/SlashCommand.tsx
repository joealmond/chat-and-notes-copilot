import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { ReactRenderer } from '@tiptap/react'
import { useEffect, useState, forwardRef, useImperativeHandle } from 'react'
import type { Editor, Range } from '@tiptap/core'
import { cn } from '@/lib/cn'

interface SlashMenuItem {
  title: string
  description: string
  command: (editor: Editor, range: Range) => void
}

const SLASH_ITEMS: SlashMenuItem[] = [
  {
    title: 'Heading 1',
    description: 'Large section heading',
    command: (editor, range) =>
      editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run(),
  },
  {
    title: 'Heading 2',
    description: 'Medium section heading',
    command: (editor, range) =>
      editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run(),
  },
  {
    title: 'Heading 3',
    description: 'Small section heading',
    command: (editor, range) =>
      editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run(),
  },
  {
    title: 'Bullet List',
    description: 'Unordered list',
    command: (editor, range) =>
      editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    title: 'Numbered List',
    description: 'Ordered list',
    command: (editor, range) =>
      editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    title: 'Task List',
    description: 'List with checkboxes',
    command: (editor, range) =>
      editor.chain().focus().deleteRange(range).toggleTaskList().run(),
  },
  {
    title: 'Code Block',
    description: 'Syntax-highlighted code',
    command: (editor, range) =>
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
  {
    title: 'Blockquote',
    description: 'Quoted text',
    command: (editor, range) =>
      editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  {
    title: 'Divider',
    description: 'Horizontal rule',
    command: (editor, range) =>
      editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
]

interface SlashMenuRef {
  onKeyDown: (event: KeyboardEvent) => boolean
}

interface SlashMenuProps {
  items: SlashMenuItem[]
  command: (item: SlashMenuItem) => void
}

const SlashMenu = forwardRef<SlashMenuRef, SlashMenuProps>(({ items, command }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    setSelectedIndex(0)
  }, [items])

  useImperativeHandle(ref, () => ({
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((prev) => (prev - 1 + items.length) % items.length)
        return true
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((prev) => (prev + 1) % items.length)
        return true
      }
      if (event.key === 'Enter') {
        const item = items[selectedIndex]
        if (item) command(item)
        return true
      }
      return false
    },
  }))

  return (
    <div className="bg-popover border border-border py-1 min-w-[200px] max-h-[300px] overflow-y-auto">
      {items.map((item, index) => (
        <button
          key={item.title}
          onClick={() => command(item)}
          className={cn(
            'block w-full text-left px-3 py-1.5 text-sm transition-colors',
            index === selectedIndex
              ? 'bg-surface-hover text-foreground'
              : 'text-muted-foreground hover:bg-surface-hover',
          )}
        >
          <div className="font-medium text-foreground">{item.title}</div>
          <div className="text-xs text-muted-foreground">{item.description}</div>
        </button>
      ))}
    </div>
  )
})
SlashMenu.displayName = 'SlashMenu'

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addProseMirrorPlugins() {
    const editor = this.editor

    return [
      new Plugin({
        key: new PluginKey('slashCommand'),
        props: {
          handleKeyDown(view, event) {
            // Only show menu for '/' at the start of a line or after whitespace
            if (event.key !== '/') return false

            const { state } = view
            const { $from } = state.selection
            const textBefore = $from.parent.textContent.slice(0, $from.parentOffset)

            // Only trigger at start of line or after space
            if (textBefore.length > 0 && !textBefore.endsWith(' ')) return false

            return false // Let the character be typed, the suggestion plugin handles the rest
          },
        },
        view() {
          let component: ReactRenderer | null = null
          let popup: HTMLElement | null = null

          return {
            update(view, _prevState) {
              const { state } = view
              const { $from } = state.selection
              const textBefore = $from.parent.textContent.slice(0, $from.parentOffset)

              // Check if we're in a slash command context
              const slashMatch = textBefore.match(/\/(\w*)$/)

              if (!slashMatch) {
                if (popup) {
                  popup.remove()
                  popup = null
                }
                if (component) {
                  component.destroy()
                  component = null
                }
                return
              }

              const query = (slashMatch[1] ?? '').toLowerCase()
              const filteredItems = SLASH_ITEMS.filter(
                (item) =>
                  item.title.toLowerCase().includes(query) ||
                  item.description.toLowerCase().includes(query),
              )

              if (filteredItems.length === 0) {
                if (popup) {
                  popup.remove()
                  popup = null
                }
                if (component) {
                  component.destroy()
                  component = null
                }
                return
              }

              const range: Range = {
                from: $from.pos - slashMatch[0].length,
                to: $from.pos,
              }

              if (!component) {
                component = new ReactRenderer(SlashMenu, {
                  props: {
                    items: filteredItems,
                    command: (item: SlashMenuItem) => {
                      item.command(editor, range)
                      if (popup) {
                        popup.remove()
                        popup = null
                      }
                      if (component) {
                        component.destroy()
                        component = null
                      }
                    },
                  },
                  editor,
                })

                popup = document.createElement('div')
                popup.className = 'slash-menu-popup'
                popup.style.position = 'absolute'
                popup.style.zIndex = '50'
                popup.appendChild(component.element!)
                document.body.appendChild(popup)
              } else {
                component.updateProps({
                  items: filteredItems,
                  command: (item: SlashMenuItem) => {
                    item.command(editor, range)
                    if (popup) {
                      popup.remove()
                      popup = null
                    }
                    if (component) {
                      component.destroy()
                      component = null
                    }
                  },
                })
              }

              // Position the popup
              const coords = view.coordsAtPos($from.pos)
              if (popup) {
                popup.style.left = `${coords.left}px`
                popup.style.top = `${coords.bottom + 4}px`
              }
            },
            destroy() {
              if (popup) {
                popup.remove()
                popup = null
              }
              if (component) {
                component.destroy()
                component = null
              }
            },
          }
        },
      }),
    ]
  },
})
