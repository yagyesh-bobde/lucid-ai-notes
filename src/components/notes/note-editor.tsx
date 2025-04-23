"use client"

import React, { useState, useEffect } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
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
import { Note, CreateNoteInput, UpdateNoteInput } from "@/lib/supabase/types"
import { createNote, updateNote } from "@/lib/supabase/actions"
import { toast } from "sonner"

// Form schema validation using zod
const noteFormSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }).max(100),
  content: z.string().min(1, { message: "Content is required" })
})

type NoteFormValues = z.infer<typeof noteFormSchema>

interface NoteEditorProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  note?: Note | null
  mode: 'create' | 'edit'
}

export function NoteEditor({ isOpen, onClose, onSuccess, note, mode }: NoteEditorProps) {
  const [isSaving, setIsSaving] = useState(false)
  
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
        const { error } = await updateNote({
          id: note.id,
          ...values
        })
        
        if (error) throw new Error(error.message)
        
        toast.success("Note updated successfully")
      } else {
        // Create new note
        const { error } = await createNote(values)
        
        if (error) throw new Error(error.message)
        
        toast.success("Note created successfully")
      }
      
      // Notify parent component of success
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error saving note:", error)
      toast.error(error instanceof Error ? error.message : "Failed to save note")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[725px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create New Note' : 'Edit Note'}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter note title..." 
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
                    <Textarea 
                      placeholder="Write your note content here..." 
                      className="min-h-[200px] resize-y"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Note'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}