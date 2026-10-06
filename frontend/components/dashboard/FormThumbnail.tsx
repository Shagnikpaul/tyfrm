"use client";

import { useTheme } from "next-themes";
import { generateThumbnailColor, generateDarkThumbnailColor } from "@/lib/thumbnail";

interface FormThumbnailProps {
  slug: string;
  title: string;
}

export function FormThumbnail({ slug, title }: FormThumbnailProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const bgColor = isDark ? generateDarkThumbnailColor(slug) : generateThumbnailColor(slug);

  return (
    <div
      className="w-full h-32 md:h-40 flex items-center justify-center p-6 text-center select-none rounded-t-lg transition-colors"
      style={{ backgroundColor: bgColor }}
    >
      <span className="font-semibold text-lg md:text-xl text-foreground/80 line-clamp-3">
        {title}
      </span>
    </div>
  );
}
