import ProfileForm from '@/components/forms/profile'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { getServerSession } from 'next-auth'
import db from "@/lib/db"
import { redirect } from 'next/navigation'
import Menubar from '@/components/menu'
import { Toaster } from "@/components/ui/sonner"

export default async function Profile() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/contribute')
  const user = await db.user.findUnique({ where: { email: session.user.email } })
  if (!user) redirect('/contribute')

  return (
    <>
      <Menubar path={`/profile`} />
      <Toaster />
      <ProfileForm user={user} />
    </>
  )
}
