"use client"

import { useTheme } from "next-themes"
import {
  generateThumbnailColor,
  generateDarkThumbnailColor,
} from "@/lib/thumbnail"

interface FormThumbnailProps {
  slug: string
  title: string
}

export function FormThumbnail({ slug, title }: FormThumbnailProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const bgColor = isDark
    ? generateDarkThumbnailColor(slug)
    : generateThumbnailColor(slug)

  return (
    <div
      className="flex h-32 w-full items-center justify-center rounded-t-lg p-6 text-center transition-colors select-none md:h-40"
      style={{ backgroundColor: bgColor }}
    >
      <span className="line-clamp-3 text-lg font-semibold text-foreground/80 md:text-xl">
        {title}
      </span>
    </div>
  )
}
