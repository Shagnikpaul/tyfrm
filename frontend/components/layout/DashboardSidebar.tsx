"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { FileText, LayoutTemplate, Users, Puzzle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface DashboardSidebarProps {
  onStatusChange: (status: string | undefined) => void;
}

export function DashboardSidebar({ onStatusChange }: DashboardSidebarProps) {
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status") || "all";

  const navItems = [
    { id: "all", label: "All forms", value: undefined },
    { id: "draft", label: "Drafts", value: "draft" },
    { id: "published", label: "Published", value: "published" },
  ];

  return (
    <div className="flex flex-col w-64 border-r border-border bg-surface h-full">
      <div className="p-4 md:p-6 border-b border-border flex items-center justify-between">
        <Link href="/forms" className="font-semibold text-lg flex items-center gap-2">
          <div className="w-6 h-6 bg-foreground rounded-md flex items-center justify-center">
            <span className="text-background text-xs font-bold">T</span>
          </div>
          Workspace
        </Link>
      </div>

      <div className="p-3 md:p-4 flex flex-col gap-1 flex-1">
        <div className="text-xs font-medium text-muted-foreground mb-2 px-3 uppercase tracking-wider">
          Forms
        </div>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onStatusChange(item.value)}
            className={cn(
              "flex items-center w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
              currentStatus === item.id || (item.id === "all" && !searchParams.has("status"))
                ? "bg-foreground/5 text-foreground font-medium"
                : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
            )}
          >
            <FileText className="mr-3 h-4 w-4" />
            {item.label}
          </button>
        ))}

        <div className="mt-8 mb-2">
          <div className="text-xs font-medium text-muted-foreground px-3 uppercase tracking-wider flex items-center justify-between">
            Coming soon
          </div>
        </div>

        <Tooltip>
          <TooltipTrigger>
            <div className="flex items-center px-3 py-2 text-sm text-muted-foreground/60 cursor-not-allowed">
              <LayoutTemplate className="mr-3 h-4 w-4" />
              Templates
            </div>
          </TooltipTrigger>
          <TooltipContent>Coming soon</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger>
            <div className="flex items-center px-3 py-2 text-sm text-muted-foreground/60 cursor-not-allowed">
              <Users className="mr-3 h-4 w-4" />
              Team
            </div>
          </TooltipTrigger>
          <TooltipContent>Coming soon</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger>
            <div className="flex items-center px-3 py-2 text-sm text-muted-foreground/60 cursor-not-allowed">
              <Puzzle className="mr-3 h-4 w-4" />
              Integrations
            </div>
          </TooltipTrigger>
          <TooltipContent>Coming soon</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
