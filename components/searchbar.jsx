"use client"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Heart, Github, UserRound, Copyright, Sparkles, Telescope, SquareArrowOutUpRight, MoonStar, Sparkle, BookOpen, Bug, Pencil, Plus, MapPin, RectangleHorizontal, Map, ArrowRightFromLine, Hexagon, ListCollapse, User, LogOut, Ruler, CodeXml, Menu, Crosshair } from "lucide-react"
import { darkenColor, useStore } from "@/lib/utils.js"
import { useEffect, useRef, useState } from "react"

export default function SearchBar({ map, data, mobile, name, pan, groups, UNIT, STYLES, SEARCH_SIZE }) {
  const [active, setActive] = useState()
  const [previousFeatureId, setPreviousFeatureId] = useState(null)
  const { editorTable } = useStore()
  const cmd = useRef(null)
  const input = useRef(null)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!active) return setResults([])
    if (!query) return
    setLoading(true)

    const delay = setTimeout(() => {
      const matches = data.features.filter(d =>
        d.properties.name?.toLowerCase().includes(query?.toLowerCase())
      )

      setResults(matches.slice(0, 50))
      setLoading(false)
    }, 150) // debounce delay

    return () => clearTimeout(delay)
  }, [query, active])


  async function search(e, d) {
    if (typeof e === "object") e.preventDefault()

    // close search menu
    setActive(false)
    input.current.blur()

    // Reset hover state of the previously hovered feature
    if (previousFeatureId !== null) {
      map.setFeatureState(
        { source: 'source', id: previousFeatureId },
        { hover: false }
      )
    }

    // Set hover state of the new feature
    map.setFeatureState(
      { source: 'source', id: d.id },
      { hover: true }
    )

    // Update the previousFeatureId state
    setPreviousFeatureId(d.id)

    // duplcate of what's in locationClick in map.jsx
    const [lng, lat] = d.geometry.coordinates

    // rbush uses a square but that's fine
    const rawNearby = groups.search({
      minX: lng - SEARCH_SIZE,
      minY: lat - SEARCH_SIZE,
      maxX: lng + SEARCH_SIZE,
      maxY: lat + SEARCH_SIZE
    })

    const myGroup = rawNearby
      .filter(item => item.feature.id !== d.id)
      .map(item => ({
        groupCenter: [lng, lat],
        ...item.feature
      }))

    pan(d, myGroup, true)
  }

  useEffect(() => {
    if (input.current) {
      input.current.addEventListener('blur-sm', () => setActive(false));
    }
    function down(e) {
      if (e.code === 'Space' && !document.querySelector(".editor-table")) {
        if (input.current !== document.activeElement) {
          e.preventDefault()
        }
        input.current.focus()
        setActive(true)
      } else if (e.code === "Escape") {
        setActive(false)
      }
    }

    document.addEventListener('keydown', down)
    return () => {
      document.removeEventListener('keydown', down)
      input?.current?.removeEventListener('blur-sm', () => setActive(false));
    }
  }, [editorTable])

  useEffect(() => {
    if (active) {
      if (!mobile) input.current.placeholder = "Escape to close"
    } else {
      input.current.placeholder = mobile ? "Search for a location" : "press Space to search"
    }
  }, [active])

  useEffect(() => {
    const root = input.current?.closest("[cmdk-root]")
    if (!root) return

    function handleFocusOut() {
      requestAnimationFrame(() => {
        if (!root.contains(document.activeElement)) {
          setActive(false)
        }
      })
    }

    root.addEventListener("focusout", handleFocusOut)
    return () => root.removeEventListener("focusout", handleFocusOut)
  }, [input])

  useEffect(() => {
    console.log("missing name", data.features.filter(n => !n.properties.name))
  }, [])

  return (
    <div className="flex mt-5 w-full justify-center absolute z-10 pointer-events-none" >
      <Command className="rounded-lg border shadow-md w-[75%] searchbar pointer-events-auto" style={{ borderColor: darkenColor(STYLES.MAIN_COLOR, 13), backgroundColor: darkenColor(STYLES.MAIN_COLOR, 19) }}>
        <CommandInput
          placeholder={mobile ? "Search for a location" : "press Space to search"}
          ref={input}
          onClick={() => setActive(true)}
          onValueChange={setQuery}
          style={{ backgroundColor: STYLES.searchbarBackground }}
          borderbottomcolor={darkenColor(STYLES.MAIN_COLOR, 13)}
        />
        {active &&
          <CommandList style={{ height: '351px', zIndex: 100 }}>
            <CommandGroup ref={cmd}>
              {loading && <div className="px-4 py-2 text-sm text-muted-foreground">Searching…</div>}
              {!loading && results.length === 0 && <CommandEmpty>No results found.</CommandEmpty>}
              {!loading && results.map((d, index) => (
                <CommandItem key={index} value={d.properties.name} onMouseDown={e => search(e, d)} onSelect={e => search(e, d)}>
                  {d.properties.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        }
      </Command >
    </div>
  )
}
