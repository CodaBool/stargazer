import { Button } from "@/components/ui/button";
import { ArrowLeft, User } from "lucide-react";
import Link from "next/link";
import { redirect as sendTo } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default async function Page({ searchParams }) {
  const { back, url, callback } = await searchParams
  const backUrl = back || '/'

  if (url) {
    if (url.startsWith('https://stargazer.vercel.app/') || !url.startsWith('https://')) {
      sendTo(url)
    }
    // external site
    return (
      <div className="flex items-center flex-col mt-[30vh]">
        <p className="max-w-xl text-center">You are leaving the site. Do you trust this domain?</p>
        <p className="py-10 text-red-300 font-extrabold">{url}</p>
        <Link href={url}>
          <Button variant="">I trust it</Button >
        </Link >
      </div>
    )
  } else {
    // pre-Auth screen
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Card className="mx-auto my-8 max-w-2xl" scifi="true">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle><User className='inline' /> Login</CardTitle>
              <Link href={backUrl}>
                <Button variant="ghost">
                  <ArrowLeft />
                </Button>
              </Link>
            </div>
            <CardDescription className="my-5 leading-8">To continue we need to authenticate you</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/login?callback=${callback}`}>
              <Button className="cursor-pointer w-full" variant="scifi">Login</Button>
            </Link >
          </CardContent>
        </Card>
      </div>
    )
  }
}
