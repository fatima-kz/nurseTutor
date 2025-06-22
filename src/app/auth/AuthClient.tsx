"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, User as UserIcon, Loader2 } from "lucide-react"
import Layout from "@/components/Layout"
import { createClient } from '@/lib/supabase/client'

export default function AuthClient() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleGoogleAuth = async () => {
    setIsLoading(true)
    setError("")
    
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        },
      })

      if (error) {
        console.error("OAuth error:", error)
        setError("Failed to start authentication. Please try again.")
        setIsLoading(false)
        return
      }

      // If we get a URL, redirect to it
      if (data?.url) {
        window.location.href = data.url
      } else {
        setError("No redirect URL received. Please try again.")
        setIsLoading(false)
      }
    } catch (error) {
      console.error("OAuth initiation error:", error)
      setError("Failed to start authentication. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <Layout currentPageName="Auth">
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-2xl">N</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Welcome to NurseID</h2>
            <p className="mt-2 text-gray-600">Your journey to nursing excellence starts here</p>
          </div>

          <Card className="bg-white/80 backdrop-blur-sm shadow-2xl border-0">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl text-center font-bold text-gray-900">
                Get Started Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login" className="text-sm font-medium">
                    Login
                  </TabsTrigger>
                  <TabsTrigger value="register" className="text-sm font-medium">
                    Register
                  </TabsTrigger>
                </TabsList>

                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <TabsContent value="login" className="space-y-4">
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 text-center mb-4">
                      Sign in with your Google account to access your dashboard
                    </p>
                    
                    <Button
                      onClick={handleGoogleAuth}
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Continue with Google
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="register" className="space-y-4">
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 text-center mb-4">
                      Create your account and start your 7-day free trial
                    </p>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                      <h4 className="font-semibold text-blue-900 mb-2">What you get:</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• 7-day free trial</li>
                        <li>• Access to 1000+ practice questions</li>
                        <li>• AI-powered explanations</li>
                        <li>• Progress tracking</li>
                      </ul>
                    </div>
                    
                    <Button
                      onClick={handleGoogleAuth}
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        <>
                          <UserIcon className="mr-2 h-4 w-4" />
                          Sign up with Google
                        </>
                      )}
                    </Button>
                    
                    <p className="text-xs text-gray-500 text-center mt-4">
                      By signing up, you agree to our Terms of Service and Privacy Policy
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  )
} 