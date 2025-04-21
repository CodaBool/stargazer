"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function Table({
  className,
  ...props
}) {
  return (
    (<div data-slot="table-container" className="relative w-full overflow-x-auto">
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props} />
    </div>)
  );
}

function TableHeader({
  className,
  ...props
}) {
  return (
    (<thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props} />)
  );
}

function TableBody({
  className,
  ...props
}) {
  return (
    (<tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props} />)
  );
}

function TableFooter({
  className,
  ...props
}) {
  return (
    (<tfoot
      data-slot="table-footer"
      className={cn(
        "bg-slate-100/50 border-t font-medium [&>tr]:last:border-b-0 dark:bg-slate-800/50",
        className
      )}
      {...props} />)
  );
}

function TableRow({
  className,
  ...props
}) {
  return (
    (<tr
      data-slot="table-row"
      className={cn(
        "hover:bg-slate-100/50 data-[state=selected]:bg-slate-100 border-b transition-colors dark:hover:bg-slate-800/50 dark:data-[state=selected]:bg-slate-800",
        className
      )}
      {...props} />)
  );
}

function TableHead({
  className,
  ...props
}) {
  return (
    (<th
      data-slot="table-head"
      className={cn(
        "text-slate-500 h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] dark:text-slate-400",
        className
      )}
      {...props} />)
  );
}

function TableCell({
  className,
  ...props
}) {
  return (
    (<td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props} />)
  );
}

function TableCaption({
  className,
  ...props
}) {
  return (
    (<caption
      data-slot="table-caption"
      className={cn("text-slate-500 mt-4 text-sm dark:text-slate-400", className)}
      {...props} />)
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
