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

          <hr />
          <h1 className="text-2xl">Privacy Policy</h1>
          <p>This site does not use cookies or any tracking technologies.</p>
          <p>Users may optionally upload map data (e.g., GeoJSON) and submit comments. This content is stored solely to support the public sharing and discussion features of the application. No personal identifiers, analytics, or third-party tracking are collected or used.</p>
          <p>This site is not intended for use by individuals under the age of 13.</p>
          <p>If you would like your uploaded data removed, please email proxy.htrwd@passmail.com</p>

          <hr />
          <h1 className="text-2xl">Terms of Use</h1>
          <p>By using this site, you agree not to upload any content that is unlawful, harassing, infringing, or otherwise violates the rights of others.</p>
          <p>You retain ownership of your uploaded content but grant the site a non-exclusive license to display and share it as part of the public map archive.</p>
          <p>The site maintainer reserves the right to moderate or remove content at their discretion.</p>
          <p>Use of this service is provided "as is" with no guarantees of availability, performance, or data retention. This service is governed by the laws of the United States.</p>
        </div>
      </CardContent>
    </Card>
  )
}
