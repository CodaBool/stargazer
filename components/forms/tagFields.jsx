import React from "react"
import { Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Controller } from "react-hook-form"

/** ---------- helpers ---------- **/

function parseCsv(value) {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

function toCsv(values) {
  return values.join(", ")
}

function uniq(values) {
  return [...new Set(values)]
}

/**
 * RHF: Freeform input + plus + badges
 * Stores a CSV string in the field.
 */
export function CommaTagsField({
  control,
  name,
  placeholder = "Type values, separated by commas",
  disabled = false,
  normalize = (s) => s.trim(),
  onImmediateChange, // (csvString) => void
}) {
  const [draft, setDraft] = React.useState("")

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const tags = uniq(parseCsv(field.value))

        function commit(nextTags) {
          const csv = toCsv(nextTags)
          field.onChange(csv)
          onImmediateChange?.(csv)
        }

        function addFromDraft() {
          const incoming = draft
            .split(",")
            .map((t) => normalize(t))
            .map((t) => t.trim())
            .filter(Boolean)

          if (!incoming.length) return
          const next = uniq([...tags, ...incoming])
          commit(next)
          setDraft("")
        }

        function removeTag(tag) {
          const next = tags.filter((t) => t !== tag)
          commit(next)
        }

        return (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                className="h-8"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addFromDraft()
                  }
                }}
              />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="h-8 w-8"
                disabled={disabled}
                onClick={addFromDraft}
                title="Add"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {tags.length > 0 && (
              <div className="grid grid-cols-2 gap-2 select-none">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="flex items-center justify-between gap-2 py-1"
                  >
                    <span className="truncate">{tag}</span>
                    <button
                      type="button"
                      className="opacity-70 hover:opacity-100"
                      onClick={() => removeTag(tag)}
                      aria-label={`Remove ${tag}`}
                      disabled={disabled}
                    >
                      <X className="h-3.5 w-3.5 cursor-pointer" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )
      }}
    />
  )
}

/**
 * RHF: Select + plus + badges
 * Stores a CSV string in the field.
 */
export function SelectTagsField({
  control,
  name,
  options, // ["blue","red"] OR [["blue",1],...], we handle both
  placeholder = "Select a value",
  disabled = false,
  onImmediateChange, // (csvString) => void
}) {
  const [selected, setSelected] = React.useState("")

  const normalizedOptions = React.useMemo(() => {
    if (!Array.isArray(options)) return []
    if (options.length && Array.isArray(options[0])) return options.map((x) => x[0])
    return options
  }, [options])

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const tags = uniq(parseCsv(field.value))

        function commit(nextTags) {
          const csv = toCsv(nextTags)
          field.onChange(csv)
          onImmediateChange?.(csv)
        }

        function addSelected() {
          if (!selected) return
          const next = uniq([...tags, selected])
          commit(next)
          setSelected("")
        }

        function removeTag(tag) {
          const next = tags.filter((t) => t !== tag)
          commit(next)
        }

        return (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Select value={selected} onValueChange={setSelected} disabled={disabled}>
                <SelectTrigger className="h-8 w-full cursor-pointer">
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {normalizedOptions.map((label) => (
                    <SelectItem key={label} value={label} className="cursor-pointer">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="h-8 w-8"
                disabled={disabled || !selected}
                onClick={addSelected}
                title="Add"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {tags.length > 0 && (
              <div className="grid grid-cols-2 gap-2 select-none">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="flex items-center justify-between gap-2 py-1"
                  >
                    <span className="truncate">{tag}</span>
                    <button
                      type="button"
                      className="opacity-70 hover:opacity-100"
                      onClick={() => removeTag(tag)}
                      aria-label={`Remove ${tag}`}
                      disabled={disabled}
                    >
                      <X className="h-3.5 w-3.5 cursor-pointer" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )
      }}
    />
  )
}
