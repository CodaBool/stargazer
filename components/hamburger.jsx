'use client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Heart, Github, UserRound, Copyright, Sparkles, Telescope, SquareArrowOutUpRight, MoonStar, Pencil, User, Ruler, Menu, Crosshair, HeartHandshake, Eye, CircleHelp, House } from "lucide-react"
import { useEffect, useState } from "react"
import { useMode, useStore } from "@/lib/utils"

// TODO: this should be rewritten to use zustand instead of a Set (called mode)

export default function Hamburger({ name, params, map, stargazer, mobile, IS_GALAXY }) {
  const { mode, setMode } = useMode()
  const { setTutorial } = useStore()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger onPointerDown={e => e.stopPropagation()} className="m-5 ml-12 absolute hamburger cursor-pointer z-10" style={{ transition: 'bottom 0.5s ease-in-out' }}>
        <Menu width={40} height={40} className="cursor-pointer" />
      </DropdownMenuTrigger>
      <DropdownMenuContent onPointerDown={e => e.stopPropagation()}>
        <DropdownMenuLabel>Tools</DropdownMenuLabel>
        <DropdownMenuItem className="cursor-pointer" onClick={() => setMode(mode === "measure" ? null : "measure")}>
          <Ruler /> Measure <input type="checkbox" checked={mode === "measure"} readOnly />
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onClick={() => setMode(mode === "crosshair" ? null : "crosshair")}>
          <Crosshair /> Coordinate <input type="checkbox" checked={mode === "crosshair"} readOnly />
        </DropdownMenuItem>
        {params.get("iframe") !== "1" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Links</DropdownMenuLabel>
            {/* <DropdownMenuItem className="cursor-pointer"><Copyright /> License</DropdownMenuItem> */}
            {/* <DropdownMenuItem className="cursor-pointer"><Heart /> Credits</DropdownMenuItem> */}
            {name !== "custom" &&
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="w-full pl-0 cursor-pointer">
                    <Heart size={16} className="relative top-[-1px] pe-[2px] inline left-[-6px]" />
                    <span className="left-[-2px] relative">Credits</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[410px]" style={{ color: 'white' }}>
                  <DialogHeader>
                    <DialogTitle className="text-center"><><Heart size={18} className="pe-[2px] animate-bounce inline mr-2" /> Credits</></DialogTitle>
                    <DialogDescription className="py-6" asChild>
                      <Credits name={name} />
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            }
            <Link href="https://github.com/codabool/stargazer" target="_blank">
              <DropdownMenuItem className="cursor-pointer">
                <Github className="ml-[.6em]" /> <span className="ml-[5px]">GitHub</span>
              </DropdownMenuItem>
            </Link>
            {name === "lancer" &&
              <Link href="/lancer_starwall">
                <DropdownMenuItem className="cursor-pointer">
                  <User className="ml-[.6em]" /> <span className="ml-[5px]">Variant</span>
                </DropdownMenuItem>
              </Link>
            }
            {name === "lancer_starwall" &&
              <Link href="/lancer">
                <DropdownMenuItem className="cursor-pointer">
                  <User className="ml-[.6em]" /> <span className="ml-[5px]">Core</span>
                </DropdownMenuItem>
              </Link>
            }
            {!mobile &&
              <DropdownMenuItem className="cursor-pointer" onClick={() => setTutorial(true)}>
                <CircleHelp className="ml-[.6em] inline" /> <span className="ml-[5px]">Help</span>
              </DropdownMenuItem>
            }
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Create</DropdownMenuLabel>
            {name !== "custom" &&
              <Link href={`/contribute/${name}`}>
                <DropdownMenuItem className="cursor-pointer">
                  <HeartHandshake className="ml-[.6em] inline" /> <span className="ml-[5px]">Contribute</span>
                </DropdownMenuItem>
              </Link>
            }
            <Link href={`/#${name}_local`}>
              <DropdownMenuItem className="cursor-pointer">
                <House className="ml-[.6em] inline" /> <span className="ml-[5px]">Home</span>
              </DropdownMenuItem>
            </Link>
            {(!stargazer && !mobile) &&
              <Link href={`/${name}?id=${params.get("id")}&preview=1`}>
                <DropdownMenuItem className="cursor-pointer">
                  <Eye className="ml-[.6em] inline" /> <span className="ml-[5px]">Preview</span>
                </DropdownMenuItem>
              </Link>
            }
            {(stargazer && !mobile) &&
              <Link href={`/${name}?id=${params.get("id")}`}>
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

function Credits({ name }) {
  return (
    <>
      <span className="text-xl"><Telescope className="inline pr-2 ml-[6.8em]" size={32} /> Major</span>
      <span className="flex mb-12 mt-5">
        <span className="flex-1">
          <svg width="200" height="100" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(-40, -90) scale(0.4)">
              <path id="svg_3" d="m110.45,277.97498l9.54922,0l2.95078,-8.78524l2.95078,8.78524l9.54921,0l-7.72546,5.42952l2.95093,8.78524l-7.72547,-5.42966l-7.72547,5.42966l2.95093,-8.78524l-7.72547,-5.42952z" stroke="black" fill="#fff" />
              <path id="svg_5" d="m218.45,252.97498l9.54922,0l2.95078,-8.78524l2.95078,8.78524l9.54922,0l-7.72547,5.42952l2.95094,8.78524l-7.72547,-5.42966l-7.72547,5.42966l2.95094,-8.78524l-7.72547,-5.42952z" stroke="black" fill="white" />
              <path id="svg_6" d="m270.45001,295.97498l9.54922,0l2.95078,-8.78524l2.95078,8.78524l9.54922,0l-7.72547,5.42952l2.95094,8.78524l-7.72547,-5.42966l-7.72547,5.42966l2.95094,-8.78524l-7.72547,-5.42952z" stroke="black" fill="#fff" />
              <path id="svg_7" d="m379.45,425.97501l9.54922,0l2.95078,-8.78524l2.95078,8.78524l9.54922,0l-7.72547,5.42952l2.95094,8.78524l-7.72547,-5.42966l-7.72547,5.42966l2.95094,-8.78524l-7.72547,-5.42952z" stroke="black" fill="#fff" />
              <path id="svg_8" d="m529.45003,436.97504l9.54922,0l2.95078,-8.78524l2.95078,8.78524l9.54922,0l-7.72547,5.42952l2.95094,8.78524l-7.72547,-5.42966l-7.72547,5.42966l2.95094,-8.78524l-7.72547,-5.42952z" stroke="black" fill="#fff" />
              <path id="svg_9" d="m547.45006,338.97501l9.54922,0l2.95078,-8.78524l2.95078,8.78524l9.54922,0l-7.72547,5.42952l2.95094,8.78524l-7.72547,-5.42966l-7.72547,5.42966l2.95094,-8.78524l-7.72547,-5.42952z" stroke="black" fill="#fff" />
              <path id="svg_10" d="m362.45003,345.97501l9.54922,0l2.95078,-8.78524l2.95078,8.78524l9.54922,0l-7.72547,5.42952l2.95094,8.78524l-7.72547,-5.42966l-7.72547,5.42966l2.95094,-8.78524l-7.72547,-5.42952z" stroke="black" fill="#fff" />
              <line id="svg_11" y2="257.00005" x2="232.0001" y1="282.00006" x1="123.00008" stroke="mediumpurple" fill="none" />
              <line id="svg_12" y2="441.00008" x2="542.00014" y1="342.00007" x1="560.00015" stroke="mediumpurple" fill="none" />
              <line id="svg_13" y2="442.00008" x2="543.00014" y1="428.00008" x1="391.00012" stroke="mediumpurple" fill="none" />
              <line id="svg_14" y2="342.00007" x2="560.00015" y1="349.00007" x1="376.00012" stroke="mediumpurple" fill="none" />
              <line id="svg_15" y2="300.00006" x2="285.0001" y1="256.00005" x1="230.0001" stroke="mediumpurple" fill="none" />
              <line id="svg_16" y2="346.00007" x2="375.00012" y1="427.00008" x1="391.00012" stroke="mediumpurple" fill="none" />
              <line id="svg_17" y2="349.00007" x2="374.00012" y1="298.00006" x1="284.0001" stroke="mediumpurple" fill="none" />
            </g>
          </svg>
        </span>
        <span className="flex-1 text-left">
          {name.includes("lancer")
            ? <>
              <span><Sparkles className="inline pr-2" /><a href="https://janederscore.tumblr.com" target="_blank"> Janederscore <SquareArrowOutUpRight className="inline" size={14} /></a></span><br />
              <span><Sparkles className="inline pr-2" /> Starwall</span><br />
            </>
            : <>
              <span><Sparkles className="inline pr-2" /> <a href="https://github.com/MeepChangeling" target="_blank"> MeepChangeling <SquareArrowOutUpRight className="inline" size={14} /></a></span><br />
            </>
          }
        </span>
      </span>
      <span className="text-xl"><MoonStar className="inline pr-2 ml-[7em]" size={32} /> Minor</span>
      <span className="flex">
        <span className="flex-1">
          <svg width="240" height="100" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(-40, -10) scale(0.4)">
              <path id="svg_3" d="m179.45002,183.97498l9.54922,0l2.95078,-8.78524l2.95078,8.78524l9.54921,0l-7.72546,5.42952l2.95093,8.78524l-7.72547,-5.42966l-7.72547,5.42966l2.95093,-8.78524l-7.72547,-5.42952z" stroke="#000" fill="#fff" />
              <path id="svg_5" d="m226.45,220.97498l9.54922,0l2.95078,-8.78524l2.95078,8.78524l9.54922,0l-7.72547,5.42952l2.95094,8.78524l-7.72547,-5.42966l-7.72547,5.42966l2.95094,-8.78524l-7.72547,-5.42952z" stroke="#000" fill="#fff" />
              <path id="svg_6" d="m239.45,116.97495l9.54922,0l2.95078,-8.78524l2.95078,8.78524l9.54922,0l-7.72547,5.42952l2.95094,8.78524l-7.72547,-5.42966l-7.72547,5.42966l2.95094,-8.78524l-7.72547,-5.42952z" stroke="#000" fill="#fff" />
              <path id="svg_7" d="m476.45001,128.97495l9.54922,0l2.95078,-8.78524l2.95078,8.78524l9.54922,0l-7.72547,5.42952l2.95094,8.78524l-7.72547,-5.42966l-7.72547,5.42966l2.95094,-8.78524l-7.72547,-5.42952z" stroke="#000" fill="#fff" />
              <path id="svg_8" d="m551.45003,151.97501l9.54922,0l2.95078,-8.78524l2.95078,8.78524l9.54922,0l-7.72547,5.42952l2.95094,8.78524l-7.72547,-5.42966l-7.72547,5.42966l2.95094,-8.78524l-7.72547,-5.42952z" stroke="#000" fill="#fff" />
              <path id="svg_9" d="m383.45004,120.97498l9.54922,0l2.95078,-8.78524l2.95078,8.78524l9.54922,0l-7.72547,5.42952l2.95094,8.78524l-7.72547,-5.42966l-7.72547,5.42966l2.95094,-8.78524l-7.72547,-5.42952z" stroke="#000" fill="#fff" />
              <path id="svg_10" d="m274.45002,165.97498l9.54922,0l2.95078,-8.78524l2.95078,8.78524l9.54922,0l-7.72547,5.42952l2.95094,8.78524l-7.72547,-5.42966l-7.72547,5.42966l2.95094,-8.78524l-7.72547,-5.42952z" stroke="#000" fill="#fff" />
              <line id="svg_18" y2="226.00005" x2="240.0001" y1="186.00004" x1="191.00009" stroke="mediumpurple" fill="none" />
              <line id="svg_19" y2="132.00004" x2="487.00014" y1="156.00004" x1="564.00015" stroke="mediumpurple" fill="none" />
              <line id="svg_20" y2="170.00004" x2="287.0001" y1="124.00003" x1="395.00012" stroke="mediumpurple" fill="none" />
              <line id="svg_21" y2="120.00003" x2="252.0001" y1="185.00004" x1="191.00009" stroke="mediumpurple" fill="none" />
              <line id="svg_22" y2="124.00003" x2="394.00012" y1="131.00004" x1="488.00014" stroke="mediumpurple" fill="none" />
              <line id="svg_23" y2="170.00004" x2="289.00011" y1="224.00005" x1="239.0001" stroke="mediumpurple" fill="none" />
              <line id="svg_24" y2="171.00004" x2="289.00011" y1="121.00003" x1="252.0001" stroke="mediumpurple" fill="none" />
            </g >
          </svg>
        </span>
        <span className="flex-1">
          {/* <span><Sparkle className="inline pr-2" /><a href="" target="_blank"> placeholder <SquareArrowOutUpRight className="inline" size={14} /></a></span><br /> */}
          {/* <span><Sparkle className="inline pr-2" /> contribute to be added</span><br /> */}
        </span>
      </span>
      <span className="text-center block text-[dimgray] mt-4">Created with <Heart size={14} className="inline" /> by <Link href={`/easteregg?redirect=${window?.location?.href || "/" + name}`} style={{ color: "#60677c" }}>CodaBool</Link></span>
      {name.includes("lancer") && <span className="text-center block text-[dimgray] mt-4">Stargazer is not an official Lancer product<br />Lancer is copyright Massif Press</span>}
      <span className="text-center">
        <Link href={`/legal?redirect=${window?.location?.href || "/" + name}`} className="hover:underline text-sm inline text-[#8A8A8A]">
          Full Disclaimer
        </Link>
      </span>
    </>
  )
}
