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
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { ArrowLeft, LoaderCircle, User, X } from "lucide-react"
import { useState } from "react"
import Avatar from 'boring-avatars'
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export default function CreateLocation({ user }) {
  const [submitting, setSubmitting] = useState()
  const router = useRouter()
  const form = useForm()

  // console.log("user", user)

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

  async function deleteAccount() {
    const confirmed = window.confirm(
      'This will permanently delete account and all identifiable data. Your community contributions are NOT removed but instead anonymized (attributed to "anonymous"). This is done to preserve discussions.'
    )
    if (!confirmed) return

    try {
      const res = await fetch('/api/profile', { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        console.error("Delete account error:", data.error || res.statusText)
        toast.error("Could not delete account at this time")
        return
      }
      toast.success("Account deleted")
      setTimeout(() => {
        signOut({ callbackUrl: "/" })
      }, 1_500)
    } catch (err) {
      console.error(err)
      toast.error("Unexpected error deleting account")
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
                <Button variant="ghost" type="button">
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
            {user.premium && <Badge>Premium User</Badge>}
            {user.vip && <Badge>VIP</Badge>}
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
                    This is the name that is publically shown on your contributions. This name also used as a seed for your avatar.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col gap-4 w-full">
            {!user.premium && (
              <>
                <Button onClick={() => router.push("/checkout")} type="button" variant="outline" className="w-full">
                  Purchase Premium
                </Button>
                <p className="text-slate-400 mb-8 text-sm">Premium is a one time purchase which allows for unlimited map uploads. As well as disables the 90 day auto-delete policy for map uploads.</p>
              </>
            )}
            <Button disabled={submitting} type="submit" variant="" className="w-full">
              {submitting
                ? <LoaderCircle className="animate-spin" />
                : "Save Changes"
              }
            </Button>

            <Accordion type="single" collapsible className="w-full mt-6">
              <AccordionItem value="danger" className="">
                <AccordionTrigger className="cursor-pointer px-4 text-gray-400">
                  Danger Zone
                </AccordionTrigger>

                <AccordionContent className="px-4 pb-4">
                  <div className="flex flex-col gap-3">
                    <Button
                      variant="destructive"
                      className="w-full"
                      type="button"
                      onClick={deleteAccount}
                    >
                      Delete Account
                    </Button>

                    <Button
                      variant="destructive"
                      className="w-full"
                      type="button"
                      onClick={() => signOut({ callbackUrl: "/" })}
                    >
                      Sign out
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

          </CardFooter>
        </Card>
      </form>
    </Form >
  )
}
