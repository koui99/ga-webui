"use client"

import { Toaster as SonnerToaster } from "sonner"

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      richColors
      toastOptions={{
        unstyled: false,
        classNames: {
          toast: "rounded-xl border border-border bg-card text-card-foreground",
          description: "text-muted-foreground",
          error: "border-[color:var(--destructive)]",
        },
      }}
    />
  )
}
