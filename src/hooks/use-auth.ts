"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

// Key for auth user in TanStack Query
export const authKeys = {
  user: () => ['auth', 'user'] as const,
  profile: () => ['auth', 'profile'] as const,
  session: () => ['auth', 'session'] as const,
}

// Hook to get the current user
export function useUser() {
  const supabase = createClient()
  
  return useQuery({
    queryKey: authKeys.user(),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      return user
    },
  })
}

// Hook to get the user profile
export function useProfile() {
  const supabase = createClient()
  const { data: user } = useUser()
  
  return useQuery({
    queryKey: authKeys.profile(),
    queryFn: async () => {
      if (!user?.id) return null
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
      
      if (error) {
        console.error("Error fetching profile:", error)
        return null
      }
      
      return data
    },
    enabled: !!user?.id,
  })
}

// Hook to get the auth session
export function useSession() {
  const supabase = createClient()
  
  return useQuery({
    queryKey: authKeys.session(),
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      return session
    },
  })
}

// Hook to handle auth state
export function useAuth() {
  const router = useRouter()
  const supabase = createClient()
  const [isInitialized, setIsInitialized] = useState(false)
  const { data: session, isLoading } = useSession()
  
  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // Handle auth state changes
        if (!session && !isLoading && isInitialized) {
          // Redirect to auth page if signed out
          router.push('/auth')
        }
      }
    )
    
    setIsInitialized(true)
    
    // Cleanup subscription
    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router, isLoading, isInitialized])
  
  // Sign out function
  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }
  
  return {
    session,
    isLoading,
    isInitialized,
    isAuthenticated: !!session,
    signOut,
  }
}