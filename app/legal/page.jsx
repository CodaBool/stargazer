import { ArrowLeft, Heart, Map, Terminal, Gavel } from 'lucide-react'
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

export default async function Page({ searchParams }) {
  const { redirect } = await searchParams
  const redirectUrl = redirect || '/'

  return (
    <Card className="mx-auto my-8 max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle><Gavel className='inline' />  Legal</CardTitle>
          <Link href={redirectUrl}>
            <Button variant="ghost">
              <ArrowLeft />
            </Button>
          </Link>
        </div>
        <CardDescription>This project is created for educational and entertainment purposes only</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-w-3xl space-y-6">
          <p>Stargazer is not an official Lancer product; it is a third party work, and is not affiliated with Massif Press. Stargazer is published via the Lancer <a href="https://massifpress.com/legal" className="text-blue-300 hover:underline" target="_blank">Third Party License.</a></p>
          <p className="text-gray-200">All code written for Stargazer is licensed under GNU General Public License v3.0 and is freely available from the project's <a href="https://github.com/codabool/stargazer" className="text-blue-300 hover:underline" target="_blank">GitHub repository</a>.</p>

          <hr />
          <h1 className='text-2xl'>Credits</h1>
          <p>Shaders for the planets were written by <a href="https://deep-fold.itch.io" className="text-blue-300 hover:underline" target="_blank">Deep Fold</a> and <a href="https://github.com/Timur310" className="text-blue-300 hover:underline" target="_blank">@Timur310</a></p>
          <p>The Lancer map would not have been possible without the work of <a href="https://janederscore.tumblr.com" className="text-blue-300 hover:underline" target="_blank">Janederscore</a>! Additional thank you to Starwall</p>
        </div>
      </CardContent>
    </Card>
  )
}
