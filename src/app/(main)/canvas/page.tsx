"use client"

import React from "react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function CanvasPage() {
  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Canvas</h2>
        <ThemeToggle />
      </div>
      
      {/* Canvas content area */}
      <div className="w-full h-[calc(100vh-10rem)] bg-background border border-border rounded-lg overflow-hidden">
        {/* Canvas implementation goes here - placeholder for now */}
        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
          Canvas tool will be implemented here
        </div>
      </div>
    </>
  )
}