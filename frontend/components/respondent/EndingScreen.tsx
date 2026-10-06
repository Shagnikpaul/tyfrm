"use client";

import { CheckCircle2 } from "lucide-react";

interface EndingScreenProps {
  title: string;
  message: string | null;
}

export function EndingScreen({ title, message }: EndingScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center w-full animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
      <div className="mb-6 text-success animate-in zoom-in duration-500 delay-150 fill-mode-both">
        <CheckCircle2 className="w-16 h-16" />
      </div>
      
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 leading-tight text-foreground">
        {title}
      </h1>
      
      {message && (
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl whitespace-pre-wrap">
          {message}
        </p>
      )}
    </div>
  );
}
