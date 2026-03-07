import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Link from '@tiptap/extension-link'
import Typography from '@tiptap/extension-typography'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { Markdown } from 'tiptap-markdown'
import { useEffect, useRef, useCallback } from 'react'
import { SlashCommand } from './SlashCommand'

const lowlight = createLowlight(common)

interface NoteEditorProps {
  content: string
  onUpdate: (markdown: string) => void
  editable?: boolean
}

export function NoteEditor({ content, onUpdate, editable = true }: NoteEditorProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFocusedRef = useRef(false)
  const lastSavedRef = useRef(content)

  const handleUpdate = useCallback(
    (md: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        lastSavedRef.current = md
        onUpdate(md)
      }, 500)
    },
    [onUpdate],
  )

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // replaced by CodeBlockLowlight
      }),
      Placeholder.configure({
        placeholder: 'Start writing, or type / for commands…',
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: false }),
      Typography,
      CodeBlockLowlight.configure({ lowlight }),
      Markdown.configure({
        html: false,
        transformPastedText: true,
        transformCopiedText: true,
      }),
      SlashCommand,
    ],
    content,
    editable,
    editorProps: {
      attributes: {
        class: 'outline-none min-h-[calc(100vh-8rem)] px-12 py-4 prose-editor',
      },
    },
    onUpdate: ({ editor: ed }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const md = (ed.storage as Record<string, any>).markdown.getMarkdown()
      handleUpdate(md)
    },
    onFocus: () => {
      isFocusedRef.current = true
    },
    onBlur: () => {
      isFocusedRef.current = false
    },
  })

  // Sync external content changes (e.g., switching notes)
  // Skip updates while user is actively editing to prevent cursor jumps
  useEffect(() => {
    if (!editor) return
    if (isFocusedRef.current) return
    if (content === lastSavedRef.current) return
    lastSavedRef.current = content
    editor.commands.setContent(content)
  }, [editor, content])

  return (
    <div className="flex-1 overflow-auto">
      <EditorContent editor={editor} />
    </div>
  )
}
