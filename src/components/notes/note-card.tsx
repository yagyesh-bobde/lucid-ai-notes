"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Edit, Trash } from "lucide-react"
import { Note } from "@/lib/supabase/types"
import { summarizeText } from "@/lib/gemini/client"
import { useSaveSummary, useQueryClient, noteKeys } from "@/hooks/use-notes"

// Define the formatRelativeTime function
const formatRelativeTime = (date: Date): string => {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  const minute = 60
  const hour = minute * 60
  const day = hour * 24
  const week = day * 7
  const month = day * 30
  const year = day * 365
  
  if (diffInSeconds < minute) {
    return 'just now'
  } else if (diffInSeconds < hour) {
    const minutes = Math.floor(diffInSeconds / minute)
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
  } else if (diffInSeconds < day) {
    const hours = Math.floor(diffInSeconds / hour)
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  } else if (diffInSeconds < week) {
    const days = Math.floor(diffInSeconds / day)
    return `${days} ${days === 1 ? 'day' : 'days'} ago`
  } else if (diffInSeconds < month) {
    const weeks = Math.floor(diffInSeconds / week)
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`
  } else if (diffInSeconds < year) {
    const months = Math.floor(diffInSeconds / month)
    return `${months} ${months === 1 ? 'month' : 'months'} ago`
  } else {
    const years = Math.floor(diffInSeconds / year)
    return `${years} ${years === 1 ? 'year' : 'years'} ago`
  }
}

interface NoteCardProps {
  note: Note
  onEdit: (note: Note) => void
  onDelete: (id: string) => void
}

import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
} from "@/components/ui/sheet"

export function NoteCard({ note, onEdit, onDelete }: NoteCardProps) {
  const [showSummary, setShowSummary] = useState(!!note.summary)
  const [localSummary, setLocalSummary] = useState<string | null>(note.summary)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [isReadViewOpen, setIsReadViewOpen] = useState(false)
  const saveSummaryMutation = useSaveSummary()
  const queryClient = useQueryClient()
  
  // Format the date for display
  const getFormattedDate = (dateString: string) => {
    try {
      return `Updated ${formatRelativeTime(new Date(dateString))}`;
    } catch (error) {
      return dateString;
    }
  }

  const handleSummarize = async () => {
    if (isSummarizing) return
    
    // If we already have a saved summary, just display it
    if (localSummary) {
      setShowSummary(true)
      return
    }
    
    setIsSummarizing(true)
    
    try {
      // Extract plain text from HTML for summarization
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = note.content
      const plainText = tempDiv.textContent || tempDiv.innerText || note.content
      
      // Generate a new summary using Gemini
      const result = await summarizeText(plainText, { maxLength: 75 })
      
      if ('error' in result) {
        throw new Error(result.error)
      }
      
      // Update local state immediately to show the summary
      setLocalSummary(result.summary)
      setShowSummary(true)
      
      // Save the generated summary to the database
      await saveSummaryMutation.mutateAsync({
        noteId: note.id,
        summary: result.summary
      }, {
        onSuccess: () => {
          // Update the cache with the new summary
          queryClient.setQueryData(
            noteKeys.detail(note.id),
            { ...note, summary: result.summary }
          )
          
          // Also update the note in the list cache
          queryClient.setQueriesData(
            { queryKey: noteKeys.lists() },
            (oldData: any) => {
              if (!oldData) return oldData
              return oldData.map((n: Note) => 
                n.id === note.id ? { ...n, summary: result.summary } : n
              )
            }
          )
        }
      })
    } catch (error) {
      console.error("Error summarizing note:", error)
      // Error is handled by the mutation
    } finally {
      setIsSummarizing(false)
    }
  }

  return (
    <>
      <Card 
        className="h-full flex flex-col hover:shadow-md transition-shadow duration-200 cursor-pointer"
        onClick={(e) => {
          // Prevent opening read view when clicking buttons
          if (
            (e.target as HTMLElement).tagName === 'BUTTON' ||
            (e.target as HTMLElement).closest('button')
          ) {
            return
          }
          setIsReadViewOpen(true)
        }}
      >
        <CardHeader className="pb-2 flex flex-row justify-between items-start">
          <CardTitle className="line-clamp-1 text-lg">{note.title}</CardTitle>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(note)}>
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit note</span>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(note.id)}
            >
              <Trash className="h-4 w-4" />
              <span className="sr-only">Delete note</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          {showSummary && localSummary ? (
            <div className="space-y-4">
              <div className="bg-secondary/50 p-3 rounded-md">
                <h4 className="font-medium text-sm mb-1">AI Summary</h4>
                <p className="text-sm">{localSummary}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowSummary(false)}>
                Show Original
              </Button>
            </div>
          ) : (
            <div className="text-muted-foreground text-sm line-clamp-6 prose prose-sm dark:prose-invert max-w-none">
              <div 
                dangerouslySetInnerHTML={{ __html: note.content }} 
                className="[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary/80"
                onClick={(e) => {
                  // Handle link clicks
                  const target = e.target as HTMLElement;
                  if (target.tagName === 'A') {
                    e.preventDefault();
                    const href = target.getAttribute('href');
                    if (href) {
                      window.open(href, '_blank');
                    }
                  }
                }}
              />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between pt-2 pb-4 text-xs text-muted-foreground border-t">
          <div>{getFormattedDate(note.updated_at)}</div>
          {!showSummary && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSummarize} 
              disabled={isSummarizing}
            >
              {isSummarizing ? "Summarizing..." : localSummary ? "Show Summary" : "Summarize"}
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Read-only View Sheet */}
      <Sheet open={isReadViewOpen} onOpenChange={setIsReadViewOpen}>
        <SheetContent side="right" className="w-full sm:w-[540px] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-2xl">{note.title}</SheetTitle>
            <div className="text-xs text-muted-foreground">
              {getFormattedDate(note.updated_at)}
            </div>
          </SheetHeader>
          
          <div className="space-y-8">
            {/* Note Content */}
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div 
                dangerouslySetInnerHTML={{ __html: note.content }}
                className="[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary/80"
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (target.tagName === 'A') {
                    e.preventDefault();
                    const href = target.getAttribute('href');
                    if (href) {
                      window.open(href, '_blank');
                    }
                  }
                }}
              />
            </div>
            
            {/* AI Summary Section */}
            {note.summary && (
              <div className="bg-secondary/50 p-4 rounded-lg">
                <h4 className="font-medium text-sm mb-2">AI Summary</h4>
                <p className="text-sm text-muted-foreground">{note.summary}</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}