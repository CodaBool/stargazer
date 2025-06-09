import Menu from "@/components/menu"
import { Toaster } from "@/components/ui/sonner"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { revalidatePath } from 'next/cache'
import { getServerSession } from "next-auth"
import React from 'react'

export default async function Contribute({ children }) {


  return (
    <>
      <Toaster />
      {children}
    </>
  )
}
