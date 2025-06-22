"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { User } from "@supabase/supabase-js"
import { TestResult } from "@/entities/TestResult"
import { User as UserEntity } from "@/entities/User"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Brain,
  Clock,
  ArrowRight,
  BookOpen,
  Loader2
} from "lucide-react"
import { createPageUrl } from "@/lib/utils"
import Layout from "@/components/Layout"

interface UserProfile {
  email: string
  total_questions_answered?: number
  best_score?: number
}

interface TestSession {
  totalQuestions: number
  correctAnswers: number
  startTime: number
}

interface TestContentProps {
  user: User
}

// Preload initial question for better UX
const INITIAL_QUESTION = {
  id: "demo_start",
  question_id: 7,
  question_text: "A 65-year-old patient is admitted with chest pain and shortness of breath. The ECG shows ST-elevation in leads II, III, and aVF. What is the most likely location of the myocardial infarction?",
  option_a: "Anterior wall",
  option_b: "Posterior wall", 
  option_c: "Lateral wall",
  option_d: "Inferior wall",
  correct_answer: "D",
  difficulty: "Medium",
  explanation: "The ST-elevation in leads II, III, and aVF indicates an inferior wall myocardial infarction. These leads specifically monitor the inferior wall of the left ventricle. When ST-elevation occurs in these leads, it typically indicates occlusion of the right coronary artery (RCA) or less commonly the left circumflex artery, resulting in ischemia to the inferior wall of the heart."
}

export default function TestContent({ user }: TestContentProps) {
  const router = useRouter()
  const [currentQuestion, setCurrentQuestion] = useState(INITIAL_QUESTION)
  const [selectedAnswer, setSelectedAnswer] = useState("")
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [aiExplanation, setAiExplanation] = useState("")  
  const [submittingAnswer, setSubmittingAnswer] = useState(false)
  const [loadingNextQuestion, setLoadingNextQuestion] = useState(false)
  const [finishingTest, setFinishingTest] = useState(false)
  const [nextButtonDelay, setNextButtonDelay] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  const [testSession, setTestSession] = useState<TestSession>({
    totalQuestions: 0,
    correctAnswers: 0,
    startTime: Date.now()
  })
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Memoized calculations for better performance
  const currentScore = useMemo(() => {
    return testSession.totalQuestions > 0 
      ? Math.round((testSession.correctAnswers / testSession.totalQuestions) * 100) 
      : 0
  }, [testSession.correctAnswers, testSession.totalQuestions])

  const progressPercentage = useMemo(() => {
    return testSession.totalQuestions > 0 
      ? (testSession.correctAnswers / testSession.totalQuestions) * 100 
      : 0
  }, [testSession.correctAnswers, testSession.totalQuestions])

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
  }, [])

  // Clean up polling on unmount
  useEffect(() => {
    return () => stopPolling()
  }, [stopPolling])

  // Initialize test data
  useEffect(() => {
    const initializeTest = async () => {
      try {
        const currentUser = await UserEntity.me()
        setUserProfile(currentUser as UserProfile)
      } catch (error) {
        console.error("Error initializing test:", error)
      }
    }
    
    initializeTest()
  }, [])

  const handleAnswerSubmit = async () => {
    if (!selectedAnswer || !currentQuestion || submittingAnswer) return

    setSubmittingAnswer(true)
    const correct = selectedAnswer === currentQuestion.correct_answer
    
    try {
      // Send webhook to Make.com/n8n
      const webhookResponse = await fetch('https://fatimakz.app.n8n.cloud/webhook/345e649d-a1c9-49f8-ab5b-5489e8e4f42b', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          user_email: user.email,
          question_id: currentQuestion.question_id,
          selected_answer: selectedAnswer,
          correct_answer: currentQuestion.correct_answer,
          is_correct: correct,
          timestamp: new Date().toISOString()
        })
      })

      if (webhookResponse.ok) {
        console.log("Answer submitted successfully")
      }
    } catch (error) {
      console.error("Error submitting answer:", error)
    }

    // Update test session
    setTestSession(prev => ({
      ...prev,
      totalQuestions: prev.totalQuestions + 1,
      correctAnswers: prev.correctAnswers + (correct ? 1 : 0)
    }))

    setIsCorrect(correct)
    setShowResult(true)
    setSubmittingAnswer(false)

    // Start polling for AI explanation
    startPollingForExplanation()
  }

  const startPollingForExplanation = useCallback(() => {
    let attempts = 0
    const maxAttempts = 10

    pollIntervalRef.current = setInterval(async () => {
      attempts++
      
      try {
        const response = await fetch(`/api/gemini-explanation?session_id=${sessionId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.explanation) {
            setAiExplanation(data.explanation)
            stopPolling()
            return
          }
        }
      } catch (error) {
        console.error("Error polling for explanation:", error)
      }

      if (attempts >= maxAttempts) {
        stopPolling()
        setAiExplanation("AI explanation is being generated. Please wait a moment.")
      }
    }, 2000)
  }, [sessionId, stopPolling])

  const handleNextQuestion = async () => {
    if (loadingNextQuestion) return

    setLoadingNextQuestion(true)
    setShowResult(false)
    setSelectedAnswer("")
    setAiExplanation("")
    setNextButtonDelay(true)

    try {
      const response = await fetch('/api/get-next-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          user_email: user.email,
          current_question_id: currentQuestion.question_id
        })
      })

      if (response.ok) {
        const nextQuestion = await response.json()
        setCurrentQuestion(nextQuestion)
      } else {
        // Fallback to a new question
        setCurrentQuestion({
          ...INITIAL_QUESTION,
          question_id: Math.floor(Math.random() * 1000),
          question_text: "What is the primary function of the sinoatrial (SA) node?",
          option_a: "To pump blood to the lungs",
          option_b: "To act as the heart's natural pacemaker",
          option_c: "To filter blood",
          option_d: "To produce hormones",
          correct_answer: "B",
          explanation: "The sinoatrial (SA) node is the heart's natural pacemaker, responsible for initiating the electrical impulses that cause the heart to beat."
        })
      }
    } catch (error) {
      console.error("Error loading next question:", error)
      // Fallback question
      setCurrentQuestion({
        ...INITIAL_QUESTION,
        question_id: Math.floor(Math.random() * 1000),
        question_text: "What is the primary function of the sinoatrial (SA) node?",
        option_a: "To pump blood to the lungs",
        option_b: "To act as the heart's natural pacemaker",
        option_c: "To filter blood",
        option_d: "To produce hormones",
        correct_answer: "B",
        explanation: "The sinoatrial (SA) node is the heart's natural pacemaker, responsible for initiating the electrical impulses that cause the heart to beat."
      })
    }

    setTimeout(() => setNextButtonDelay(false), 3000)
    setLoadingNextQuestion(false)
  }

  const finishTest = async () => {
    if (finishingTest) return

    setFinishingTest(true)
    const timeSpent = Math.round((Date.now() - testSession.startTime) / 1000)

    try {
      // Create test result
      await TestResult.create({
        user_email: user.email!,
        questions_answered: testSession.totalQuestions,
        correct_answers: testSession.correctAnswers,
        percentage_score: currentScore,
        time_spent: timeSpent,
        test_date: new Date().toISOString()
      })

      // Update user stats
      if (userProfile) {
        await UserEntity.updateMyUserData({
          total_questions_answered: (userProfile.total_questions_answered || 0) + testSession.totalQuestions,
          best_score: Math.max(userProfile.best_score || 0, currentScore)
        })
      }

      router.push(createPageUrl("Dashboard"))
    } catch (error) {
      console.error("Error finishing test:", error)
      router.push(createPageUrl("Dashboard"))
    }
  }

  const handleAnswerSelect = (answer: string) => {
    if (!showResult) {
      setSelectedAnswer(answer)
    }
  }

  if (loadingNextQuestion) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading next question...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout currentPageName="Test">
      <div className="min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Link 
              href={createPageUrl("Dashboard")} 
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="px-3 py-1">
                <Clock className="w-4 h-4 mr-1" /> Question {testSession.totalQuestions + 1}
              </Badge>
              <Badge className="bg-blue-100 text-blue-800 px-3 py-1">
                Score: {currentScore}%
              </Badge>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{testSession.correctAnswers}/{testSession.totalQuestions} correct</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Question Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Question {testSession.totalQuestions + 1}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-lg text-gray-900 leading-relaxed">
                {currentQuestion.question_text}
              </div>

              {/* Answer Options */}
              <div className="space-y-3">
                {['A', 'B', 'C', 'D'].map((option) => {
                  const answerText = currentQuestion[`option_${option.toLowerCase()}` as keyof typeof currentQuestion] as string
                  const isSelected = selectedAnswer === option
                  const isCorrect = showResult && option === currentQuestion.correct_answer
                  const isWrong = showResult && isSelected && !isCorrect

                  return (
                    <button
                      key={option}
                      onClick={() => handleAnswerSelect(option)}
                      disabled={showResult}
                      className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                        isSelected
                          ? isCorrect
                            ? 'border-green-500 bg-green-50'
                            : isWrong
                            ? 'border-red-500 bg-red-50'
                            : 'border-blue-500 bg-blue-50'
                          : isCorrect
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          isSelected
                            ? isCorrect
                              ? 'bg-green-500 text-white'
                              : isWrong
                              ? 'bg-red-500 text-white'
                              : 'bg-blue-500 text-white'
                            : isCorrect
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          {option}
                        </div>
                        <span className="text-gray-900">{answerText}</span>
                        {showResult && (
                          <div className="ml-auto">
                            {isCorrect && <CheckCircle className="w-5 h-5 text-green-500" />}
                            {isWrong && <XCircle className="w-5 h-5 text-red-500" />}
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Submit Button */}
              {!showResult && selectedAnswer && (
                <Button
                  onClick={handleAnswerSubmit}
                  disabled={submittingAnswer}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                >
                  {submittingAnswer ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Answer'
                  )}
                </Button>
              )}

              {/* Result and Next Question */}
              {showResult && (
                <div className="space-y-4">
                  <Alert className={isCorrect ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                    <AlertDescription className={isCorrect ? "text-green-800" : "text-red-800"}>
                      {isCorrect ? (
                        <>
                          <CheckCircle className="w-4 h-4 inline mr-2" />
                          Correct! Well done!
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 inline mr-2" />
                          Incorrect. The correct answer is {currentQuestion.correct_answer}.
                        </>
                      )}
                    </AlertDescription>
                  </Alert>

                  {/* AI Explanation */}
                  {aiExplanation && (
                    <Card className="border-blue-200 bg-blue-50">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-2">
                          <Brain className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-blue-900 mb-1">AI Explanation</p>
                            <p className="text-sm text-blue-800">{aiExplanation}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      onClick={handleNextQuestion}
                      disabled={nextButtonDelay || loadingNextQuestion}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {loadingNextQuestion ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          Next Question <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={finishTest}
                      disabled={finishingTest}
                      variant="outline"
                      className="flex-1"
                    >
                      {finishingTest ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Finishing...
                        </>
                      ) : (
                        'Finish Test'
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  )
} 