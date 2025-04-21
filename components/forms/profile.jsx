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
import { LoaderCircle, User, X } from "lucide-react"
import { useState } from "react"
import Avatar from 'boring-avatars'

export default function CreateLocation({ user }) {
  const [submitting, setSubmitting] = useState()
  const router = useRouter()
  const form = useForm()

  async function submit(body) {
    if (!body.alias?.trim()) {
      form.setError("alias", {
        type: "manual",
        message: "Your alias must have content",
      })
      return
    }
    setSubmitting(true)
    const res = await fetch('/api/profile', {
      method: 'PUT',
      body: JSON.stringify({
        alias: body.alias?.trim(),
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

  const name = user.alias ? user.alias : user.email.split('@')[0]

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="container mx-auto mt-4">
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <div className="flex items-center">
              <Avatar
                // https://boringavatars.com/
                size={80}
                name={name}
                variant="beam"
                colors={[
                  '#DBD9B7',
                  '#C1C9C8',
                  '#A5B5AB',
                  '#949A8E',
                  '#615566',
                ]}
              />
              <CardTitle className="mx-8">Profile</CardTitle >
              <CardDescription>Let's keep things simple</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="alias"
              rules={{
                required: "Alias is required",
                maxLength: {
                  value: 16,
                  message: "Alias cannot exceed 16 characters",
                },
                pattern: {
                  value: /^[a-zA-Z0-9 _-]*$/,
                  message: "Alias can only contain letters, numbers, spaces, underscores, and dashes",
                },
              }}
              defaultValue={name}
              render={({ field }) => (
                <FormItem className="py-4">
                  <FormLabel><User size={18} className="inline" /> Alias</FormLabel>
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
