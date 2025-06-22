/* eslint-disable @typescript-eslint/no-explicit-any */

"use client"

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation"; // Mocked for this environment
// Removed Next.js and aliased imports as they are not available in this environment.

// --- MOCK IMPLEMENTATIONS ---
// The following are placeholder implementations to allow the component to run.
// In a real Next.js app, these would be your actual components and modules.

// const useRouter = () => ({
//   push: (path: string) => {
//     console.log(`Navigating to: ${path}`)

//     },
// });

const Link = ({ href, children, className }: { href: string, children: React.ReactNode, className?: string }) => (
  <a href={href} className={className}>{children}</a>
);

const User = {
  me: async () => ({
    email: "student@test.com",
    total_questions_answered: 10,
    best_score: 80,
  }),
  updateMyUserData: async (data: any) => {  
    console.log("Updating user data:", data);
    return Promise.resolve();
  },
};

// const Question = {
//   list: async (sort: string, limit: number) => {
//     console.log(`Fetching ${limit} questions, sorted by ${sort}`);
//     return Promise.resolve([
//       {
//         id: "db_fallback_1",
//         question_id: "db_fallback_1",
//         question_text: "This is a fallback question from the database. What is the capital of France?",
//         option_a: "Berlin",
//         option_b: "Madrid",
//         option_c: "Paris",
//         option_d: "Rome",
//         correct_answer: "C",
//         difficulty: "Easy"
//       }
//     ]);
//   },
// };

const TestResult = {
  create: async (data: any) => {
    console.log("Creating test result:", data);
    return Promise.resolve();
  },
};

// const InvokeLLM = async ({ prompt, response_json_schema }: any) => {
//   console.log("Invoking LLM with prompt:", prompt);
//   return Promise.resolve({
//     explanation: "This is a mock AI explanation. The correct answer is right because it aligns with established medical knowledge. Keep up the great work!",
//   });
// };

const createPageUrl = (pageName: string) => `/${pageName.toLowerCase()}`;

// Mock UI Components from a library like ShadCN/UI
const Button = ({ children, onClick, disabled, className }: any) => <button onClick={onClick} disabled={disabled} className={`p-2 border rounded ${className}`}>{children}</button>;
const Card = ({ children, className }: any) => <div className={`border rounded-lg shadow-md ${className}`}>{children}</div>;
const CardHeader = ({ children }: any) => <div className="p-4 border-b">{children}</div>;
const CardTitle = ({ children }: any) => <h2 className="text-xl font-bold text-black">{children}</h2>;
const CardContent = ({ children }: any) => <div className="p-4 text-black">{children}</div>;
const Progress = ({ value }: any) => <div className="w-full bg-gray-200 rounded-full h-2.5"><div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${value}%` }}></div></div>;
const Badge = ({ children, className }: any) => <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>{children}</span>;
const Alert = ({ children, className }: any) => <div className={`p-4 rounded-md ${className}`}>{children}</div>;
const Layout = ({ children }: any) => <div className="bg-gray-50">{children}</div>;

// Mock Icon Components
const ArrowLeft = () => <span>&larr;</span>;
const CheckCircle = () => <span className="text-green-500">✔</span>;
const XCircle = () => <span className="text-red-500">✖</span>;
const Brain = () => <span>🧠</span>;
const Clock = () => <span>🕒</span>;
const ArrowRight = () => <span>&rarr;</span>;
const BookOpen = () => <span>📖</span>;


// --- COMPONENT LOGIC ---

interface UserProfile {
  email: string;
  total_questions_answered?: number;
  best_score?: number;
}

interface TestSession {
  totalQuestions: number;
  correctAnswers: number;
  startTime: number;
}

export default function Test() {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [aiExplanation, setAiExplanation] = useState("");  
  const [loading, setLoading] = useState(true);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [loadingNextQuestion, setLoadingNextQuestion] = useState(false);
  const [finishingTest, setFinishingTest] = useState(false);
  const [nextButtonDelay, setNextButtonDelay] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [testSession, setTestSession] = useState<TestSession>({
    totalQuestions: 0,
    correctAnswers: 0,
    startTime: Date.now()
  });
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
      console.log("Polling stopped.");
    }
  }, []);

  // Clean up polling on unmount
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  useEffect(() => {
    initializeTest();
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const initializeTest = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser as UserProfile);
      await loadInitialQuestion();
    } catch (error)      {
      console.error("Error initializing test:", error);
    }
  };
  
  const loadInitialQuestion = async () => {
    setLoading(true);
    setShowResult(false);
    setSelectedAnswer("");
    setAiExplanation("");
      const initialQuestion = {
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
    };
    
    setCurrentQuestion({
        ...initialQuestion,
        option_a: initialQuestion.option_a,
        option_b: initialQuestion.option_b,
        option_c: initialQuestion.option_c,
        option_d: initialQuestion.option_d,
    });
    console.log("Loaded hardcoded initial question");
    setLoading(false);
  };
  const handleAnswerSubmit = async () => {
    if (!selectedAnswer || !currentQuestion || submittingAnswer) return;

    // Temporarily disable "Next Question" for 3 seconds
    setNextButtonDelay(true);
    setTimeout(() => setNextButtonDelay(false), 7000);

    setSubmittingAnswer(true);
    const correct = selectedAnswer === currentQuestion.correct_answer;
    
    try {
      // Send webhook to Make.com/n8n
      console.log("Sending answer to webhook...");
      const webhookResponse = await fetch('https://fatimakz.app.n8n.cloud/webhook/345e649d-a1c9-49f8-ab5b-5489e8e4f42b', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.email,
          question_id: currentQuestion.question_id,
          selected_option: selectedAnswer,
          current_difficulty: currentQuestion.difficulty,
          session_id: sessionId,
          is_correct: correct,
          // callback_url: `${window.location.origin}/api/receive-question`
        })
      });
      
      if (!webhookResponse.ok) {
        console.warn('Webhook call failed:', webhookResponse.status);
      } else {
        console.log('Webhook call successful');
      }
    } catch (error) {
      console.error('Webhook submission error:', error);
    }

    // Update UI immediately
    setIsCorrect(correct);
    setShowResult(true);

    // Update test session
    setTestSession(prev => ({
      ...prev,
      totalQuestions: prev.totalQuestions + 1,
      correctAnswers: prev.correctAnswers + (correct ? 1 : 0)
    }));

    // Use explanation from current question if available, otherwise use default
    const explanation = currentQuestion.explanation || 
      "Great job working through this question! The explanation will be provided with future questions.";
    setAiExplanation(explanation);
    
    setSubmittingAnswer(false);
  };
  const handleNextQuestion = async () => {
    if (loadingNextQuestion) return;
    setLoadingNextQuestion(true);

    try {
      // Update user stats first
      if (user) {
        const currentPercentageScore = testSession.totalQuestions > 0 
          ? Math.round((testSession.correctAnswers / testSession.totalQuestions) * 100) 
          : 0;
        await User.updateMyUserData({
          total_questions_answered: (user.total_questions_answered || 0) + 1,
          best_score: Math.max(user.best_score || 0, currentPercentageScore)
        });
        setUser(prev => prev ? ({ 
          ...prev, 
          total_questions_answered: (prev.total_questions_answered || 0) + 1, 
          best_score: Math.max(prev.best_score || 0, currentPercentageScore) 
        }) : null);
      }

      // Reset UI state
      setShowResult(false);
      setSelectedAnswer("");
      setAiExplanation("");

      // Keep trying to get next question from Make.com until success
      if (user?.email && currentQuestion?.question_id || true) {
        console.log("Waiting for next question from Make.com...");
        
        // Poll every 2 seconds until we get a question
       
          try {
            const res = await fetch(`/api/get-next-question`);
            
            if (res.ok) {
              const data = await res.json();              
              if (data.question) {
                console.log("Got next question from Make.com:", data.question);
                setCurrentQuestion(data.question);
                setLoadingNextQuestion(false); // Only stop loading when we get a question
                // Exit the loop when we get a question
              } else {
                console.log("No question available yet, waiting...");
              }
            } else {
              console.log("API returned error status:", res.status, "- retrying...");
            }
          } catch (error) {
            if (error instanceof Error) {
              console.log("API call failed:", error.message, "- retrying...");
            } else {
              console.log("API call failed:", error, "- retrying...");
            }
          }
          
          // Wait 2 seconds before trying again
          await new Promise(resolve => setTimeout(resolve, 2000));
        
      } else {
        throw new Error("Missing user email or current question ID");
      }    } catch (error) {
      console.error("Critical error in handleNextQuestion:", error);
      // Keep loading state active - don't stop the loading
      // User can still click "Finish Test" if needed
    }
    // Only set loading to false when we successfully get a question
    // The loading state will be set to false when setCurrentQuestion is called
    // and the component re-renders with the new question
  };
  
  const finishTest = async () => {
    console.log("Finishing test...");
    if (testSession.totalQuestions === 0 || !user || finishingTest) return;
    console.log("Finishing test with session data:", testSession);
    setFinishingTest(true);
    const percentageScore = Math.round((testSession.correctAnswers / testSession.totalQuestions) * 100);
    const timeSpent = Math.round((Date.now() - testSession.startTime) / 60000);

    try {
      await TestResult.create({
        user_email: user.email,
        questions_answered: testSession.totalQuestions,
        correct_answers: testSession.correctAnswers,
        percentage_score: percentageScore,
        test_date: new Date().toISOString(),
        time_spent: timeSpent
      });
      console.log("Test result created successfully");
      await User.updateMyUserData({
        best_score: Math.max(user.best_score || 0, percentageScore)
      });
      console.log("User data updated successfully");
      router.push('/dashboard');
    } catch (error) {
      console.error("Error saving test result:", error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your question...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!currentQuestion) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="text-center p-8">
              <BookOpen />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No questions available</h3>
              <p className="text-gray-600 mb-4">We&apos;re adding more questions. Please check back later.</p>
              <Link href={createPageUrl("Dashboard")}>
                <Button>Return to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }
  if (loadingNextQuestion) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading next question...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout currentPageName="Test">
      <div className="min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <Link href={createPageUrl("Dashboard")} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft /> Back to Dashboard
            </Link>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="px-3 py-1">
                <Clock /> Question {testSession.totalQuestions + 1}
              </Badge>
              <Badge className="bg-blue-100 text-blue-800 px-3 py-1">
                Score: {testSession.totalQuestions > 0 ? Math.round((testSession.correctAnswers / testSession.totalQuestions) * 100) : 0}%
              </Badge>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{testSession.correctAnswers}/{testSession.totalQuestions} correct</span>
            </div>
            <Progress value={testSession.totalQuestions > 0 ? (testSession.correctAnswers / testSession.totalQuestions) * 100 : 0} className="h-2" />
          </div>

          <Card className="shadow-xl mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{currentQuestion.question_text}</CardTitle>
                {currentQuestion.difficulty && (
                  <Badge className={`${ currentQuestion.difficulty === "Easy" ? "bg-green-100 text-green-800" : currentQuestion.difficulty === "Medium" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800" } border-0`}>
                    {currentQuestion.difficulty}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                 <div className="grid gap-3">
                  {["A", "B", "C", "D"].map((option) => (
                    <button
                      key={option}
                      onClick={() => !showResult && !submittingAnswer && setSelectedAnswer(option)}
                      disabled={showResult || submittingAnswer}
                      className={`text-left p-4 rounded-xl border-2 transition-all duration-200 w-full ${ selectedAnswer === option ? showResult ? option === currentQuestion.correct_answer ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50" : "border-blue-500 bg-blue-50" : showResult && option === currentQuestion.correct_answer ? "border-green-500 bg-green-50" : (showResult || submittingAnswer) ? "border-gray-200 bg-gray-100 cursor-not-allowed opacity-60" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer" }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${ selectedAnswer === option ? showResult ? option === currentQuestion.correct_answer ? "bg-green-500 text-white" : "bg-red-500 text-white" : "bg-blue-500 text-white" : showResult && option === currentQuestion.correct_answer ? "bg-green-500 text-white" : "bg-gray-100 text-gray-600" }`}>
                          {option}
                        </span>
                        <span className="flex-1">
                          {currentQuestion[`option_${option.toLowerCase()}`]}
                        </span>
                        {showResult && (
                          <span className="flex-shrink-0">
                            {option === currentQuestion.correct_answer ? <CheckCircle /> : selectedAnswer === option ? <XCircle /> : null}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {!showResult && selectedAnswer && (
                  <div className="flex justify-center pt-4">
                    <Button onClick={handleAnswerSubmit} disabled={submittingAnswer} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-medium">
                      {submittingAnswer ? "Submitting..." : "Submit Answer"}
                    </Button>
                  </div>
                )}

                {showResult && (
                  <div className="space-y-4 border-t pt-6">
                    <Alert className={`${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                      <div className="flex items-center gap-2">
                        {isCorrect ? <CheckCircle /> : <XCircle />}
                        <span className={`font-semibold ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                          {isCorrect ? 'Correct!' : 'Incorrect'}
                        </span>
                      </div>
                    </Alert>
                    <div className="bg-gray-50 rounded-xl p-6">
                      <div className="flex items-start gap-3 mb-3">
                        <Brain />
                        <h4 className="font-semibold text-gray-900">AI Explanation</h4>
                      </div>
                      <p className="text-gray-700 leading-relaxed">{aiExplanation}</p>                    </div>
                    <div className="flex gap-3 pt-4">
                      <Button onClick={handleNextQuestion} disabled={loadingNextQuestion || nextButtonDelay} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium">
                        {nextButtonDelay ? "Please wait..." : ""}
                        {loadingNextQuestion ? "Loading..." : <>Next Question <ArrowRight /></>}
                      </Button>
                      <Button onClick={finishTest} disabled={finishingTest} variant="outline" className="px-6 rounded-xl font-medium">
                        {finishingTest ? "Finishing..." : "Finish Test"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
