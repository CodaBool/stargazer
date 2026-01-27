'use client'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { Heart, Github, Pencil, User, Ruler, Menu, Crosshair, HeartHandshake, Eye, CircleHelp, House, Settings, Book } from "lucide-react"
import { REPO, useMode, useStore } from "@/lib/utils"

export default function Hamburger({ name, params, map, mobile }) {
  const { mode, setMode } = useMode()
  const { setTutorial, setCredits, setFilters, filters } = useStore()

  function geoGridWorkaround() {
    if (document.querySelector(".geogrid")) {
      const urlParams = new URLSearchParams(window.location.search);
      console.log("force reload, since geo-grid is buggy")
      document.querySelector("#map").innerHTML = `
        <div class='transition-text' style='
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          font-size: 3em;
          line-height: 1;
          text-align: center;
          background: rgba(0, 0, 0, 0.8);
          padding: 0.5em 1em;
          border-radius: 15px;
        '>${urlParams.get("preview") ? 'Switching to Edit Mode' : 'Switching to Preview Mode'}</div>
      `
      setTimeout(() => window.location.reload(), 1_000)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger onPointerDown={e => e.stopPropagation()} className="m-5 ml-12 absolute hamburger cursor-pointer z-10 bg-[rgba(0,0,0,.3)] rounded" style={{ transition: 'bottom 0.5s ease-in-out' }}>
        <Menu width={40} height={40} className="cursor-pointer" />
      </DropdownMenuTrigger>
      <DropdownMenuContent onPointerDown={e => e.stopPropagation()}>
        <DropdownMenuLabel>Tools</DropdownMenuLabel>
        <DropdownMenuItem  onClick={() => setMode(mode === "measure" ? null : "measure")}>
          <Ruler /> Measure <input type="checkbox" checked={mode === "measure"} readOnly />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setMode(mode === "crosshair" ? null : "crosshair")}>
          <Crosshair /> Coordinate <input type="checkbox" checked={mode === "crosshair"} readOnly />
        </DropdownMenuItem>
        {(params.get("iframe") !== "1" && !params.get("cheeseburger")) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Links</DropdownMenuLabel>
            {name !== "custom" &&
              <DropdownMenuItem onClick={() => setCredits(true)}>
                <Heart className="ml-[.6em] inline" /> <span className="ml-[5px]">Credits</span>
              </DropdownMenuItem>
            }

            {REPO &&
              <Link href={REPO + "/issues"} target="_blank">
                <DropdownMenuItem >
                  <Github className="ml-[.6em]" /> <span className="ml-[5px]">GitHub</span>
                </DropdownMenuItem>
              </Link>
            }

            {name === "lancer" &&
              <Link href="/lancerStarwall">
                <DropdownMenuItem>
                  <User className="ml-[.6em]" /> <span className="ml-[5px]">Variant</span>
                </DropdownMenuItem>
              </Link>
            }
            {name === "lancerStarwall" &&
              <Link href="/lancer">
                <DropdownMenuItem >
                  <User className="ml-[.6em]" /> <span className="ml-[5px]">Core</span>
                </DropdownMenuItem>
              </Link>
            }
            {!mobile &&
              <DropdownMenuItem onClick={() => setTutorial("faq")}>
                <CircleHelp className="ml-[.6em] inline" /> <span className="ml-[5px]">Help</span>
              </DropdownMenuItem>
            }
            {name === "starwars" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Filters</DropdownMenuLabel>
                <DropdownMenuCheckboxItem checked={filters !== "legends"} onCheckedChange={e => setFilters(e ? null : "legends")}>
                  <Book className="" size={16} /> <span className="ms-2">Legends</span>
                </DropdownMenuCheckboxItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Create</DropdownMenuLabel>
            {name !== "custom" &&
              <Link href={`/contribute/${name}`}>
                <DropdownMenuItem >
                  <HeartHandshake className="ml-[.6em] inline" /> <span className="ml-[5px]">Contribute</span>
                </DropdownMenuItem>
              </Link>
            }
            <Link href={`/#${name}_local`}>
              <DropdownMenuItem className="cursor-pointer">
                <House className="ml-[.6em] inline" /> <span className="ml-[5px]">Home</span>
              </DropdownMenuItem>
            </Link>
            {(!mobile && params.get("id")) &&
              <Link href={`/${name}/${params.get("id")}/settings`}>
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="ml-[.6em] inline" /> <span className="ml-[5px]">Settings</span>
                </DropdownMenuItem>
              </Link>
            }
            {(!params.get("preview") && !mobile && params.get("id")) &&
              <Link href={`/${name}?id=${params.get("id")}&preview=1`} onClick={geoGridWorkaround}>
                <DropdownMenuItem className="cursor-pointer">
                  <Eye className="ml-[.6em] inline" /> <span className="ml-[5px]">Preview</span>
                </DropdownMenuItem>
              </Link>
            }
            {(params.get("preview") && !mobile && params.get("id")) &&
              <Link href={`/${name}?id=${params.get("id")}`} onClick={geoGridWorkaround}>
                <DropdownMenuItem className="cursor-pointer">
                  <Pencil className="ml-[.6em] inline" /> <span className="ml-[5px]">Edit</span>
                </DropdownMenuItem>
              </Link>
            }
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu >
  )
}
