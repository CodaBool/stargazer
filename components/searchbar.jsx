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
import { darkenColor } from "@/lib/utils.js"
import * as turf from '@turf/turf'
import { useEffect, useRef, useState } from "react"
import { useStore } from "./cartographer"

export default function MenuComponent({ map, data, mobile, name, pan, locationGroups, UNIT, STYLES }) {
  const [active, setActive] = useState()
  const [previousFeatureId, setPreviousFeatureId] = useState(null)
  const { editorTable } = useStore()
  const cmd = useRef(null)
  const input = useRef(null)

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

    // Find the group that the clicked location belongs to
    const group = locationGroups.find(g => g.members.includes(d.id))



    if (!group) {
      pan(d, [], [], true)
      return
    }

    // Find nearby groups excluding the clicked group
    const nearbyGroups = locationGroups.filter(g => {
      if (g === group) return false; // Exclude the clicked group
      return turf.distance(group.center, g.center) <= (UNIT === "ly" ? 510 : 60);
    })
    // console.log("pre nearbyGroups", nearbyGroups)

    const nearby = nearbyGroups.map(({ center, members }) => {
      return members.map(id => {
        return {
          groupCenter: center,
          ...data.features.find(f => f.id === id)
        }
      })
    })

    // const myGroup = group.members.map(id => data.features.find(f => f.id === id))
    const myGroup = group.members.map(id => ({
      groupCenter: group.center,
      ...data.features.find(f => f.id === id)
    }))

    // console.log("click group", group)
    // console.log("Nearby groups (excluding clicked group)", nearby)

    pan(d, myGroup, nearby, true)
  }

  useEffect(() => {
    if (input.current) {
      input.current.addEventListener('blur-sm', () => setActive(false));
    }
    function down(e) {
      if (e.code === 'Space' && !editorTable) {
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

  return (
    <div className="flex mt-5 w-full justify-center absolute z-10 pointer-events-none" >
      <Command className="rounded-lg border shadow-md w-[75%] searchbar pointer-events-auto" style={{ borderColor: darkenColor(STYLES.MAIN_COLOR, 13), backgroundColor: darkenColor(STYLES.MAIN_COLOR, 19) }}>
        <CommandInput placeholder={mobile ? "Search for a location" : "press Space to search"} ref={input} onClick={() => setActive(true)} style={{ backgroundColor: STYLES.searchbarBackground }}
          borderbottomcolor={darkenColor(STYLES.MAIN_COLOR, 13)}
        />
        {active &&
          <CommandList style={{ height: '351px', zIndex: 100 }}>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup ref={cmd} heading="Suggestions">
              {data.features.map((d, index) => (
                <CommandItem key={index} value={d.properties.name} className="cursor-pointer z-100" onMouseDown={e => search(e, d)} onSelect={e => search(e, d)} onTouchEnd={e => search(e, d)}>
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
