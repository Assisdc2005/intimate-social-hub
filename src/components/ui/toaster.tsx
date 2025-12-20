import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastDescription,
  ToastProvider,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, username, avatarUrl, onClick, ...props }: any) {
        const name = typeof username === "string" ? username.replace(/^@/, "") : undefined
        const initial = name?.[0]?.toUpperCase() || "U"

        return (
          <Toast
            key={id}
            {...props}
            onClick={onClick}
            className="pointer-events-auto bg-transparent border-none shadow-none p-0"
          >
            <div className="w-[calc(100%-24px)] mx-3 my-3">
              <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-black/85 via-slate-900/90 to-black/85 shadow-xl px-4 py-3 active:scale-[0.98] transition-transform duration-150">
                <div className="relative h-11 w-11 flex-shrink-0 rounded-full bg-gradient-to-br from-primary to-pink-500 p-[2px]">
                  <div className="h-full w-full rounded-full bg-background overflow-hidden flex items-center justify-center text-xs font-semibold text-white">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl as string}
                        alt={name || "avatar"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>{initial}</span>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[11px] uppercase tracking-wide text-white/60 leading-tight">
                    Nova mensagem
                  </p>
                  {name && (
                    <p className="text-sm font-semibold text-white leading-tight truncate">
                      @{name}
                    </p>
                  )}
                  {description && (
                    <ToastDescription className="mt-0.5 text-xs text-white/85 leading-snug truncate">
                      {description}
                    </ToastDescription>
                  )}
                </div>
              </div>
            </div>
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
