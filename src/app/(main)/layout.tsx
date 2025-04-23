import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SidebarProvider } from '@/components/ui/sidebar'
import { MainSidebar } from '@/components/layout/Sidebar'

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
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <MainSidebar />
        <main className="flex-1 md:p-12 p-4 md:pl-54 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}