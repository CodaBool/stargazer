'use client'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { toast } from "sonner"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { useSession, signIn } from "next-auth/react"
import { useForm } from "react-hook-form"
import { LoaderCircle, X } from "lucide-react"
import { useMemo, useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import 'react-quill-new/dist/quill.bubble.css'

export default function CreateComment({ map, locationId }) {
  const Editor = useMemo(() => dynamic(() => import("react-quill-new"), { ssr: false }), [])
  const { data: session, status } = useSession()
  const [submitting, setSubmitting] = useState()
  const router = useRouter()
  const form = useForm()

  async function submit(body) {
    body.table = "comment"
    body.map = map
    body.locationId = Number(locationId)
    setSubmitting(true)
    const res = await fetch('/api/contribute', {
      method: 'POST',
      body: JSON.stringify(body)
    })
    const response = await res.json();
    setSubmitting(false)
    form.reset()
    if (response.msg) {
      toast.success(response.msg)
      // TODO: this doesn't close comment form
      router.refresh()
    } else {
      console.error(response.error)
      toast.warning("Could not create a new comment at this time")
    }
  }

  if (status === "unauthenticated") {
    signIn()
    return (
      <LoaderCircle className="animate-spin m-4" />
    )
  } else if (!session) {
    return (
      <LoaderCircle className="animate-spin m-4" />
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="w-full">
        <Card className="">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Create Comment</CardTitle>
              <Link href={`/contribute/${map}/${locationId}`}>
                <Button variant="ghost">
                  <X />
                </Button>
              </Link>
            </div>
            <CardDescription>Selecting your written text allows for rich editing.</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="content"
              defaultValue=""
              rules={{ required: "This is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Editor theme="bubble" value={field.value} onChange={field.onChange} className="border border-gray-800" />
                  </FormControl>
                  <FormMessage />
                </FormItem >
              )}
            />
          </CardContent>
          <CardFooter>
            <Button disabled={submitting} type="submit" variant="outline" className="w-full">
              {submitting
                ? <LoaderCircle className="animate-spin" />
                : "Submit"
              }
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form >
  )
}
