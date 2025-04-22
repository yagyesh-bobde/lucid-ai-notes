
// Shadcn Sidebar with User Profile (avatar & email), links, and sign out

import React from "react";
import {
  Sidebar, SidebarContent, SidebarHeader, SidebarFooter,
  SidebarGroup, SidebarGroupLabel, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuthProfile } from "@/hooks/useAuthProfile";
import { LogOut, StickyNote, Brush } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";

export function AppSidebar() {
  const { user, profile, signOut } = useAuthProfile();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Sidebar>
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
          <SidebarGroupLabel>Have fun</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === "/dashboard"}
                >
                  <a href="/dashboard">
                    <StickyNote className="mr-2" />
                    Notes
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === "/canvas"}
                >
                  <a href="/canvas">
                    <Brush className="mr-2" />
                    Canvas
                  </a>
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
          onClick={signOut}
          aria-label="Sign Out"
        >
          <LogOut className="mr-2 w-4 h-4" />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
