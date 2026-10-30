"use client"

import * as React from "react"
import { IconCommand } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

interface LoadingOverlayProps {
    isVisible?: boolean
    message?: string
    className?: string
}

export function LoadingOverlay({ isVisible = true, message = "Processing...", className }: LoadingOverlayProps) {
    if (!isVisible) return null

    return (
        <div className={cn(
            "absolute inset-0 z-40 flex flex-col items-center justify-center bg-background/60 backdrop-blur-md animate-in fade-in duration-300",
            className
        )}>
            <div className="relative">
                {/* Outer Glow Ring */}
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />

                {/* Main Spinner Ring */}
                <div className="size-20 rounded-full border-4 border-muted border-t-primary animate-spin" />

                {/* Center Logo */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-primary rounded-xl p-2 shadow-lg shadow-primary/20 animate-bounce transition-all">
                        <IconCommand className="size-6 text-primary-foreground" />
                    </div>
                </div>
            </div>

            <div className="mt-8 flex flex-col items-center gap-2">
                <h3 className="text-lg font-bold tracking-tight bg-linear-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                    {message}
                </h3>
                <div className="flex gap-1.5">
                    <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                    <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                    <span className="size-1.5 rounded-full bg-primary animate-bounce" />
                </div>
            </div>
        </div>
    )
}

export function LoadingSpinner({ className }: { className?: string }) {
    return (
        <div className={cn("relative flex items-center justify-center", className)}>
            <div className="size-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
    )
}

export function LoadingCard() {
    return (
        <div className="w-full h-48 rounded-3xl border-2 border-dashed border-muted flex items-center justify-center bg-muted/5 animate-pulse">
            <div className="flex flex-col items-center gap-3">
                <LoadingSpinner className="size-10" />
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Syncing Data...</span>
            </div>
        </div>
    )
}

export function FullScreenLoading({ message = "Loading..." }: { message?: string }) {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
            <div className="relative">
                {/* Outer Glow Ring */}
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />

                {/* Main Spinner Ring */}
                <div className="size-20 rounded-full border-4 border-muted border-t-primary animate-spin" />

                {/* Center Logo */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-primary rounded-xl p-2 shadow-lg shadow-primary/20 animate-bounce transition-all">
                        <IconCommand className="size-6 text-primary-foreground" />
                    </div>
                </div>
            </div>

            <div className="mt-8 flex flex-col items-center gap-2">
                <h3 className="text-lg font-bold tracking-tight">
                    {message}
                </h3>
                <div className="flex gap-1.5">
                    <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                    <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                    <span className="size-1.5 rounded-full bg-primary animate-bounce" />
                </div>
            </div>
        </div>
    )
}
