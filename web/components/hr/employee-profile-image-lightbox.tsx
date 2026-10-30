"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { IconUser, IconX } from "@tabler/icons-react"
import { Dialog, DialogPortal, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getImageUrl } from "@/lib/utils"

type Props = {
  imageUrl?: string | null
  name: string
  subtitle?: string
  className?: string
  avatarClassName?: string
}

export function EmployeeProfileImageLightbox({
  imageUrl,
  name,
  subtitle,
  className,
  avatarClassName,
}: Props) {
  const [open, setOpen] = React.useState(false)
  const resolvedUrl = imageUrl ? getImageUrl(imageUrl) : null
  const canPreview = Boolean(resolvedUrl)

  return (
    <>
      <button
        type="button"
        disabled={!canPreview}
        aria-label={canPreview ? `View profile photo of ${name}` : undefined}
        onClick={() => canPreview && setOpen(true)}
        className={cn(
          "group h-32 w-32 rounded-2xl bg-white p-1.5 shadow-lg ring-4 ring-white transition-shadow",
          canPreview && "cursor-zoom-in hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40",
          !canPreview && "cursor-default",
          className,
        )}
      >
        <div
          className={cn(
            "h-full w-full bg-muted flex items-center justify-center rounded-xl overflow-hidden",
            avatarClassName,
          )}
        >
          {resolvedUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolvedUrl}
              alt={name}
              className={cn(
                "h-full w-full object-cover transition-transform duration-300 ease-out",
                canPreview && "group-hover:scale-[1.03]",
              )}
            />
          ) : (
            <IconUser className="h-16 w-16 text-muted-foreground/30" />
          )}
        </div>
      </button>

      {canPreview ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogPortal>
            <DialogPrimitive.Overlay
              className={cn(
                "fixed inset-0 z-50 bg-black/80 backdrop-blur-sm",
                "data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
                "duration-300",
              )}
            />
            <DialogPrimitive.Content
              className={cn(
                "fixed top-1/2 left-1/2 z-50 w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 px-4 outline-none",
                "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-90 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-90",
                "duration-300 ease-out",
              )}
              onClick={() => setOpen(false)}
            >
              <DialogTitle className="sr-only">{name} profile photo</DialogTitle>
              <div
                className="flex flex-col items-center gap-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative w-full overflow-hidden rounded-2xl bg-black/40 shadow-2xl ring-1 ring-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resolvedUrl!}
                    alt={name}
                    className="mx-auto max-h-[min(78vh,720px)] w-full object-contain animate-in zoom-in-95 fade-in duration-300 ease-out"
                  />
                </div>
                <div className="text-center text-white">
                  <p className="text-lg font-semibold tracking-tight">{name}</p>
                  {subtitle ? (
                    <p className="text-sm text-white/70 mt-0.5">{subtitle}</p>
                  ) : null}
                </div>
                <DialogPrimitive.Close asChild>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="gap-2 bg-white/10 text-white hover:bg-white/20 border-white/20"
                  >
                    <IconX className="size-4" />
                    Close
                  </Button>
                </DialogPrimitive.Close>
              </div>
            </DialogPrimitive.Content>
          </DialogPortal>
        </Dialog>
      ) : null}
    </>
  )
}
