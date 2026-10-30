"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { IconAlertCircle, IconRefresh } from "@tabler/icons-react"
import Link from "next/link"

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error)
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
            <div className="mb-8 p-4 bg-destructive/10 rounded-full">
                <IconAlertCircle className="size-16 text-destructive" />
            </div>

            <h2 className="text-3xl font-bold tracking-tight mb-2">Something went wrong!</h2>
            <p className="text-muted-foreground max-w-md mb-8">
                An unexpected error occurred. We have been notified and are working on it.
                {error.digest && (
                    <span className="block mt-2 text-xs font-mono text-muted-foreground/60">
                        Error ID: {error.digest}
                    </span>
                )}
            </p>

            <div className="flex gap-4">
                <Button onClick={() => reset()} size="lg" className="rounded-full px-8 gap-2">
                    <IconRefresh className="size-4" />
                    Try Again
                </Button>
                <Button variant="outline" size="lg" className="rounded-full px-8" asChild>
                    <Link href="/">Go to Dashboard</Link>
                </Button>
            </div>
        </div>
    )
}
