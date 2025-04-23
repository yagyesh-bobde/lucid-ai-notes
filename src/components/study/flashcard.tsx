"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Repeat, Lightbulb, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface FlashcardProps {
  front: string
  back: string
}

export function Flashcard({ front, back }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [hasBeenFlipped, setHasBeenFlipped] = useState(false)

  const handleFlip = (value: boolean) => {
    setIsFlipped(value)
    if (!hasBeenFlipped) setHasBeenFlipped(true)
  }

  return (
    <Card 
      className={cn(
        "relative h-64 cursor-pointer [perspective:1000px] group",
        !hasBeenFlipped && "animate-pulse-subtle"
      )}
      onClick={() => handleFlip(!isFlipped)}
    >
      <div 
        className={`absolute inset-0 w-full h-full transition-all duration-500 [transform-style:preserve-3d] ${
          isFlipped ? '[transform:rotateY(180deg)]' : ''
        }`}
      >
        {/* Front */}
        <div className="absolute inset-0 p-6 flex flex-col items-center justify-between text-center [backface-visibility:hidden] bg-gradient-to-b from-card to-background rounded-lg border">
          <div className="flex-1 flex items-center justify-center">
            <div>
              <Lightbulb className="h-6 w-6 mb-4 text-muted-foreground mx-auto animate-bounce-subtle" />
              <p className="text-xl font-medium leading-relaxed">{front}</p>
            </div>
          </div>
          <Button 
            variant="outline"
            size="sm" 
            className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              handleFlip(true)
            }}
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            Reveal Answer
          </Button>
        </div>

        {/* Back */}
        <div 
          className="absolute inset-0 p-6 flex flex-col items-center justify-between text-center [backface-visibility:hidden] [transform:rotateY(180deg)] bg-gradient-to-b from-primary/10 to-background rounded-lg border"
        >
          <div className="flex-1 flex items-center justify-center">
            <p className="text-lg leading-relaxed">{back}</p>
          </div>
          <Button 
            variant="outline"
            size="sm" 
            className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              handleFlip(false)
            }}
          >
            <Repeat className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    </Card>
  )
}