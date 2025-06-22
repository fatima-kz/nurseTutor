import { useState, useEffect, useCallback, useMemo } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/entities/User'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const loading = false // Static value since we handle auth on server
  
  const supabase = useMemo(() => createClient(), [])

  const fetchUserProfile = useCallback(async () => {
    if (!user) return
    
    try {
      const { User } = await import('@/entities/User')
      const profile = await User.me()
      setUserProfile(profile)
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      setUserProfile(null)
    }
  }, [user])

  useEffect(() => {
    // Only listen for auth changes, initial session is handled by server
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Only log significant auth events in development
        if (event !== 'INITIAL_SESSION' && process.env.NODE_ENV === 'development') {
          console.log('Auth state changed:', event, session?.user?.email)
        }
        
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchUserProfile()
        } else {
          setUserProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, fetchUserProfile])

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error)
      } else {
        setUser(null)
        setUserProfile(null)
        // Force a page reload to clear any cached state
        window.location.href = '/auth'
      }
    } catch (error) {
      console.error('Error during sign out:', error)
    }
  }, [supabase])

  const isAuthenticated = useMemo(() => !!user, [user])

  return {
    user,
    userProfile,
    loading,
    signOut,
    isAuthenticated
  }
} 