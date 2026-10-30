"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Tabs as TabsPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex w-full min-w-0 gap-2 data-horizontal:flex-col",
        className,
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list text-muted-foreground group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default: cn(
          "inline-flex h-10 w-max max-w-full flex-nowrap items-center gap-1 overflow-hidden",
          "rounded-xl border border-border/60 bg-muted/40 p-1 shadow-none",
          "group-data-horizontal/tabs:h-10",
        ),
        line: cn(
          "inline-flex h-10 w-max max-w-full flex-nowrap items-center gap-1 overflow-hidden",
          "rounded-none border-b border-border bg-transparent p-0 shadow-none",
          "group-data-horizontal/tabs:h-10",
        ),
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

function TabsList({
  className,
  variant = "default",
  scrollable = true,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants> & {
    scrollable?: boolean
  }) {
  const scrollRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!scrollable) return

    const container = scrollRef.current
    if (!container) return

    const scrollActiveIntoView = () => {
      const active = container.querySelector<HTMLElement>(
        '[data-slot="tabs-trigger"][data-state="active"]',
      )
      active?.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      })
    }

    scrollActiveIntoView()

    const observer = new MutationObserver(scrollActiveIntoView)
    observer.observe(container, {
      attributes: true,
      subtree: true,
      attributeFilter: ["data-state"],
    })

    return () => observer.disconnect()
  }, [scrollable])

  const list = (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )

  if (!scrollable) {
    return list
  }

  return (
    <div className="relative w-max max-w-full min-w-0 group-data-vertical/tabs:w-auto">
      <div
        ref={scrollRef}
        className={cn(
          "max-w-full min-w-0 group-data-vertical/tabs:w-auto",
          "group-data-horizontal/tabs:overflow-x-auto group-data-horizontal/tabs:overscroll-x-contain group-data-horizontal/tabs:touch-pan-x",
          "group-data-horizontal/tabs:scroll-smooth group-data-horizontal/tabs:snap-x group-data-horizontal/tabs:snap-mandatory",
          "group-data-horizontal/tabs:[scrollbar-width:none]",
          "group-data-horizontal/tabs:[-ms-overflow-style:none]",
          "group-data-horizontal/tabs:[&::-webkit-scrollbar]:hidden",
        )}
      >
        {list}
      </div>
    </div>
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex items-center justify-center gap-1.5 rounded-md border border-transparent font-medium whitespace-nowrap transition-all",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start",
        "group-data-horizontal/tabs:group-data-[variant=default]/tabs-list:h-8",
        "group-data-horizontal/tabs:group-data-[variant=default]/tabs-list:shrink-0",
        "group-data-horizontal/tabs:group-data-[variant=default]/tabs-list:flex-none",
        "group-data-horizontal/tabs:group-data-[variant=default]/tabs-list:snap-center",
        "group-data-horizontal/tabs:group-data-[variant=default]/tabs-list:snap-always",
        "group-data-horizontal/tabs:group-data-[variant=default]/tabs-list:px-3",
        "group-data-horizontal/tabs:group-data-[variant=default]/tabs-list:text-xs",
        "sm:group-data-horizontal/tabs:group-data-[variant=default]/tabs-list:px-3.5",
        "sm:group-data-horizontal/tabs:group-data-[variant=default]/tabs-list:text-sm",
        "group-data-[variant=default]/tabs-list:text-foreground/60",
        "group-data-[variant=default]/tabs-list:hover:text-foreground",
        "group-data-[variant=default]/tabs-list:data-active:bg-primary",
        "group-data-[variant=default]/tabs-list:data-active:text-primary-foreground",
        "group-data-[variant=default]/tabs-list:data-active:shadow-lg",
        "group-data-[variant=default]/tabs-list:data-active:hover:bg-primary",
        "group-data-[variant=default]/tabs-list:data-active:hover:text-primary-foreground",
        "group-data-[variant=default]/tabs-list:after:hidden",
        "group-data-horizontal/tabs:group-data-[variant=line]/tabs-list:h-10",
        "group-data-horizontal/tabs:group-data-[variant=line]/tabs-list:shrink-0",
        "group-data-horizontal/tabs:group-data-[variant=line]/tabs-list:flex-none",
        "group-data-horizontal/tabs:group-data-[variant=line]/tabs-list:snap-center",
        "group-data-horizontal/tabs:group-data-[variant=line]/tabs-list:rounded-none",
        "group-data-horizontal/tabs:group-data-[variant=line]/tabs-list:px-4",
        "group-data-horizontal/tabs:group-data-[variant=line]/tabs-list:text-sm",
        "group-data-[variant=line]/tabs-list:bg-transparent",
        "group-data-[variant=line]/tabs-list:text-foreground/60",
        "group-data-[variant=line]/tabs-list:hover:text-foreground",
        "group-data-[variant=line]/tabs-list:data-active:bg-transparent",
        "group-data-[variant=line]/tabs-list:data-active:text-foreground",
        "group-data-[variant=line]/tabs-list:data-active:shadow-none",
        "dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent",
        "after:absolute after:bg-foreground after:opacity-0 after:transition-opacity",
        "group-data-horizontal/tabs:group-data-[variant=line]/tabs-list:after:inset-x-0",
        "group-data-horizontal/tabs:group-data-[variant=line]/tabs-list:after:bottom-0",
        "group-data-horizontal/tabs:group-data-[variant=line]/tabs-list:after:h-0.5",
        "group-data-vertical/tabs:group-data-[variant=line]/tabs-list:after:inset-y-0",
        "group-data-vertical/tabs:group-data-[variant=line]/tabs-list:after:-right-1",
        "group-data-vertical/tabs:group-data-[variant=line]/tabs-list:after:w-0.5",
        "group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
        className,
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
