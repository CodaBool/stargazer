import { Button } from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Page({ searchParams }) {
  const { url } = searchParams

  if (url.startsWith('https://starlazer.vercel.app/') || !url.startsWith('https://')) {
    redirect(url)
  }

  return (
    <div className="flex items-center flex-col mt-[30vh]">
      <p className="max-w-xl text-center">You are leaving the site. Do you trust this domain?</p>
      <p className="py-10 text-red-300 font-extrabold">{url}</p>
      <Link href={url}>
        <Button variant="">I trust it</Button >
      </Link >
    </div>
  )
}
