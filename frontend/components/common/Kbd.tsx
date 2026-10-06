import { cn } from "@/lib/utils";

interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export function Kbd({ children, className, ...props }: KbdProps) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center justify-center rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </kbd>
  );
}
