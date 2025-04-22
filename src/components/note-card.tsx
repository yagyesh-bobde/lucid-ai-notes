import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { summarizeText } from "@/lib/gemini";
import { toast } from "@/components/ui/sonner";
import { Note, NotesService } from "@/lib/notes-service";
import { Edit, Trash } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { NOTES_QUERY_KEY } from "@/hooks/useNotes";

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

export function NoteCard({ note, onEdit, onDelete, onRefresh }: NoteCardProps) {
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [showSummary, setShowSummary] = useState(!!note.summary);
  const queryClient = useQueryClient();

  // Format the date for display
  const getFormattedDate = (dateString: string) => {
    try {
      return `Updated ${formatDistanceToNow(new Date(dateString), { addSuffix: true })}`;
    } catch (error) {
      return dateString;
    }
  };

  // Create a mutation for summarizing text
  const summarizeMutation = useMutation({
    mutationFn: async () => {
      // If we already have a saved summary, just display it
      if (note.summary) {
        return { summary: note.summary };
      }
      
      // Generate a new summary using Gemini
      const summary = await summarizeText(note.content, { maxLength: 75 });
      
      // Save the summary using the NotesService
      const success = await NotesService.saveSummary(note.id, summary);
      
      if (!success) {
        throw new Error('Failed to save summary');
      }
      
      return { summary };
    },
    onSuccess: (data) => {
      // Invalidate and refetch notes query to get the updated data
      queryClient.invalidateQueries({ queryKey: [NOTES_QUERY_KEY] });
      onRefresh(); // Refresh the notes list to get the updated note with summary
      setShowSummary(true);
    },
    onError: (error) => {
      console.error("Error summarizing note:", error);
      toast.error("Failed to generate summary. Please try again.");
    },
  });

  const handleSummarize = async () => {
    if (isSummarizing) return;
    
    setIsSummarizing(true);
    try {
      // If we already have a saved summary, just display it
      if (note.summary) {
        setShowSummary(true);
        return;
      }
      
      // Otherwise, trigger the mutation to generate and save the summary
      await summarizeMutation.mutateAsync();
      
    } catch (error) {
      console.error("Error summarizing note:", error);
      toast.error("Failed to generate summary. Please try again.");
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow duration-200">
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
        {showSummary && note.summary ? (
          <div className="space-y-4">
            <div className="bg-secondary/50 p-3 rounded-md">
              <h4 className="font-medium text-sm mb-1">AI Summary</h4>
              <p className="text-sm">{note.summary}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowSummary(false)}>
              Show Original
            </Button>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm line-clamp-6 whitespace-pre-line">{note.content}</p>
        )}
      </CardContent>
      <CardFooter className="flex justify-between pt-2 pb-4 text-xs text-muted-foreground border-t">
        <div>{getFormattedDate(note.updated_at)}</div>
        {!showSummary && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSummarize} 
            disabled={isSummarizing || summarizeMutation.isPending}
          >
            {isSummarizing || summarizeMutation.isPending ? "Summarizing..." : note.summary ? "Show Summary" : "Summarize"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}