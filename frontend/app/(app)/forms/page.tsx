import { Suspense } from "react"
import { FormsClient } from "./FormsClient"

export default function FormsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center p-8 text-muted-foreground">
          Loading forms...
        </div>
      }
    >
      <FormsClient />
    </Suspense>
  )
}
