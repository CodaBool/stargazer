import { ArrowLeft, BadgeCheck } from 'lucide-react'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from 'next/image'
import db from "@/lib/db"

import { Input } from '@/components/ui/input'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

export default async function Page() {

  // auth
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login?back=/&callback=/checkout/redeem/help')
  const user = await db.user.findUnique({ where: { email: session.user.email } })
  if (!user) redirect('/login?back=/&callback=/checkout/redeem/help')


  return (
    <div className='starfield'>
      <Card className="mx-auto my-8 max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle><BadgeCheck className='inline mb-1' />  Redeem from FoundryVTT</CardTitle>
            <Link href="/profile">
              <Button variant="ghost">
                <ArrowLeft />
              </Button>
            </Link>
          </div>
          <CardDescription>Here you can find help on how to redeem premium from your FoundryVTT module purchase. This requires you to have purchased <a href="https://www.foundryvtt.store/products/map" className='text-blue-300' target="_blank">Map - Stargazer</a></CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-3xl space-y-6">
            <ol className="list-decimal space-y-3 pl-6 text-gray-200">
              <li className="leading-relaxed">
                Install <span className="font-medium text-white">Map - Stargazer</span> Foundry module
              </li>
              <li className="leading-relaxed">
                Set module to <span className="font-medium text-white">active</span>
              </li>
              <li className="leading-relaxed">
                Copy your <span className="font-medium text-white">secret</span>
              </li>

              <Input value={user.secret} className="my-4" readOnly />

              <li className="leading-relaxed">
                Place your secret in the <span className="font-medium text-white">Stargazer Secret</span> setting and save



              </li>
              <Image src="/tutorial/secret.webp" className='m-auto my-2' width={861} height={149} alt="Secret Image" />

              <li className="leading-relaxed">
                Open your <span className="font-medium text-white">Map Manager</span> to Extra and press
                <span className="font-medium text-white"> Free Stargazer Premium</span>
                <Image src="/tutorial/tutorial_redeem.webp" className='m-auto my-2' width={996} height={446} alt="redeem Image" />

              </li>
            </ol>






          </div>
        </CardContent>
      </Card>
    </div>
  )
}
