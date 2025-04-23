import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Server-side auth check
  const supabase = createClient()
  const { data: { session } } = await (await supabase).auth.getSession()
  
  if (!session) {
    redirect('/auth')
  }
  
  return (
      <div className="min-h-screen flex w-full">
        <main className="flex-1 md:p-12 p-4 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
  )
}