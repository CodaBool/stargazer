"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

function Tabs({ className, scifi = false, ...props }) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", scifi && "bg-black/50 border border-cyan-400 rounded-lg p-2", className)}
      {...props}
    />
  )
}

function TabsList({ className, scifi = false, ...props }) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]",
        scifi
          ? "bg-black/40 text-cyan-300 border border-cyan-400"
          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({ className, scifi = false, ...props }) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex cursor-pointer h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:outline-ring focus-visible:outline-1 focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        scifi
          ? "text-cyan-300 border-cyan-400 data-[state=active]:bg-cyan-400/20 data-[state=active]:text-white hover:bg-cyan-400/10"
          : "text-slate-950 dark:text-slate-500 border-slate-200 dark:border-slate-800 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:text-slate-950 dark:data-[state=active]:text-slate-50",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, scifi = false, ...props }) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", scifi && "bg-black/40 p-4 border border-cyan-400 rounded-lg", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
