"use client"

import { ReactNode } from "react"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { User } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { DashboardSidebar } from "@/components/layout/DashboardSidebar"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleStatusChange = (status: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString())
    if (status) {
      params.set("status", status)
    } else {
      params.delete("status")
    }
    // Maintain other params like search and sort
    router.push(`/forms?${params.toString()}`)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <DashboardSidebar onStatusChange={handleStatusChange} />
      </div>

      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-border bg-background px-4 md:h-16 md:px-8">
          <div className="flex items-center md:hidden">
            <Sheet>
              <SheetTrigger
                render={<Button variant="ghost" size="icon" className="mr-2" />}
              >
                <Menu className="h-5 w-5" />
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <DashboardSidebar onStatusChange={handleStatusChange} />
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2 font-semibold">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground">
                <span className="text-xs font-bold text-background">T</span>
              </div>
              Workspace
            </div>
          </div>
          <div className="hidden md:block"></div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
