"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Flashcard } from "@/components/study/flashcard"
import { generateStudyGuide } from "@/lib/gemini/client"
import { useCreateNote } from "@/hooks/use-notes"
import { Loader2, Save, CheckCircle2, XCircle, Trophy, ArrowRight, School } from "lucide-react"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"

export default function StudyPage() {
  const [topic, setTopic] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [studyData, setStudyData] = useState<{
    summary: string;
    flashcards: Array<{ front: string; back: string }>;
    quizQuestions: Array<{
      question: string;
      options: string[];
      correctAnswer: string;
    }>;
  } | null>(null)
  
  const createNoteMutation = useCreateNote()

const handleSearch = async (e: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent<HTMLButtonElement>) => {
  // For keyboard events, only proceed if Enter key is pressed
  if ('key' in e && e.key !== 'Enter') return
  if (!topic.trim()) {
    toast.warning("Please enter a topic")
    return
  } 

  setIsLoading(true)
  try {
    const result = await generateStudyGuide(topic)
    if ('error' in result) {
      throw new Error(result.error)
    }
    setStudyData(result)
  } catch (error) {
    toast.error("Failed to generate study guide")
    console.error(error)
  } finally {
    setIsLoading(false)
  }
}

  const handleSaveSummary = async () => {
    if (!studyData) return
    
    try {
      await createNoteMutation.mutateAsync({
        title: `Study Notes: ${topic}`,
        content: studyData.summary
      })
      toast.success("Summary saved to notes")
    } catch (error) {
      toast.error("Failed to save summary")
      console.error(error)
    }
  }

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [quizAnswers, setQuizAnswers] = useState<{
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }[]>([])
  const [quizCompleted, setQuizCompleted] = useState(false)

  const handleAnswerSubmit = (question: string, selectedAnswer: string, correctAnswer: string) => {
    const isCorrect = selectedAnswer === correctAnswer
    setQuizAnswers(prev => [...prev, {
      question,
      userAnswer: selectedAnswer,
      correctAnswer,
      isCorrect
    }])

    if (currentQuestionIndex < (studyData?.quizQuestions.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      setQuizCompleted(true)
    }
  }

  const handleSaveQuizResults = async () => {
    if (!studyData || !quizAnswers.length) return
    
    const correctAnswers = quizAnswers.filter(a => a.isCorrect).length
    const total = quizAnswers.length
    const percentage = Math.round((correctAnswers / total) * 100)
    
    const resultsContent = `
# Quiz Results for ${topic}

Score: ${correctAnswers}/${total} (${percentage}%)

## Questions and Answers:
${quizAnswers.map((answer, index) => `
${index + 1}. ${answer.question}
- Your Answer: ${answer.userAnswer}
- Correct Answer: ${answer.correctAnswer}
- Result: ${answer.isCorrect ? '✅ Correct' : '❌ Incorrect'}
`).join('\n')}

## Summary
${studyData.summary}
    `.trim()

    try {
      await createNoteMutation.mutateAsync({
        title: `Quiz Results: ${topic}`,
        content: resultsContent
      })
      toast.success("Quiz results saved to notes")
    } catch (error) {
      toast.error("Failed to save quiz results")
      console.error(error)
    }
  }

  return (
    <div className="container max-w-5xl py-8">
      <h1 className="text-3xl font-bold mb-8">AI Study Notes</h1>
      
      <div className="flex gap-4 mb-8">
        <Input
          placeholder="Enter a topic to study..."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={handleSearch}
          disabled={isLoading}
        />
        <Button
          variant={"default"}
          onClick={handleSearch}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate"}
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {!isLoading && !studyData && 
        <div className="flex flex-col items-center justify-center py-12">
          <School className="w-10 h-10" />
          <p className="text-xl text-muted-foreground">
            Enter a topic to generate a study guide 
          </p>
        </div>    
      }

      {studyData && (
        <Tabs defaultValue="summary" className="space-y-4">
          <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
            <TabsTrigger value="quiz">Quiz</TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <Card className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold">Summary</h2>
                <Button onClick={handleSaveSummary} disabled={createNoteMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  Save to Notes
                </Button>
              </div>
              <p className="leading-relaxed">{studyData.summary}</p>
            </Card>
          </TabsContent>

          <TabsContent value="flashcards">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {studyData.flashcards.map((card, index) => (
                <Flashcard key={index} {...card} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="quiz">
            {!quizCompleted ? (
              <Card className="p-6">
                <div className="mb-6">
                  <Progress 
                    value={(currentQuestionIndex / (studyData?.quizQuestions.length || 1)) * 100} 
                    className="h-2"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Question {currentQuestionIndex + 1} of {studyData?.quizQuestions.length}
                  </p>
                </div>
                
                {studyData && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-medium mb-6">
                        {studyData.quizQuestions[currentQuestionIndex].question}
                      </h3>
                      <div className="grid gap-3">
                        {studyData.quizQuestions[currentQuestionIndex].options.map((option, optionIndex) => (
                          <Button
                            key={optionIndex}
                            variant="outline"
                            className="w-full justify-start p-4 h-auto text-left"
                            onClick={() => handleAnswerSubmit(
                              studyData.quizQuestions[currentQuestionIndex].question,
                              option,
                              studyData.quizQuestions[currentQuestionIndex].correctAnswer
                            )}
                          >
                            <span className="mr-2">{String.fromCharCode(65 + optionIndex)}.</span>
                            {option}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            ) : (
              <Card className="p-6">
                <div className="text-center mb-8">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                  <h3 className="text-2xl font-bold mb-2">Quiz Completed!</h3>
                  <p className="text-muted-foreground">
                    You got {quizAnswers.filter(a => a.isCorrect).length} out of {quizAnswers.length} correct
                  </p>
                </div>

                <div className="space-y-4 mb-8">
                  {quizAnswers.map((answer, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        {answer.isCorrect ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
                        )}
                        <div>
                          <p className="font-medium mb-2">{answer.question}</p>
                          <p className="text-sm text-muted-foreground">Your answer: {answer.userAnswer}</p>
                          {!answer.isCorrect && (
                            <p className="text-sm text-muted-foreground">
                              Correct answer: {answer.correctAnswer}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCurrentQuestionIndex(0)
                      setQuizAnswers([])
                      setQuizCompleted(false)
                    }}
                  >
                    Try Again
                  </Button>
                  <Button onClick={handleSaveQuizResults} disabled={createNoteMutation.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Results
                  </Button>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}