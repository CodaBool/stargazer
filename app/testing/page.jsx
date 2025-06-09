import Menu from "@/components/menu"
import { Toaster } from "@/components/ui/sonner"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { revalidatePath } from 'next/cache'
import { getServerSession } from "next-auth"
import ClientSide from "./client.jsx"
import React from 'react'
import db from "@/lib/db"

export default async function ServerHome() {
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
      <Toaster />
      <ClientSide revalidate={revalidate} cloud={cloud} />
    </>
  )
}
