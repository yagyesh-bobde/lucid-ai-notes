"use client"

import React, { useState, useEffect } from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { PlusIcon, SearchIcon, RefreshCw } from "lucide-react"
import { NoteCard } from "@/components/notes/note-card"
import { NoteEditorRich } from "@/components/notes/note-editor"
import { Note } from "@/lib/supabase/types"
import { useNotes, useDeleteNote, useQueryClient, noteKeys } from "@/hooks/use-notes"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null)
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create')
  const [showDeleteAnimation, setShowDeleteAnimation] = useState(false)
  const [noteIdToAnimate, setNoteIdToAnimate] = useState<string | null>(null)
  
  // Using the custom hooks for data fetching and mutations
  const { data: notes = [], isLoading, refetch } = useNotes()
  const deleteNoteMutation = useDeleteNote()
  const queryClient = useQueryClient()
  
  // Open the editor to create a new note
  const openCreateEditor = () => {
    setEditingNote(null)
    setEditorMode('create')
    setIsEditorOpen(true)
  }
  
  // Open the editor to edit an existing note
  const openEditEditor = (note: Note) => {
    setEditingNote(note)
    setEditorMode('edit')
    setIsEditorOpen(true)
  }
  
  // Open delete confirmation dialog
  const confirmDelete = (id: string) => {
    setNoteToDelete(id)
    setIsDeleteDialogOpen(true)
  }
  
  // Handle note deletion with animation
  const handleDeleteNote = async () => {
    if (!noteToDelete) return
    
    try {
      // Start delete animation
      setNoteIdToAnimate(noteToDelete)
      setShowDeleteAnimation(true)
      
      // Optimistically update the UI by removing the note from the list
      queryClient.setQueriesData(
        { queryKey: noteKeys.lists() },
        (oldData: any) => {
          if (!oldData) return oldData
          return oldData.filter((note: Note) => note.id !== noteToDelete)
        }
      )
      
      // Close dialog immediately
      setIsDeleteDialogOpen(false)
      
      // Actually delete the note
      await deleteNoteMutation.mutateAsync(noteToDelete)
      
      // Clear delete state
      setNoteToDelete(null)
    } catch (error) {
      console.error("Error deleting note:", error)
      // If error occurs, revert the optimistic update by refetching
      refetch()
    } finally {
      // End animation
      setShowDeleteAnimation(false)
      setNoteIdToAnimate(null)
    }
  }
  
  // Filter notes based on search term
  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    note.content.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  return (
    <div className="">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Your Notes</h2>
        <ThemeToggle />
      </div>

       {/* Delete Confirmation Dialog */}
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this note.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteNote}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteNoteMutation.isPending}
            >
              {deleteNoteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-64">
          <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <input 
            className="w-full rounded-md border border-input bg-background pl-8 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" 
            placeholder="Search notes..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            onClick={() => refetch()} 
            variant="outline" 
            size="icon" 
            className="h-9 w-9"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh</span>
          </Button>
          <Button onClick={openCreateEditor} className="w-full sm:w-auto">
            <PlusIcon className="mr-2 h-4 w-4" /> New Note
          </Button>
        </div>
      </div>

      {/* Empty state */}
      {filteredNotes.length === 0 && !isLoading && (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <h3 className="text-xl font-medium mb-2">No notes found</h3>
          <p className="text-muted-foreground mb-6">
            {searchTerm ? "Try a different search term" : "Create your first note to get started"}
          </p>
          {!searchTerm && (
            <Button onClick={openCreateEditor}>
              <PlusIcon className="mr-2 h-4 w-4" /> Create Note
            </Button>
          )}
        </div>
      )}
      
      {/* Loading state */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      )}

      {/* Notes Grid */}
      {!isLoading && filteredNotes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map(note => (
            <div
              key={note.id}
              className={`transition-all duration-300 ${
                showDeleteAnimation && noteIdToAnimate === note.id
                  ? 'scale-0 opacity-0'
                  : 'scale-100 opacity-100'
              }`}
            >
              <NoteCard
                note={note}
                onEdit={openEditEditor}
                onDelete={confirmDelete}
              />
            </div>
          ))}
        </div>
      )}
      
      {/* Rich Note Editor Sheet */}
      <NoteEditorRich
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        note={editingNote}
        mode={editorMode}
      />
    </div>
  )
}