"use client"

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TestResult } from "@/entities/TestResult";
import { User as UserEntity } from "@/entities/User";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Brain, Loader2, CheckCircle, XCircle, ArrowLeft, ArrowRight, BookOpen, Clock, Flag } from "lucide-react";
import { createPageUrl } from "@/lib/utils";
import Layout from "@/components/Layout";

interface UserProfile {
  email: string;
  total_questions_answered?: number;
  best_score?: number;
}

interface Question {
  id: string;
  question_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  difficulty: string;
  explanation?: string;
}

const TOTAL_QUESTIONS = 10;

export default function Test() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [aiExplanation, setAiExplanation] = useState("");
  const [fetchingExplanation, setFetchingExplanation] = useState(false);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [finishingTest, setFinishingTest] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [answers, setAnswers] = useState<Record<number, string>>({});

  useEffect(() => {
    initializeTest();
  }, []);

  const initializeTest = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const currentUser = await UserEntity.me();
      setUser(currentUser as UserProfile);

      const res = await fetch("/api/get-test-questions");
      if (!res.ok) {
        throw new Error("Failed to load questions");
      }
      const data = await res.json();
      if (!data.questions || data.questions.length === 0) {
        throw new Error("No questions available");
      }
      setQuestions(data.questions);
    } catch (error) {
      console.error("Error initializing test:", error);
      setLoadError(error instanceof Error ? error.message : "Failed to load test");
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentIndex];

  const handleAnswerSubmit = async () => {
    if (!selectedAnswer || !currentQuestion || submittingAnswer) return;

    setSubmittingAnswer(true);
    const correct = selectedAnswer === currentQuestion.correct_answer;
    setIsCorrect(correct);
    setShowResult(true);
    setAnswers((prev) => ({ ...prev, [currentIndex]: selectedAnswer }));

    setFetchingExplanation(true);
    try {
      const res = await fetch("/api/question-explanation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_text: currentQuestion.question_text,
          selected_answer: selectedAnswer,
          correct_answer: currentQuestion.correct_answer,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.explanation) {
          setAiExplanation(data.explanation);
        }
      }
    } catch (error) {
      console.error("Error fetching explanation:", error);
    } finally {
      setFetchingExplanation(false);
      setSubmittingAnswer(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 >= questions.length) {
      finishTest();
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    setSelectedAnswer("");
    setShowResult(false);
    setAiExplanation("");
  };

  const correctCount = Object.entries(answers).filter(([idx, ans]) => {
    const q = questions[Number(idx)];
    return q && ans === q.correct_answer;
  }).length;

  const answeredCount = Object.keys(answers).length;
  const percentageScore = Math.round((correctCount / TOTAL_QUESTIONS) * 100);

  const finishTest = async () => {
    if (finishingTest) return;
    setFinishingTest(true);

    try {
      if (user) {
        await TestResult.create({
          user_email: user.email,
          questions_answered: answeredCount,
          correct_answers: correctCount,
          percentage_score: percentageScore,
          test_date: new Date().toISOString(),
          time_spent: 0,
        });
        await UserEntity.updateMyUserData({
          total_questions_answered: (user.total_questions_answered || 0) + answeredCount,
          best_score: Math.max(user.best_score || 0, percentageScore),
        });
      }
      router.push("/dashboard");
    } catch (error) {
      console.error("Error saving test result:", error);
      setFinishingTest(false);
    }
  };

  if (loading) {
    return (
      <Layout currentPageName="Test">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading your test...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (loadError || questions.length === 0) {
    return (
      <Layout currentPageName="Test">
        <div className="min-h-screen flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="text-center p-8">
              <BookOpen className="w-10 h-10 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load test</h3>
              <p className="text-gray-600 mb-4">{loadError || "No questions available"}</p>
              <Link href={createPageUrl("Dashboard")}>
                <Button>Return to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
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
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="px-3 py-1">
                <Clock className="w-4 h-4 mr-1" /> Question {currentIndex + 1} of {TOTAL_QUESTIONS}
              </Badge>
              <Badge className="bg-blue-100 text-blue-800 px-3 py-1">
                Score: {correctCount}/{TOTAL_QUESTIONS}
              </Badge>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{answeredCount}/{TOTAL_QUESTIONS} answered</span>
            </div>
            <Progress value={(answeredCount / TOTAL_QUESTIONS) * 100} className="h-2" />
          </div>

          {/* Question Card */}
          <Card className="shadow-xl mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Question {currentIndex + 1} of {TOTAL_QUESTIONS}
                </CardTitle>
                {currentQuestion.difficulty && (
                  <Badge className={`${
                    currentQuestion.difficulty === "Easy" ? "bg-green-100 text-green-800" :
                    currentQuestion.difficulty === "Medium" ? "bg-yellow-100 text-yellow-800" :
                    "bg-red-100 text-red-800"
                  } border-0`}>
                    {currentQuestion.difficulty}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-lg text-gray-900 leading-relaxed">
                {currentQuestion.question_text}
              </div>

              {/* Answer Options */}
              <div className="space-y-3">
                {["A", "B", "C", "D"].map((option) => {
                  const answerText = currentQuestion[`option_${option.toLowerCase()}` as keyof Question] as string;
                  const isSelected = selectedAnswer === option;
                  const isCorrectAnswer = showResult && option === currentQuestion.correct_answer;
                  const isWrongAnswer = showResult && isSelected && !isCorrectAnswer;

                  return (
                    <button
                      key={option}
                      onClick={() => !showResult && !submittingAnswer && setSelectedAnswer(option)}
                      disabled={showResult || submittingAnswer}
                      className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-200 ${
                        isSelected
                          ? isCorrectAnswer
                            ? "border-green-500 bg-green-50"
                            : isWrongAnswer
                            ? "border-red-500 bg-red-50"
                            : "border-blue-500 bg-blue-50"
                          : isCorrectAnswer
                          ? "border-green-500 bg-green-50"
                          : (showResult || submittingAnswer)
                          ? "border-gray-200 bg-gray-100 cursor-not-allowed opacity-60"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          isSelected
                            ? isCorrectAnswer
                              ? "bg-green-500 text-white"
                              : isWrongAnswer
                              ? "bg-red-500 text-white"
                              : "bg-blue-500 text-white"
                            : isCorrectAnswer
                            ? "bg-green-500 text-white"
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          {option}
                        </div>
                        <span className="text-gray-900 flex-1">{answerText}</span>
                        {showResult && (
                          <div className="ml-auto">
                            {isCorrectAnswer && <CheckCircle className="w-5 h-5 text-green-500" />}
                            {isWrongAnswer && <XCircle className="w-5 h-5 text-red-500" />}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Submit Button */}
              {!showResult && selectedAnswer && (
                <Button
                  onClick={handleAnswerSubmit}
                  disabled={submittingAnswer}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium"
                >
                  {submittingAnswer ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Answer"
                  )}
                </Button>
              )}

              {/* Result and Explanation */}
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
                  {fetchingExplanation && !aiExplanation && (
                    <Card className="border-blue-200 bg-blue-50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                          <p className="text-sm text-blue-700">Generating AI explanation...</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
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
                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={handleNextQuestion}
                      disabled={finishingTest}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {currentIndex + 1 >= TOTAL_QUESTIONS ? (
                        <>
                          <Flag className="w-4 h-4 mr-2" />
                          Finish Test
                        </>
                      ) : (
                        <>
                          Next Question <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                    {currentIndex + 1 < TOTAL_QUESTIONS && (
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
                          <>
                            <Flag className="w-4 h-4 mr-2" />
                            End Test Early
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  {currentIndex + 1 < TOTAL_QUESTIONS && (
                    <p className="text-xs text-gray-500 text-center">
                      Ending early will score you out of {TOTAL_QUESTIONS} (unanswered count as incorrect)
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Question Navigator */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {questions.map((_, idx) => {
              const isAnswered = idx in answers;
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (idx !== currentIndex) {
                      setCurrentIndex(idx);
                      setSelectedAnswer(answers[idx] || "");
                      setShowResult(idx in answers);
                      setAiExplanation("");
                    }
                  }}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                    isCurrent
                      ? "bg-blue-600 text-white"
                      : isAnswered
                      ? "bg-green-100 text-green-700 border border-green-300 hover:bg-green-200"
                      : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200"
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
}
