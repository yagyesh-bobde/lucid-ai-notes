"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { 
  createNote as createNoteAction, 
  updateNote as updateNoteAction,
  deleteNote as deleteNoteAction,
  saveSummary as saveSummaryAction
} from "@/lib/supabase/actions"
import { Note, CreateNoteInput, UpdateNoteInput } from "@/lib/supabase/types"

// Query keys
export const noteKeys = {
  all: ['notes'] as const,
  lists: () => [...noteKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...noteKeys.lists(), { ...filters }] as const,
  details: () => [...noteKeys.all, 'detail'] as const,
  detail: (id: string) => [...noteKeys.details(), id] as const,
}

// Custom hook for fetching all notes
export function useNotes() {
  const supabase = createClient()
  
  return useQuery({
    queryKey: noteKeys.lists(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('updated_at', { ascending: false })
      
      if (error) {
        throw new Error(error.message)
      }
      
      return data as Note[]
    },
  })
}

// Custom hook for fetching a single note
export function useNote(id: string) {
  const supabase = createClient()
  
  return useQuery({
    queryKey: noteKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        throw new Error(error.message)
      }
      
      return data as Note
    },
    enabled: !!id, // Only run the query if an ID is provided
  })
}

// Custom hook for creating a note
export function useCreateNote() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (noteData: CreateNoteInput) => {
      const { note, error } = await createNoteAction(noteData)
      
      if (error) {
        throw new Error(error.message)
      }
      
      return note
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() })
      toast.success("Note created successfully")
    },
    onError: (error) => {
      toast.error(`Failed to create note: ${error.message}`)
    },
  })
}

// Custom hook for updating a note
export function useUpdateNote() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (noteData: UpdateNoteInput) => {
      const { note, error } = await updateNoteAction(noteData)
      
      if (error) {
        throw new Error(error.message)
      }
      
      return note
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() })
      queryClient.invalidateQueries({ queryKey: noteKeys.detail(variables.id) })
      toast.success("Note updated successfully")
    },
    onError: (error) => {
      toast.error(`Failed to update note: ${error.message}`)
    },
  })
}

// Custom hook for deleting a note
export function useDeleteNote() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await deleteNoteAction(id)
      
      if (error) {
        throw new Error(error.message)
      }
      
      return id
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() })
      queryClient.invalidateQueries({ queryKey: noteKeys.detail(id) })
      toast.success("Note deleted successfully")
    },
    onError: (error) => {
      toast.error(`Failed to delete note: ${error.message}`)
    },
  })
}

// Custom hook for saving summary
export function useSaveSummary() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ noteId, summary }: { noteId: string, summary: string }) => {
      const { error } = await saveSummaryAction(noteId, summary)
      
      if (error) {
        throw new Error(error.message)
      }
      
      return { noteId, summary }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.lists() })
      queryClient.invalidateQueries({ queryKey: noteKeys.detail(data.noteId) })
    },
    onError: (error) => {
      toast.error(`Failed to save summary: ${error.message}`)
    },
  })
}