"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}) {
  return (
    (<TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props} />)
  );
}

function TabsList({
  className,
  ...props
}) {
  return (
    (<TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "bg-slate-100 text-slate-500 inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px] dark:bg-slate-800 dark:text-slate-400",
        className
      )}
      {...props} />)
  );
}

function TabsTrigger({
  className,
  ...props
}) {
  return (
    (<TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "data-[state=active]:bg-white dark:data-[state=active]:text-slate-950 focus-visible:border-slate-950 focus-visible:ring-slate-950/50 focus-visible:outline-ring dark:data-[state=active]:border-slate-200 dark:data-[state=active]:bg-slate-200/30 text-slate-950 dark:text-slate-500 inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-slate-200 border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 dark:data-[state=active]:bg-slate-950 dark:dark:data-[state=active]:text-slate-50 dark:focus-visible:border-slate-300 dark:focus-visible:ring-slate-300/50 dark:dark:data-[state=active]:border-slate-800 dark:dark:data-[state=active]:bg-slate-800/30 dark:text-slate-50 dark:dark:text-slate-400 dark:border-slate-800",
        className
      )}
      {...props} />)
  );
}

function TabsContent({
  className,
  ...props
}) {
  return (
    (<TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props} />)
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
