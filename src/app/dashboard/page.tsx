import { requireAuth } from '@/lib/auth'
import { User } from '@/entities/User'
import { TestResult, ITestResult } from '@/entities/TestResult'
import DashboardContent from './DashboardContent'
import { Suspense } from 'react'
import LoadingSpinner from '@/components/LoadingSpinner'

// Enable static generation with revalidation
export const revalidate = 60 // Revalidate every 60 seconds

async function getDashboardData(userEmail: string) {
  try {
    // Fetch user profile and test results in parallel
    const [userProfile, testResults] = await Promise.all([
      User.me(),
      TestResult.filter({ user_email: userEmail }, "-test_date", 10)
    ])

    return {
      userProfile,
      testResults: testResults.map((test: ITestResult) => ({
        ...test,
        time_spent: test.time_spent ?? 0,
      }))
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return {
      userProfile: null,
      testResults: []
    }
  }
}

export default async function DashboardPage() {
  // This will redirect to /auth if user is not authenticated
  const user = await requireAuth()
  
  // Fetch data server-side for better performance
  const { userProfile, testResults } = await getDashboardData(user.email!)

  return (
    <Suspense fallback={<LoadingSpinner size="lg" className="min-h-screen" />}>
      <DashboardContent 
        user={user} 
        initialUserProfile={userProfile}
        initialTestResults={testResults}
      />
    </Suspense>
  )
}
