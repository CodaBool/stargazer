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
import { useForm } from "react-hook-form"
import { LoaderCircle, X } from "lucide-react"
import { useMemo, useState } from "react"
import 'react-quill-new/dist/quill.bubble.css'
import randomName from '@scaleway/random-name'
import Link from "next/link"

const templates = ["xeno", "neuropunk", "mousewars", "postwar", "crusaiders"]

export default function CreateLocation({ map }) {
  // https://github.com/zenoamaro/react-quill/issues/921
  const [submitting, setSubmitting] = useState()
  const router = useRouter()
  const form = useForm()

  async function submit(body) {
    let matchedTemplate = "mousewars"
    if (!templates.some(t => {
      if (body.name.includes(t)) matchedTemplate = t
      return body.name.includes(t)
    })) {
      window.alert("from scratch custom maps are not yet supported")
      return
    }
    console.log("submit", body)
    console.log("matchedTemplate", matchedTemplate)
    if (body.file) console.log("file content", JSON.parse(body.file))
    // return
    setSubmitting(true)
    router.push(`/${matchedTemplate}`)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="space-y-8 md:container mx-auto my-8">
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Create a new map</CardTitle>
              <Link href="/custom/export">
                <Button type="button" variant="ghost" className="cursor-pointer">
                  <X />
                </Button>
              </Link>
            </div>
            {/* <CardDescription className="select-text"> <a className="text-blue-50" href="https://github.com/CodaBool/community-vtt-maps/issues" target="_blank">issues</a> page. Or DM <b>CodaBool</b> by searching in the <a href="https://discord.gg/foundryvtt" className="text-blue-50" target="_blank">FoundryVTT</a> Discord</CardDescription> */}
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              rules={{ required: "Map name is required" }}
              name="name"
              defaultValue={randomName('', ' ')}
              render={({ field }) => (
                <FormItem className="py-4">
                  <FormLabel>Map Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Name" {...field} className="font-mono" />
                  </FormControl>
                  <FormMessage />
                </FormItem >
              )}
            />
            <FormField
              control={form.control}
              rules={{ validate: v => !isNaN(v) || "Value must be a number" }}
              name="zoom"
              defaultValue={1}
              render={({ field }) => (
                <FormItem className="py-4">
                  <FormLabel>Starting Zoom (optional)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder={1} {...field} />
                  </FormControl>
                  <FormDescription>
                    Controls the initial zoom level when first viewing the map
                  </FormDescription>
                  <FormMessage />
                </FormItem >
              )}
            />
            <FormField
              control={form.control}
              name="start"
              defaultValue=""
              render={({ field }) => (
                <FormItem className="py-4">
                  <FormLabel>Starting Coordinates (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="-24, 601" {...field} />
                  </FormControl>
                  <FormDescription>
                    Controls the initial x/Lat and y/Lng coordinate location when first viewing the map. Use a comma to separate the x/Lat and y/Lng values.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bounds"
              defaultValue=""
              render={({ field }) => (
                <FormItem className="py-4">
                  <FormLabel>Bounds (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="-24, 601" {...field} />
                  </FormControl>
                  <FormDescription>
                    Limits how far in any direction the map can be panned. Use this formatting "left, bottom, right, top"
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem className="py-4">
                  <FormLabel>Upload Map Data (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept=".geojson,.topojson,.json"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            field.onChange(reader.result);
                          };
                          reader.readAsText(file);
                        }
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Upload a GeoJSON or TopoJSON file to give the map starting data.
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
