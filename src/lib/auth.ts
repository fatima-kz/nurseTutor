import { createClient } from './supabase/server'
import { redirect } from 'next/navigation'

export async function getSession() {
  const supabase = await createClient()
  
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    
    return session
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

export async function getUser() {
  const supabase = await createClient()
  
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    
    return user
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

export async function requireAuth() {
  const user = await getUser()
  
  if (!user) {
    redirect('/auth')
  }
  
  return user
}

export async function requireGuest() {
  const user = await getUser()
  
  if (user) {
    redirect('/dashboard')
  }
} 