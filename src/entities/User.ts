// import { createClient } from '@/lib/supabase'

// export interface UserProfile {
//   id: string
//   email: string
//   full_name: string
//   registration_date?: string
//   subscription_status?: 'trial' | 'active' | 'expired'
//   subscription_end_date?: string
//   total_questions_answered?: number
//   best_score?: number
//   created_at?: string
//   updated_at?: string
// }

// export class User {  static async login() {
//     const supabase = createClient()
//     const { data, error } = await supabase.auth.signInWithOAuth({
//       provider: 'google',
//       options: {
//         redirectTo: `${window.location.origin}/auth/callback`
//       }
//     })
    
//     if (error) throw error
//     return data
//   }
//   static async logout() {
//     const supabase = createClient()
//     const { error } = await supabase.auth.signOut()
//     if (error) throw error
//   }
//   static async me(): Promise<UserProfile> {
//     const supabase = createClient()
//     const { data: { user }, error: authError } = await supabase.auth.getUser()
    
//     if (authError || !user) {
//       throw new Error('Not authenticated')
//     }

//     // Get or create user profile
//     let { data: profile, error } = await supabase
//       .from('users')
//       .select('*')
//       .eq('id', user.id)
//       .single()

//     if (error && error.code === 'PGRST116') {
//       // User doesn't exist, create profile
//       const newProfile = {
//         id: user.id,
//         email: user.email!,
//         full_name: user.user_metadata?.full_name || user.email!,
//         registration_date: new Date().toISOString().split('T')[0],
//         subscription_status: 'trial' as const,
//         subscription_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
//         total_questions_answered: 0,
//         best_score: 0
//       }

//       const { data: createdProfile, error: createError } = await supabase
//         .from('users')
//         .insert(newProfile)
//         .select()
//         .single()

//       if (createError) throw createError
//       profile = createdProfile
//     } else if (error) {
//       throw error
//     }

//     return profile
//   }
//   static async updateMyUserData(updates: Partial<UserProfile>) {
//     const supabase = createClient()
//     const { data: { user }, error: authError } = await supabase.auth.getUser()
    
//     if (authError || !user) {
//       throw new Error('Not authenticated')
//     }

//     const { data, error } = await supabase
//       .from('users')
//       .update(updates)
//       .eq('id', user.id)
//       .select()
//       .single()

//     if (error) throw error
//     return data
//   }
// }

import { createClient } from '@/lib/supabase/client'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  registration_date?: string
  subscription_status?: 'trial' | 'active' | 'expired'
  subscription_end_date?: string
  total_questions_answered?: number
  best_score?: number
  created_at?: string
  updated_at?: string
}

export class User { 
  static async login() {
    const supabase = createClient()
    console.log("Redirecting to Google OAuth for login...");
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback`
      }
    })
    console.log("OAuth initiated, waiting for callback...");
    
    if (error) throw error
    return data
  }

  static async logout() {
    const supabase = createClient()
    console.log("Logging out user...");
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }  
  
  static async me(): Promise<UserProfile> {
    const supabase = createClient();

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error("Authentication error or user not found:", authError);
        throw new Error("Not authenticated");
      }

      const { data: profile, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error && error.code === "PGRST116") {
        const newProfile = {
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || user.email!,
          registration_date: new Date().toISOString().split("T")[0],
          subscription_status: "trial" as const,
          subscription_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          total_questions_answered: 0,
          best_score: 0,
        };

        const { data: createdProfile, error: createError } = await supabase
          .from("users")
          .insert(newProfile)
          .select()
          .single();

        if (createError) {
          console.error("Error creating user profile:", createError);
          throw createError;
        }

        return createdProfile as UserProfile;
      } else if (error) {
        console.error("Error fetching user profile:", error);
        throw error;
      }

      if (!profile) {
        throw new Error("User profile could not be loaded or created.");
      }

      return profile as UserProfile;
    } catch (err) {
      console.error("Unexpected error in User.me():", err);
      throw err;
    }
  }

  static async updateMyUserData(updates: Partial<UserProfile>) {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Not authenticated')
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error
    return data
  }
}