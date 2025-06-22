"use client"

import React, { useState, useEffect, useCallback } from "react"
import { User } from "@supabase/supabase-js"
import { UserProfile } from "@/entities/User"
import { TestResult, ITestResult } from "@/entities/TestResult"
import { createPageUrl } from "@/lib/utils"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import CheckoutButton from "@/components/CheckoutButton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  PlayCircle,
  TrendingUp,
  Calendar,
  Award,
  BookOpen,
  Target,
  CheckCircle
} from "lucide-react"
import { format } from "date-fns"
import Layout from "@/components/Layout"
import LoadingSpinner from "@/components/LoadingSpinner"

// Define the type for your test results based on what TestResult.filter returns
interface TestResultDisplay {
  id: string
  test_date: string // Assuming ISO string from your backend
  percentage_score: number
  correct_answers: number
  questions_answered: number
  time_spent: number
  user_email: string // Add if it's part of the TestResult object
}

interface DashboardContentProps {
  user: User
  initialUserProfile?: UserProfile | null
  initialTestResults?: TestResultDisplay[]
}

const getSubscriptionBadge = (user: UserProfile | null) => {
  if (!user) return null

  const status = user.subscription_status || "trial"
  const colors: { [key: string]: string } = {
    trial: "bg-yellow-100 text-yellow-800",
    active: "bg-green-100 text-green-800",
    expired: "bg-red-100 text-red-800",
  }

  return (
    <Badge className={`${colors[status]} border-0 font-medium`}>
      {status === "trial" ? "Free Trial" : status === "active" ? "Premium" : "Expired"}
    </Badge>
  )
}

const calculateAverageScore = (testHistory: TestResultDisplay[]) => {
  if (testHistory.length === 0) return 0
  const sum = testHistory.reduce((acc, test) => acc + test.percentage_score, 0)
  return Math.round(sum / testHistory.length)
}

export default function DashboardContent({ 
  user, 
  initialUserProfile = null, 
  initialTestResults = [] 
}: DashboardContentProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(initialUserProfile)
  const [testHistory, setTestHistory] = useState<TestResultDisplay[]>(initialTestResults)
  const [dataLoading, setDataLoading] = useState(!initialUserProfile || !initialTestResults.length)

  const loadDashboardData = useCallback(async () => {
    if (!user?.email || (initialUserProfile && initialTestResults.length > 0)) return

    try {
      // Only load data if we don't have initial data
      if (!initialUserProfile) {
        const { User } = await import('@/entities/User')
        const profile = await User.me()
        setUserProfile(profile)
      }

      if (!initialTestResults.length) {
        const rawResults = await TestResult.filter(
          { user_email: user.email },
          "-test_date",
          10
        )
        const results: TestResultDisplay[] = rawResults.map((test: ITestResult) => ({
          ...test,
          time_spent: test.time_spent ?? 0,
        }))
        setTestHistory(results)
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error)
      // Continue with empty data
    } finally {
      setDataLoading(false)
    }
  }, [user?.email, initialUserProfile, initialTestResults])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  // If we have initial data, don't show loading
  if (dataLoading && !initialUserProfile) {
    return (
      <Layout>
        <LoadingSpinner size="lg" className="min-h-screen" />
      </Layout>
    )
  }

  if (!userProfile) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile not found</h2>
            <p className="text-gray-600">Please try refreshing the page.</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout currentPageName="Dashboard">
      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  Welcome back, {userProfile.full_name?.split(' ')[0] || user.user_metadata?.full_name?.split(' ')[0] || 'Student'} 👋
                </h1>
                <p className="text-gray-600 text-lg">
                  Ready to continue your nursing exam preparation?
                </p>
              </div>
              <div className="flex items-center gap-3">
                {getSubscriptionBadge(userProfile)}
                <Link href={createPageUrl("Test")}>
                  <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-2">
                    <PlayCircle className="w-5 h-5" />
                    Start Test
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm font-medium">Total Questions</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {userProfile.total_questions_answered || 0}
                    </p>
                  </div>
                  <BookOpen className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-medium">Best Score</p>
                    <p className="text-2xl font-bold text-green-900">
                      {userProfile.best_score || 0}%
                    </p>
                  </div>
                  <Award className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 text-sm font-medium">Average Score</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {calculateAverageScore(testHistory)}%
                    </p>
                  </div>
                  <Target className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-600 text-sm font-medium">Tests Taken</p>
                    <p className="text-2xl font-bold text-orange-900">
                      {testHistory.length}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Test History */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Recent Test Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {testHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">No tests taken yet</p>
                      <Link href={createPageUrl("Test")}>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                          Take Your First Test
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Questions</TableHead>
                          <TableHead>Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {testHistory.map((test) => (
                          <TableRow key={test.id}>
                            <TableCell>
                              {format(new Date(test.test_date), 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{test.percentage_score}%</span>
                                <Progress value={test.percentage_score} className="w-16" />
                              </div>
                            </TableCell>
                            <TableCell>
                              {test.correct_answers}/{test.questions_answered}
                            </TableCell>
                            <TableCell>
                              {test.time_spent ? `${Math.round(test.time_spent / 60)}m` : 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Subscription Status */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Subscription Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    {getSubscriptionBadge(userProfile)}
                  </div>
                  
                  {userProfile.subscription_status === 'trial' && userProfile.subscription_end_date && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800 mb-2">
                        Trial ends on {format(new Date(userProfile.subscription_end_date), 'MMM dd, yyyy')}
                      </p>
                      <CheckoutButton
                        userEmail={userProfile.email}
                        userId={userProfile.id}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm"
                      />
                    </div>
                  )}

                  {userProfile.subscription_status === 'active' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-green-800">
                        Premium subscription active
                      </p>
                    </div>
                  )}

                  {userProfile.subscription_status === 'expired' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-800 mb-2">
                        Subscription expired
                      </p>
                      <CheckoutButton />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}