import ProfileForm from '@/components/forms/profile'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { getServerSession } from 'next-auth'
import db from "@/lib/db"
import { redirect } from 'next/navigation'

export default async function Profile() {

  // auth
  const session = await getServerSession(authOptions)
  if (!session) redirect('/link?back=/&callback=/profile')
  const user = await db.user.findUnique({ where: { email: session.user.email } })
  if (!user) redirect('/link?back=/&callback=/profile')

  return (
    <ProfileForm user={user} />
  )
}
