"use client"

import React, { useState, useEffect } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { 
  Sheet, 
  SheetContent, 
  SheetFooter, 
  SheetHeader, 
  SheetTitle,
  SheetDescription,
  SheetClose
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Note } from "@/lib/supabase/types"
import { useCreateNote, useUpdateNote } from "@/hooks/use-notes"
import { cn } from "@/lib/utils"
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Quote,
  Code,
  SquareCode,
  Link,
  Check
} from "lucide-react"

// Form schema validation using zod
const noteFormSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }).max(100),
  content: z.string().min(1, { message: "Content is required" })
})

type NoteFormValues = z.infer<typeof noteFormSchema>

interface NoteEditorProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  note?: Note | null
  mode: 'create' | 'edit'
}

// Helper to insert formatting around selected text
const insertFormatting = (
  textareaEl: HTMLTextAreaElement,
  beforeText: string,
  afterText: string = beforeText
) => {
  const start = textareaEl.selectionStart
  const end = textareaEl.selectionEnd
  const selectedText = textareaEl.value.substring(start, end)
  const beforeContent = textareaEl.value.substring(0, start)
  const afterContent = textareaEl.value.substring(end)
  
  // Insert formatting
  const newText = beforeContent + beforeText + selectedText + afterText + afterContent
  
  // Update value
  textareaEl.value = newText
  
  // Set selection to just after the inserted text
  const newCursorPos = start + beforeText.length + selectedText.length + afterText.length
  textareaEl.setSelectionRange(newCursorPos, newCursorPos)
  
  // Focus the textarea
  textareaEl.focus()
  
  // Dispatch input event to trigger react-hook-form update
  const event = new Event('input', { bubbles: true })
  textareaEl.dispatchEvent(event)
}

export function NoteEditorRich({ isOpen, onClose, onSuccess, note, mode }: NoteEditorProps) {
  const [isSaving, setIsSaving] = useState(false)
  const createNoteMutation = useCreateNote()
  const updateNoteMutation = useUpdateNote()
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  
  // Initialize react-hook-form
  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      title: note?.title || "",
      content: note?.content || "",
    },
  })
  
  // Update form values when the note prop changes
  useEffect(() => {
    if (note) {
      form.reset({
        title: note.title,
        content: note.content
      })
    } else {
      form.reset({
        title: "",
        content: ""
      })
    }
  }, [note, form])
  
  // Handle form submission
  const handleSubmit = async (values: NoteFormValues) => {
    setIsSaving(true)
    try {
      if (mode === 'edit' && note) {
        // Update existing note
        await updateNoteMutation.mutateAsync({
          id: note.id,
          ...values
        })
      } else {
        // Create new note
        await createNoteMutation.mutateAsync(values)
      }
      
      // Notify parent component of success
      if (onSuccess) onSuccess()
      onClose()
    } catch (error) {
      console.error("Error saving note:", error)
      // Error will be handled by the mutation
    } finally {
      setIsSaving(false)
    }
  }
  
  // Formatting handlers
  const formatBold = () => {
    if (!textareaRef.current) return
    insertFormatting(textareaRef.current, '**', '**')
  }
  
  const formatItalic = () => {
    if (!textareaRef.current) return
    insertFormatting(textareaRef.current, '_', '_')
  }
  
  const formatUnderline = () => {
    if (!textareaRef.current) return
    insertFormatting(textareaRef.current, '<u>', '</u>')
  }
  
  const formatH1 = () => {
    if (!textareaRef.current) return
    insertFormatting(textareaRef.current, '# ', '')
  }
  
  const formatH2 = () => {
    if (!textareaRef.current) return
    insertFormatting(textareaRef.current, '## ', '')
  }
  
  const formatH3 = () => {
    if (!textareaRef.current) return
    insertFormatting(textareaRef.current, '### ', '')
  }
  
  const formatBulletList = () => {
    if (!textareaRef.current) return
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = textarea.value.substring(start, end)
    
    if (selectedText.includes('\n')) {
      // Convert each line to bullet points
      const lines = selectedText.split('\n')
      const formattedText = lines.map(line => line ? `- ${line}` : line).join('\n')
      
      const beforeContent = textarea.value.substring(0, start)
      const afterContent = textarea.value.substring(end)
      textarea.value = beforeContent + formattedText + afterContent
      
      // Set selection to the end of the inserted text
      const newCursorPos = start + formattedText.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    } else {
      insertFormatting(textarea, '- ', '')
    }
    
    textarea.focus()
    const event = new Event('input', { bubbles: true })
    textarea.dispatchEvent(event)
  }
  
  const formatNumberedList = () => {
    if (!textareaRef.current) return
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = textarea.value.substring(start, end)
    
    if (selectedText.includes('\n')) {
      // Convert each line to numbered list
      const lines = selectedText.split('\n')
      const formattedText = lines.map((line, index) => 
        line ? `${index + 1}. ${line}` : line
      ).join('\n')
      
      const beforeContent = textarea.value.substring(0, start)
      const afterContent = textarea.value.substring(end)
      textarea.value = beforeContent + formattedText + afterContent
      
      // Set selection to the end of the inserted text
      const newCursorPos = start + formattedText.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    } else {
      insertFormatting(textarea, '1. ', '')
    }
    
    textarea.focus()
    const event = new Event('input', { bubbles: true })
    textarea.dispatchEvent(event)
  }
  
  const formatBlockquote = () => {
    if (!textareaRef.current) return
    insertFormatting(textareaRef.current, '> ', '')
  }
  
  const formatInlineCode = () => {
    if (!textareaRef.current) return
    insertFormatting(textareaRef.current, '`', '`')
  }
  
  const formatCodeBlock = () => {
    if (!textareaRef.current) return
    insertFormatting(textareaRef.current, '```\n', '\n```')
  }
  
  const formatLink = () => {
    if (!textareaRef.current) return
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = textarea.value.substring(start, end)
    
    const linkText = selectedText || 'Link text'
    insertFormatting(textarea, `[${linkText}](`, ')')
  }
  
  const formatChecklist = () => {
    if (!textareaRef.current) return
    insertFormatting(textareaRef.current, '- [ ] ', '')
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="rounded-t-xl mx-auto h-6/7 w-full md:w-3/5 flex flex-col">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col h-full">
            <SheetHeader className="px-6 py-4 border-b">
              <SheetTitle>{mode === 'create' ? 'Create New Note' : 'Edit Note'}</SheetTitle>
              <SheetDescription>
                {mode === 'create' 
                  ? 'Create a new note to capture your thoughts and ideas.' 
                  : 'Make changes to your existing note.'}
              </SheetDescription>
            </SheetHeader>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter note title..." 
                        className="text-lg font-medium"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Formatting Toolbar */}
              <div className="flex flex-wrap items-center gap-1 p-1 bg-muted/50 rounded-md border">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={formatBold}
                  title="Bold"
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={formatItalic}
                  title="Italic"
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={formatUnderline}
                  title="Underline"
                >
                  <Underline className="h-4 w-4" />
                </Button>
                <div className="w-px h-5 bg-border mx-1"></div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={formatH1}
                  title="Heading 1"
                >
                  <Heading1 className="h-4 w-4" />
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={formatH2}
                  title="Heading 2"
                >
                  <Heading2 className="h-4 w-4" />
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={formatH3}
                  title="Heading 3"
                >
                  <Heading3 className="h-4 w-4" />
                </Button>
                <div className="w-px h-5 bg-border mx-1"></div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={formatBulletList}
                  title="Bullet List"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={formatNumberedList}
                  title="Numbered List"
                >
                  <ListOrdered className="h-4 w-4" />
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={formatChecklist}
                  title="Checklist"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <div className="w-px h-5 bg-border mx-1"></div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={formatBlockquote}
                  title="Blockquote"
                >
                  <Quote className="h-4 w-4" />
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={formatInlineCode}
                  title="Inline Code"
                >
                  <Code className="h-4 w-4" />
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={formatCodeBlock}
                  title="Code Block"
                >
                  <SquareCode className="h-4 w-4" />
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={formatLink}
                  title="Link"
                >
                  <Link className="h-4 w-4" />
                </Button>
              </div>
              
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Write your note content here..." 
                        className="min-h-[400px] resize-none font-mono text-base leading-relaxed"
                        {...field} 
                        ref={(e) => {
                          field.ref(e)
                          // @ts-ignore - we know this will be a textarea
                          textareaRef.current = e
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="text-sm text-muted-foreground">
                <p>Formatting tips:</p>
                <ul className="list-disc list-inside space-y-1 mt-1">
                  <li><code>**bold**</code> for <strong>bold text</strong></li>
                  <li><code>_italic_</code> for <em>italic text</em></li>
                  <li><code># Heading</code> for headings</li>
                  <li><code>- item</code> for bullet lists</li>
                  <li><code>1. item</code> for numbered lists</li>
                  <li><code>- [ ] task</code> for checklists</li>
                  <li><code>`code`</code> for inline code</li>
                </ul>
              </div>
            </div>
            
            <SheetFooter className="px-6 py-4 border-t">
              <div className="flex justify-between w-full">
                <SheetClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </SheetClose>
                <Button type="submit" disabled={isSaving || createNoteMutation.isPending || updateNoteMutation.isPending}>
                  {isSaving || createNoteMutation.isPending || updateNoteMutation.isPending
                    ? 'Saving...' 
                    : 'Save Note'}
                </Button>
              </div>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}