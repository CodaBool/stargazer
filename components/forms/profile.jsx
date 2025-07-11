'use client'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
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
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { ArrowLeft, LoaderCircle, User, X } from "lucide-react"
import { useState } from "react"
import Avatar from 'boring-avatars'
import Link from "next/link"

export default function CreateLocation({ user }) {
  const [submitting, setSubmitting] = useState()
  const router = useRouter()
  const form = useForm()

  async function submit(body) {
    if (!body.name?.trim()) {
      form.setError("name", {
        type: "manual",
        message: "Your name must have content",
      })
      return
    }
    setSubmitting(true)
    const res = await fetch('/api/profile', {
      method: 'PUT',
      body: JSON.stringify({
        name: body.name?.trim(),
      })
    })
    const response = await res.json()
    setSubmitting(false)
    if (response.msg === "success") {
      toast.success("Profile successfully updated")
      router.refresh()
    } else {
      console.error(response.error)
      toast.warning("Could not update profile at this time")
    }
  }

  const name = user.name ? user.name : user.email.split('@')[0]

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="container mx-auto mt-4">
        <Card className="max-w-2xl md:mx-auto m-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Profile</CardTitle>
              <Link href="/">
                <Button variant="ghost">
                  <ArrowLeft />
                </Button>
              </Link>
            </div>
            <CardDescription>Let's keep things simple</CardDescription>

          </CardHeader>

          <CardContent>
            <Avatar
              // https://boringavatars.com/
              size={80}
              name={name}
              className="mx-auto"
              variant="beam"
              colors={[
                '#DBD9B7',
                '#C1C9C8',
                '#A5B5AB',
                '#949A8E',
                '#615566',
              ]}
            />
            <FormField
              control={form.control}
              name="name"
              rules={{
                required: "Name is required",
                maxLength: {
                  value: 16,
                  message: "Name cannot exceed 16 characters",
                },
                pattern: {
                  value: /^[a-zA-Z0-9 _-]*$/,
                  message: "Name can only contain letters, numbers, spaces, underscores, and dashes",
                },
              }}
              defaultValue={name}
              render={({ field }) => (
                <FormItem className="py-4">
                  <FormLabel><User size={18} className="inline" /> Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    This is the name that is publically shown on your contributions. This also used as a seed for your avatar.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button disabled={submitting} type="submit" variant="outline" className="w-full">
              {submitting
                ? <LoaderCircle className="animate-spin" />
                : "Save Changes"
              }
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form >
  )
}
