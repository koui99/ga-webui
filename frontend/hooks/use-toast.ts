import { toast as sonnerToast } from "sonner"

type ToastVariant = "default" | "destructive"

interface ToastOptions {
  title?: string
  description?: string
  variant?: ToastVariant
}

export function useToast() {
  return {
    toast: ({ title, description, variant = "default" }: ToastOptions) => {
      const message = title ?? description ?? ""
      const detail = title && description ? description : undefined

      if (variant === "destructive") {
        sonnerToast.error(message, detail ? { description: detail } : undefined)
        return
      }

      sonnerToast(message, detail ? { description: detail } : undefined)
    },
  }
}
