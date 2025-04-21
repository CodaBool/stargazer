'use client'
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar"
import { Heart, Github, UserRound, Copyright, Sparkles, Telescope, SquareArrowOutUpRight, MoonStar, Sparkle, BookOpen, Bug, Pencil, Plus, MapPin, RectangleHorizontal, Map, ArrowRightFromLine, Hexagon, ListCollapse, User, LogOut, Ruler, CodeXml, Settings, HeartHandshake } from "lucide-react"
import Link from "next/link"
import { signOut, useSession } from "next-auth/react"

export default function Menu({ path, params }) {
  const { data: session } = useSession()

  return (
    <Menubar>

      <MenubarMenu>
        <MenubarTrigger>Menu</MenubarTrigger>
        <MenubarContent>
          <MenubarSub>
            <MenubarSubTrigger className="cursor-pointer"><Map size={16} className="mr-1" /> Maps</MenubarSubTrigger >
            <MenubarSubContent>
              <MenubarSub>
                <MenubarSubTrigger className="cursor-pointer"><Hexagon size={16} className="inline mr-1" /> Lancer</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem className="cursor-pointer" asChild>
                    <a href="/lancer">
                      <UserRound size={16} className="inline mr-1" /> Janederscore
                    </a>
                  </MenubarItem>

                  <MenubarItem className="cursor-pointer" asChild>
                    <a href="/lancer?variant=starwall">
                      <UserRound size={16} className="inline mr-1" /> Starwall
                    </a>
                  </MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
              <MenubarItem asChild>
                <a href="/fallout"><Settings size={16} className="inline mr-1" /> Fallout</a>
              </MenubarItem>
            </MenubarSubContent>
          </MenubarSub>


          <MenubarSub>
            <MenubarSubTrigger className="cursor-pointer"><ArrowRightFromLine size={16} className="mr-1" /> Export</MenubarSubTrigger >
            <MenubarSubContent>
              <MenubarSub>
                <MenubarSubTrigger className="cursor-pointer"><Hexagon size={16} className="inline mr-1" /> Lancer</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem className="cursor-pointer" asChild>
                    <a href="/lancer/export">
                      <UserRound size={16} className="inline mr-1" /> Janederscore
                    </a>
                  </MenubarItem>

                  <MenubarItem className="cursor-pointer" asChild>
                    <a href="/lancer_starwall/export">
                      <UserRound size={16} className="inline mr-1" /> Starwall
                    </a>
                  </MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
              <MenubarItem asChild>
                <a href="/fallout/export"><Settings size={16} className="inline mr-1" /> Fallout</a>
              </MenubarItem>
            </MenubarSubContent>
          </MenubarSub>

          <MenubarSub>
            <MenubarSubTrigger className="cursor-pointer"><HeartHandshake size={16} className="mr-1" /> Contribute</MenubarSubTrigger >
            <MenubarSubContent>
              <MenubarSub>
                <MenubarSubTrigger className="cursor-pointer"><Hexagon size={16} className="inline mr-1" /> Lancer</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem className="cursor-pointer" asChild>
                    <a href="/contribute/lancer">
                      <UserRound size={16} className="inline mr-1" /> Janederscore
                    </a>
                  </MenubarItem>

                  <MenubarItem className="cursor-pointer" asChild>
                    <a href="/contribute/lancer_starwall">
                      <UserRound size={16} className="inline mr-1" /> Starwall
                    </a>
                  </MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
              <MenubarItem asChild>
                <a href="/contribute/fallout"><Settings size={16} className="inline mr-1" /> Fallout</a>
              </MenubarItem>
            </MenubarSubContent>
          </MenubarSub>

          <MenubarItem asChild>
            <a href="/" className="cursor-pointer"><Map size={16} className="inline mr-1" /> Other Maps</a>
          </MenubarItem>

          {/* {(path === "/profile" || path === "/contribute") &&
            <MenubarSub>
              <MenubarSubTrigger className="cursor-pointer"><Heart size={16} className="mr-1" />Contribute</MenubarSubTrigger >
              <MenubarSubContent>
                <Link href={`/contribute/lancer`}>
                  <MenubarItem className="cursor-pointer">
                    <Hexagon size={16} className="inline mr-1" /> Lancer
                  </MenubarItem>
                </Link>
              </MenubarSubContent >
            </MenubarSub>
          } */}

          <a href="https://github.com/codabool/stargazer.vercel.app/issues" target="_blank">
            <MenubarItem inset className="cursor-pointer pl-2"><Bug size={16} className="inline mr-1" /> Issues</MenubarItem>
          </a>

        </MenubarContent>

      </MenubarMenu>

      {session &&
        <MenubarMenu>
          <MenubarTrigger className="cursor-pointer">Account</MenubarTrigger  >
          <MenubarContent>
            <MenubarSeparator />
            <Link href="/profile">
              <MenubarItem className="cursor-pointer pl-[.98em]">
                <User size={18} className="inline mr-1" /> Profile
              </MenubarItem >
            </Link>
            <MenubarItem onClick={signOut} className="ps-4 cursor-pointer">
              <LogOut size={16} className="inline mr-1" /> Sign out
            </MenubarItem >
          </MenubarContent>
        </MenubarMenu>
      }
    </Menubar>
  )
}
