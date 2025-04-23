"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, StickyNote, Brush, ChevronDown, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotes } from "@/hooks/use-notes";
import { useUser, useProfile, useAuth } from "@/hooks/use-auth";

// Add to imports
import { Book } from "lucide-react";

export function MainSidebar() {
  const pathname = usePathname();
  const { data: user, isLoading: isUserLoading } = useUser();
  const { data: profile, isLoading: isProfileLoading } = useProfile();
  const { data: notes = [], isLoading: isNotesLoading } = useNotes();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { signOut } = useAuth();

  // Get 5 most recent notes
  const recentNotes = notes.slice(0, 5);

  // Handle sign out
  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
      setIsSigningOut(false);
    }
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (profile?.username) {
      return profile.username.substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "UN";
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <Sidebar className="hidden lg:flex lg:w-[225px]">
        <SidebarHeader>
          <div className="flex flex-col items-center py-6 px-2">
            <Avatar className="h-16 w-16 mb-2">
              <AvatarImage src={profile?.avatar_url || ""} />
              <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                {isUserLoading || isProfileLoading ? (
                  <Skeleton className="h-full w-full rounded-full" />
                ) : (
                  getUserInitials()
                )}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              {isUserLoading || isProfileLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24 mx-auto" />
                  <Skeleton className="h-3 w-32 mx-auto" />
                </div>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                    {user?.email || ""}
                  </p>
                </>
              )}
            </div>
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
                      <StickyNote className="mr-2 h-4 w-4" />
                      Notes
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {/* <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/canvas"}
                  tooltip="Canvas"
                >
                  <Link href="/canvas">
                    <Brush className="mr-2 h-4 w-4" />
                    Canvas
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem> */}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/study"}
                    tooltip="Study"
                  >
                    <Link href="/study">
                      <Book className="mr-2 h-4 w-4" />
                      Study
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Recent Notes</SidebarGroupLabel>
            <SidebarGroupContent>
              <Accordion
                defaultValue="recent-notes"
                type="single"
                collapsible
                className="w-full"
              >
                <AccordionItem value="recent-notes" className="border-none">
                  <AccordionTrigger
                    defaultChecked
                    className="py-2 px-2 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md"
                  >
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4" />
                      Recent Notes
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {isNotesLoading ? (
                      <div className="space-y-2 px-2 py-1">
                        {[...Array(3)].map((_, i) => (
                          <Skeleton key={i} className="h-8 w-full" />
                        ))}
                      </div>
                    ) : recentNotes.length > 0 ? (
                      <div className="space-y-1 px-2 py-1 pl-6 text-sidebar-foreground/80">
                        {recentNotes.map((note) => (
                          <Link
                            key={note.id}
                            href={`/dashboard?note=${note.id}`}
                            className="block text-sm py-1.5 px-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground truncate"
                          >
                            {note.title}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground px-4 py-2">
                        No recent notes found
                      </p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-4">
          <Button
            className="w-full cursor-pointer"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {isSigningOut ? "Signing out..." : "Sign Out"}
          </Button>
        </SidebarFooter>
      </Sidebar>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t bg-background z-50">
        <div className="flex items-center justify-around p-2">
          {/* Notes */}
          <Link
            href="/dashboard"
            className={`flex flex-col items-center p-2 ${
              pathname === "/dashboard"
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          >
            <StickyNote className="h-5 w-5" />
            <span className="text-xs mt-1">Notes</span>
          </Link>

          {/* Study */}
          <Link
            href="/study"
            className={`flex flex-col items-center p-2 ${
              pathname === "/study" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Book className="h-5 w-5" />
            <span className="text-xs mt-1">Study</span>
          </Link>

          {/* User Avatar */}
          <div className="relative">
            <button
              onClick={() => handleSignOut()}
              className="flex flex-col items-center p-2"
              disabled={isSigningOut}
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="text-xs">
                  {isUserLoading || isProfileLoading ? (
                    <Skeleton className="h-full w-full rounded-full" />
                  ) : (
                    getUserInitials()
                  )}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs mt-1 text-muted-foreground">
                {isSigningOut ? "..." : "Sign Out"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Add padding to main content to account for bottom navigation */}
      <style jsx global>{`
        @media (max-width: 1024px) {
          main {
            padding-bottom: 4rem !important;
          }
        }
      `}</style>
    </>
  );
}
