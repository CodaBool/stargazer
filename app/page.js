import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { revalidatePath } from 'next/cache'
import { getServerSession } from "next-auth"
import db from "@/lib/db"
import MainMenu from "@/components/mainMenu"
import fs from 'fs'
import path from 'path'

export default async function ServerHome() {
  const session = await getServerSession(authOptions)
  const user = session ? await db.user.findUnique({ where: { email: session.user.email } }) : null
  let cloud = []
  if (user?.id) {
    cloud = await db.map.findMany({
      where: {
        userId: user.id,
      },
    })
  }

  const systemsPath = path.join(process.cwd(), 'public', 'systems')
  let systems = []

  try {
    systems = fs.readdirSync(systemsPath).map(s => s.split(".webp")[0])
    systems.push("custom")
  } catch (error) {
    console.error('Error reading systems directory:', error)
  }

  async function revalidate(path) {
    'use server'
    revalidatePath(path)
  }

  return (
    <MainMenu revalidate={revalidate} cloudMaps={cloud} user={user} systems={systems} />
  )
}
