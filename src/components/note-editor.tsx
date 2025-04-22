import React, { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Note, CreateNoteInput, UpdateNoteInput } from "@/lib/notes-service";

// Form schema validation using zod
const noteFormSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }).max(100),
  content: z.string().min(1, { message: "Content is required" })
});

type NoteFormValues = z.infer<typeof noteFormSchema>;

interface NoteEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateNoteInput | UpdateNoteInput) => Promise<void>;
  note?: Note | null;
  mode: 'create' | 'edit';
}

export function NoteEditor({ isOpen, onClose, onSave, note, mode }: NoteEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  
  // Initialize react-hook-form
  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      title: note?.title || "",
      content: note?.content || "",
    },
  });
  
  // Update form values when the note prop changes
  useEffect(() => {
    if (note) {
      form.reset({
        title: note.title,
        content: note.content
      });
    } else {
      form.reset({
        title: "",
        content: ""
      });
    }
  }, [note, form]);
  
  // Handle form submission
  const handleSubmit = async (values: NoteFormValues) => {
    try {
      setIsSaving(true);
      
      if (mode === 'edit' && note) {
        await onSave({
          id: note.id,
          ...values
        });
      } else {
        await onSave(values);
      }
      
      onClose();
    } catch (error) {
      console.error("Error saving note:", error);
    } finally {
      setIsSaving(false);
    }
  };

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
  );
}