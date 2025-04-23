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
import { Note } from "@/lib/supabase/types"
import { useCreateNote, useUpdateNote } from "@/hooks/use-notes"
import { Loader2 } from "lucide-react"
import Tiptap from "@/components/TipTap"

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

export function NoteEditorRich({ isOpen, onClose, onSuccess, note, mode }: NoteEditorProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const createNoteMutation = useCreateNote()
  const updateNoteMutation = useUpdateNote()
  
  // Initialize react-hook-form
  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      title: note?.title || "",
      content: note?.content || "",
    },
  })

  // Watch form values for changes
  const formValues = form.watch()
  
  // Check for changes when form values update
  useEffect(() => {
    if (mode === 'edit' && note) {
      const isDifferent = 
        formValues.title !== note.title || 
        formValues.content !== note.content
      setHasChanges(isDifferent)
    } else {
      setHasChanges(true) // Always enabled in create mode
    }
  }, [formValues, note, mode])
  
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
              
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Tiptap 
                        content={field.value} 
                        onChange={field.onChange}
                        placeholder="Write your note content here..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <SheetFooter className="px-6 py-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSaving || (mode === 'edit' && !hasChanges)}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  mode === 'create' ? 'Create Note' : 'Save Changes'
                )}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}