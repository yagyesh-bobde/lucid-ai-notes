// src/app/(auth)/auth/page.tsx
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthForm } from "@/components/auth/auth-form"

// Auth page - handles login/signup
export default async function AuthPage() {
  // Server-side auth check
  const supabase = createClient()
  const { data: { session } } = await (await supabase).auth.getSession()
  
  // If already logged in, redirect to dashboard
  if (session) {
    redirect('/dashboard')
  }
  
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-3xl font-bold text-center">LucidNote</CardTitle>
        <CardDescription className="text-center">
          Sign in or create an account to continue
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AuthForm />
      </CardContent>
    </Card>
  )
}