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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { LoaderCircle, X } from "lucide-react"
import { useMemo, useState } from "react"
import dynamic from "next/dynamic"
import 'react-quill-new/dist/quill.bubble.css'
import { getConsts } from "@/lib/utils"

export default function CreateLocation({ map }) {
  // https://github.com/zenoamaro/react-quill/issues/921
  const Editor = useMemo(() => dynamic(() => import("react-quill-new"), { ssr: false }), [])
  const { data: session, status } = useSession()
  // const {  } = getConsts(map)
  const [submitting, setSubmitting] = useState()
  const router = useRouter()
  const form = useForm()

  if (status === "unauthenticated") {
    setTimeout(() => {
      router.replace('/contribute')
    }, 0)
    return (
      <LoaderCircle className="animate-spin mt-[48px] mx-auto" />
    )
  } else if (!session) {
    return (
      <LoaderCircle className="animate-spin mt-[48px] mx-auto" />
    )
  }

  async function submit(body) {
    body.map = map
    body.table = "location"
    setSubmitting(true)
    const res = await fetch('/api/contribute', {
      method: 'POST',
      body: JSON.stringify(body)
    })
    const response = await res.json()
    setSubmitting(false)
    // TODO: type selection doesn't get reset to "Type"'
    form.reset()
    if (response.msg) {
      toast.success(response.msg)
      router.replace(`/contribute/${map}`)
    } else {
      console.error(response.error)
      toast.warning("Could not create a new location at this time")
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="space-y-8 md:container mx-auto my-8">
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Create a new {map} core feature</CardTitle>
              <Button variant="ghost" className="cursor-pointer" onClick={e => {
                e.preventDefault()
                router.push(`/contribute/${map}`)
              }}>
                <X />
              </Button>
            </div>
            <CardDescription className="select-text">Add a new feature to the shared core map. To edit an existing location, select it below. For other issues submit on the <a className="text-blue-50" href="https://github.com/CodaBool/community-vtt-maps/issues" target="_blank">issues</a> page. Or DM <b>CodaBool</b> by searching in the <a href="https://discord.gg/foundryvtt" className="text-blue-50" target="_blank">FoundryVTT</a> Discord</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              rules={{ required: "You must give a location name" }}
              name="name"
              defaultValue=""
              render={({ field }) => (
                <FormItem className="py-4">
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Name" {...field} className="font-mono" />
                  </FormControl>
                  {/* <FormDescription>
                    The location name
                  </FormDescription> */}
                  <FormMessage />
                </FormItem >
              )}
            />
            <FormField
              control={form.control}
              rules={{ required: "Pick a location type" }}
              name="type"
              defaultValue=""
              render={({ field }) => (
                <FormItem className="py-4">
                  <FormLabel>Type</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className="w-full cursor-pointer">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="territory.polygon" className="cursor-pointer">Territory (polygon)</SelectItem>
                        <SelectItem value="cluster.polygon" className="cursor-pointer">Star Cluster (polygon)</SelectItem>
                        <SelectItem value="terrestrial.point" className="cursor-pointer">Terrestrial</SelectItem>
                        <SelectItem value="star.point" className="cursor-pointer">Star</SelectItem>
                        <SelectItem value="station.point" className="cursor-pointer">Station</SelectItem>
                        <SelectItem value="gate.point" className="cursor-pointer">Gate</SelectItem>
                        <SelectItem value="jovian.point" className="cursor-pointer">Jovian</SelectItem>
                        <SelectItem value="moon.point" className="cursor-pointer">Moon</SelectItem>
                      </SelectContent>
                    </Select >
                  </FormControl>
                  <FormDescription>
                    Category for the location
                  </FormDescription>
                  <FormMessage />
                </FormItem >
              )}
            />
            <FormField
              control={form.control}
              rules={{ required: "This location must have coordinates" }}
              name="coordinates"
              defaultValue=""
              render={({ field }) => (
                <FormItem className="py-4">
                  <FormLabel>Coordinates</FormLabel>
                  <FormControl>
                    <Input placeholder="-24, 601" {...field} className="font-mono" />
                  </FormControl>
                  <FormDescription>
                    The x and y coordinates for this location. Use the <a href="/lancer?c=1" className="text-blue-50" target="_blank">Find Coordinates</a> control to determine this. If you're unsure about a coordinate, mention that in your description. Use a comma to separate the x and y values.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="faction"
              defaultValue=""
              render={({ field }) => (
                <FormItem className="py-4">
                  <FormLabel>Faction (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Raiders" {...field} className="font-mono" />
                  </FormControl>
                  <FormDescription>
                    Who has control over the location
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="city"
              defaultValue=""
              render={({ field }) => (
                <FormItem className="py-4">
                  <FormLabel>Cities (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="City" {...field} className="font-mono" />
                  </FormControl>
                  <FormDescription>
                    A list of cities at this location, if there are multiple use a comma to separate them.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="alias"
              defaultValue=""
              render={({ field }) => (
                <FormItem className="py-4">
                  <FormLabel>Alias (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Alias" {...field} className="font-mono" />
                  </FormControl>
                  <FormDescription>
                    A list of aliases for this location, if there are multiple use a comma to separate them.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              rules={{ required: "Pick a location type" }}
              name="source"
              defaultValue=""
              render={({ field }) => (
                <FormItem className="py-4">
                  <FormLabel>Source of Information</FormLabel>
                  <FormControl>
                    <Input placeholder="Book pg. 404" {...field} className="font-mono" />
                  </FormControl>
                  <FormDescription>
                    Name and page number for the source material this location is from
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="unofficial"
              defaultValue={false}
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      className="cursor-pointer"
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Unofficial
                    </FormLabel>
                    <FormDescription>
                      Is this location from unofficial source material
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="destroyed"
              defaultValue={false}
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-2">
                  <FormControl>
                    <Checkbox
                      className="cursor-pointer"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Destroyed
                    </FormLabel>
                    <FormDescription>
                      Is this location destroyed
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="capital"
              defaultValue={false}
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      className="cursor-pointer"
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Capital
                    </FormLabel>
                    <FormDescription>
                      Is this location a capital for its faction
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              defaultValue=""
              rules={{ required: "You must provide detail in the description" }}
              render={({ field }) => (
                <FormItem className="py-4">
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Editor theme="bubble" value={field.value} onChange={field.onChange} className="border border-gray-800" />
                  </FormControl>
                  <FormDescription>
                    Description of the location. Selecting your written text allows for rich editing.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button disabled={submitting} type="submit" variant="outline" className="w-full cursor-pointer">
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
