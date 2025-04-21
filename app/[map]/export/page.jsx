import { ArrowLeft, Heart, Map, Terminal, Plus, WifiOff, Cloud, ArrowRightFromLine, LogIn, Download, Link as Chain } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import db from "@/lib/db"
import ClientMaps, { CloudMaps, FoundryLink } from '@/components/clientMaps'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { revalidatePath } from 'next/cache'

export default async function Export({ params }) {
  const session = await getServerSession(authOptions)
  const { map } = await params
  const user = session ? await db.user.findUnique({ where: { email: session.user.email } }) : null
  let cloud = []
  if (user?.id) {
    cloud = await db.map.findMany({
      where: {
        userId: user.id,
        map,
      },
    })
  }

  async function revalidate(path) {
    'use server'
    revalidatePath(path)
  }

  return (
    <div className='text-white mx-auto md:container p-4 mt-2'>
      <Link href={`/${map}`} className="w-[50px] block">
        <div className="w-[40px] h-[40px] rounded-2xl border border-[#1E293B]" style={{ background: "#070a0d" }}>
          <ArrowLeft size={32} className="relative left-[3px] top-[3px]" />
        </div>
      </Link>
      <div className='flex flex-col md:flex-row'>
        <h1 className='md:text-6xl text-4xl inline'>{map.charAt(0).toUpperCase() + map.slice(1)} Maps</h1>
        <div className='flex flex-col md:flex-row mt-4'>
          <Link href={`/${map}?new=1`} className=''>
            <Button className="cursor-pointer rounded pr-[1.8em] relative top-[-8px] w-full md:ms-[32px] mb-2" variant="secondary"><Plus /> New </Button>
          </Link>

          <Popover>
            <PopoverTrigger asChild>
              <Button className="cursor-pointer rounded relative top-[-8px] md:ms-[64px]" variant="secondary"><Download /> Download {map}</Button>
            </PopoverTrigger>
            <PopoverContent className="flex flex-col">
              <p className='mb-3 text-gray-200'>This is the base core data. Without any user submitted geography data</p>
              <hr className='border my-2 border-gray-500' />
              <p className='my-2 text-gray-300'>Topojson is a newer version of Geojson, and the recommended format for Stargazer</p>
              <Link href={`/api/download/${map}`}>
                <Button className="cursor-pointer w-full" variant="secondary">
                  <ArrowRightFromLine className="ml-[.6em] inline" /> Topojson
                </Button>
              </Link>
              <p className='my-2 text-gray-300'>Geojson is an extremely common spec for geography data</p>
              <Link href={`/api/download/${map}?format=geo`}>
                <Button className="cursor-pointer w-full my-2" variant="secondary">
                  <ArrowRightFromLine className="ml-[.6em] inline" /> <span className="ml-[5px]">Geojson</span>
                </Button>
              </Link>
              <p className='my-2 text-gray-300'>KML can be imported into a <a href="https://www.google.com/maps/d/u/0/?hl=en" className='text-blue-300' target="_blank">Google Maps</a> layer. Which can be easily distributed publicly for free.</p>
              <Link href={`/api/download/${map}?format=kml`}>
                <Button className="cursor-pointer w-full" variant="secondary">
                  <ArrowRightFromLine className="ml-[.6em] inline" /> <span className="ml-[5px]">KML</span>
                </Button>
              </Link>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button className="cursor-pointer rounded relative top-[-8px] md:mt-0 mt-2 md:ms-[32px]" variant="secondary"><Chain /> Foundry</Button>
            </PopoverTrigger>
            <PopoverContent className="flex flex-col w-[385px]">
              {session
                ? <>
                  <p className='mb-3 text-gray-200'>Link Foundry to your Stargazer account by pasting this secret into the module settings</p>
                  <hr className='border my-2 border-gray-500' />
                  <p className='text-sm text-gray-400'>Warning: this exposes your Stargazer account to some risk. All connected players and enabled modules in Foundry can read this value once entered. Local maps are always safe, this risk only applies to Cloud maps.</p>
                  <FoundryLink secret={user?.secret} />
                </>
                : <h3 className='text-gray-300 text-center'>Provide an <Link href={`/api/auth/signin?callbackUrl=${process.env.NEXTAUTH_URL}/${map}/export`} className='text-blue-300'>email address</Link> to link to Foundry <LogIn className='animate-pulse inline relative top-[-1px] ms-1' size={18} /></h3>
              }
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <h2 className='md:text-4xl text-2xl my-4'><WifiOff className='inline relative top-[-4px]' size={30} /> Local</h2>
      <h3 className='text-gray-300'>Saved in browser</h3>
      <ClientMaps map={map} revalidate={revalidate} cloudMaps={cloud} session={session} />

      <h2 className='md:text-4xl text-2xl my-4'><Cloud className='inline relative top-[-4px]' size={34} /> Cloud</h2>
      <h3 className='text-gray-300'>Saved remotely</h3>

      {/* TODO: should have a redirect param to this page */}
      {(user && cloud.length === 0) &&
        <p>You have no {map} maps saved remotely</p>
      }
      {!user &&
        <h3 className='text-gray-300'>Provide an <Link href={`/api/auth/signin?callbackUrl=${process.env.NEXTAUTH_URL}/${map}/export`} className='text-blue-300'>email address</Link> to publish a map <LogIn className='animate-pulse inline relative top-[-1px] ms-1' size={18} /></h3>
      }
      <CloudMaps maps={cloud} revalidate={revalidate} mapName={map} />
    </div>
  )
}
