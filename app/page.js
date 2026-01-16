import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { cache } from 'react'
import { revalidatePath } from 'next/cache'
import { getServerSession } from "next-auth"
import db from "@/lib/db"
import MainMenu from "@/components/mainMenu"
import fs from 'fs'
import path from 'path'
import { headers } from 'next/headers'

export default async function ServerHome() {
  const bot = await isBotRequest()
  if (bot) return <div className="flex items-center justify-center min-h-screen"><h1 className="text-8xl">🤖</h1></div>
  const session = await getServerSession(authOptions)
  const userId = session?.user && session?.user?.id
  let cloud = []
  if (userId) {
    cloud = await db.map.findMany({
      where: { userId },
    })
  }
  const systems = getSystems()
  async function revalidate(path) {
    'use server'
    revalidatePath(path)
  }
  return (
    <MainMenu revalidate={revalidate} cloudMaps={cloud} session={session} systems={systems} />
  )
}

const getSystems = cache(() => {
  const systemsPath = path.join(process.cwd(), 'public', 'systems')
  const names = fs.readdirSync(systemsPath).map(s => s.split(".webp")[0])
  names.push('custom')
  return names
})

async function isBotRequest() {
  const h = await headers()
  return /bot|crawler|spider|crawling|facebookexternalhit|slurp/i.test(h.get('user-agent') || '')
}
