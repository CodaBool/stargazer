"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function FeatureVoteClient({
  features,
  initialSelectedIds,
  submitVotesAction,
  maxSelections = 3,
}) {
  const router = useRouter()
  const [selected, setSelected] = React.useState(() => new Set(initialSelectedIds ?? []))
  const [isPending, startTransition] = React.useTransition()
  const [error, setError] = React.useState("")

  const selectedCount = selected.size
  const hasChanges = React.useMemo(() => {
    const a = Array.from(selected).sort((x, y) => x - y)
    const b = Array.from(initialSelectedIds ?? []).sort((x, y) => x - y)
    if (a.length !== b.length) return true
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return true
    return false
  }, [selected, initialSelectedIds])

  function toggle(id) {
    setError("")
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else {
        if (next.size >= maxSelections) return next
        next.add(id)
      }
      return next
    })
  }

  const maxedOut = selectedCount >= maxSelections

  function onSubmit() {
    setError("")
    const payload = Array.from(selected)

    startTransition(async () => {
      try {
        await submitVotesAction(payload)
        router.refresh()
      } catch (e) {
        console.error(e)
        setError(e?.message || "Could not save your votes. Please try again.")
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Selected: <span className="font-semibold">{selectedCount}</span> / {maxSelections}
        {maxedOut ? <span className="ml-2">• max reached</span> : null}
      </div>

      <div className="space-y-2">
        {features.map((f) => {
          const checked = selected.has(f.id)
          const disableUnchecked = isPending || (!checked && maxedOut)

          return (
            <Card key={f.id} className={`p-3 transition ${checked ? "border-blue-400/60" : ""} ${isPending ? "opacity-80" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={`vote-${f.id}`}
                    checked={checked}
                    disabled={disableUnchecked}
                    onCheckedChange={() => toggle(f.id)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor={`vote-${f.id}`} className={`leading-snug cursor-pointer ${disableUnchecked ? "cursor-not-allowed opacity-70" : ""}`}>
                      {f.label}
                    </Label>
                    <div className="text-xs text-muted-foreground">
                      {f.count} vote{f.count === 1 ? "" : "s"}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {error ? <div className="text-sm text-red-400">{error}</div> : null}

      <Button onClick={onSubmit} className="w-full" disabled={isPending || !hasChanges}>
        {isPending ? "Saving…" : "Submit votes"}
      </Button>
    </div>
  )
}
