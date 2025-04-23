"use client"
import { useEffect, useState } from "react"

/**
 * Hook to detect if the current device is a mobile device based on screen width
 * @param breakpoint The breakpoint in pixels to consider a device as mobile (default: 768px)
 * @returns A boolean indicating if the current device is a mobile device
 */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false)

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === "undefined") {
      return
    }

    // Function to update the state based on window width
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }

    // Initial check
    checkIsMobile()

    // Add event listener for window resize
    window.addEventListener("resize", checkIsMobile)

    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener("resize", checkIsMobile)
    }
  }, [breakpoint])

  return isMobile
}