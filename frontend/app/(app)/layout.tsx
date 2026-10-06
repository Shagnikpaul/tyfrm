"use client";

import { ReactNode } from "react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { User } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleStatusChange = (status: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status) {
      params.set("status", status);
    } else {
      params.delete("status");
    }
    // Maintain other params like search and sort
    router.push(`/forms?${params.toString()}`);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <DashboardSidebar onStatusChange={handleStatusChange} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top bar */}
        <header className="h-14 md:h-16 border-b border-border flex items-center justify-between px-4 md:px-8 bg-background flex-shrink-0">
          <div className="flex items-center md:hidden">
            <Sheet>
              <SheetTrigger render={<Button variant="ghost" size="icon" className="mr-2" />}>
                <Menu className="h-5 w-5" />
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <DashboardSidebar onStatusChange={handleStatusChange} />
              </SheetContent>
            </Sheet>
            <div className="font-semibold flex items-center gap-2">
              <div className="w-6 h-6 bg-foreground rounded-md flex items-center justify-center">
                <span className="text-background text-xs font-bold">T</span>
              </div>
              Workspace
            </div>
          </div>
          <div className="hidden md:block"></div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-border overflow-hidden">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
