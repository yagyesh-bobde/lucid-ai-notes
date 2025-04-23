// src/components/layout/sidebar.tsx
"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogOut, StickyNote, Brush } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sidebar as SidebarComponent,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger
} from "@/components/ui/sidebar"
import { signOut } from "@/lib/supabase/actions"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"

interface Profile {
  username: string | null
  avatar_url: string | null
}

// Sidebar component with navigation and user profile
export function AppSidebar() {
  const pathname = usePathname()
  const [user, setUser] = useState<any | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isSigningOut, setIsSigningOut] = useState(false)

  // Fetch user and profile info
  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const supabase = createClient()
      
      // Get user session
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        
        // Fetch profile data if user is authenticated
        const { data } = await supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", session.user.id)
          .single()
        
        setProfile(data)
      }
    }
    
    fetchUserAndProfile()
  }, [])

  // Handle sign out
  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut()
    } catch (error) {
      console.error("Error signing out:", error)
      setIsSigningOut(false)
    }
  }

  return (
    <SidebarComponent variant="inset" collapsible="icon">
      <SidebarHeader>
        <div className="flex flex-col justify-center items-center py-6">
          <img
            src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.username || user?.email || "U"}`}
            alt="avatar"
            className="w-16 h-16 rounded-full object-cover mb-2 border-2 border-primary animate-float-bubble"
          />
          <span className="font-semibold truncate max-w-[160px]">{profile?.username || user?.email}</span>
          <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard"}
                  tooltip="Notes"
                >
                  <Link href="/dashboard">
                    <StickyNote className="mr-2" />
                    Notes
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/canvas"}
                  tooltip="Canvas"
                >
                  <Link href="/canvas">
                    <Brush className="mr-2" />
                    Canvas
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="flex flex-col gap-2 mb-2">
        <Button
          variant="destructive"
          className="w-full"
          onClick={handleSignOut}
          disabled={isSigningOut}
          aria-label="Sign Out"
        >
          <LogOut className="mr-2 w-4 h-4" />
          {isSigningOut ? "Signing out..." : "Sign Out"}
        </Button>
      </SidebarFooter>
    </SidebarComponent>
  )
}