import Menu from "@/components/menu"
import { Toaster } from "@/components/ui/sonner"
import { ArrowLeft, Heart, Map, Terminal, Plus, WifiOff, Cloud, ArrowRightFromLine, LogIn, Download, Link as Chain } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import db from "@/lib/db"
import ClientMaps, { CloudMaps, FoundryLink, MapOverview } from '@/components/clientMaps'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { revalidatePath } from 'next/cache'


export default async function ExportAll({ params }) {
  const session = await getServerSession(authOptions)
  // const { map } = await params
  const user = session ? await db.user.findUnique({ where: { email: session.user.email } }) : null
  let cloud = []
  if (user?.id) {
    cloud = await db.map.findMany({
      where: {
        userId: user.id,
      },
    })
  }

  async function revalidate(path) {
    'use server'
    revalidatePath(path)
  }

  return (
    <>
      <Menu nav="true" path="/contribute" />
      <Toaster />
      <div className='text-white mx-auto md:container p-4 mt-2'>
        <div className='flex flex-col md:flex-row'>
          <h1 className='md:text-6xl text-4xl inline md:me-4'>All Maps</h1>
        </div>

        <h2 className='md:text-4xl text-2xl my-4'><WifiOff className='inline relative top-[-4px]' size={30} /> Local</h2>
        <h3 className='text-gray-300'>Saved in browser</h3>
        <MapOverview />

        <h2 className='md:text-4xl text-2xl my-4'><Cloud className='inline relative top-[-4px]' size={34} /> Cloud</h2>
        <h3 className='text-gray-300'>Saved remotely</h3>

        {/* TODO: should have a redirect param to this page */}
        {(user && cloud.length === 0) &&
          <p>You have no maps saved remotely</p>
        }
        {!user &&
          <h3 className='text-gray-300'>Provide an <Link href={`/api/auth/signin?callbackUrl=${process.env.NEXTAUTH_URL}/export`} className='text-blue-300'>email address</Link> to publish a map <LogIn className='animate-pulse inline relative top-[-1px] ms-1' size={18} /></h3>
        }
        <CloudMaps maps={cloud} revalidate={revalidate} showAll />
      </div>
    </>
  )
}
