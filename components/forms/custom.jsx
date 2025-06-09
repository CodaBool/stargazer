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
import { localGet, localSet } from "@/lib/utils"

const templates = ["xeno", "neuropunk", "mousewars", "postwar", "crusaiders"]

export default function CreateLocation({ map }) {
  const [submitting, setSubmitting] = useState()
  const router = useRouter()
  const form = useForm()

  async function submit(body) {
    setSubmitting(true)
    let template = ""
    templates.forEach(t => {
      if (body.name.includes(t)) template = t
    })
    if (template) {
      if (template === "xeno") {
        router.push(`https://map.weylandyutani.company`)
      } else if (template === "neuropunk") {
        router.push(`https://www.nightcity.io/red`)
      } else if (template === "crusaiders") {
        router.push(`https://jambonium.co.uk/40kmap`)
      } else {
        router.push(`/${template}/export`)
      }
    } else {
      localGet('maps').then(r => {
        r.onsuccess = () => {
          const time = Date.now()
          localSet("maps", {
            ...r.result || {},
            [`custom-${time}`]: {
              config: {},
              name: body.name,
              updated: Date.now(),
              id: time,
              map: "custom",
              geojson: { type: "FeatureCollection", features: [] },
            },
          })
          router.push(`/custom/export`)
        }
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="space-y-8 md:container mx-auto my-8">
        <Card className="mx-auto max-w-2xl rounded">
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
                  <FormLabel>Map Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Name" {...field} className="font-mono" />
                  </FormControl>
                  <FormMessage />
                </FormItem >
              )}
            />
            {/* <FormField
              control={form.control}
              name="file"
              rules={{ required: false }}
              render={({ field }) => (
                <FormItem className="py-4">
                  <FormLabel>Upload Map Data (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept=".geojson,.topojson,.json"
                      onChange={(e) => {
                        window.alert("uploading files not supported at this time")
                        return
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
            /> */}
          </CardContent>
          <CardFooter>
            <Button disabled={submitting} type="submit" variant="outline" className="w-full cursor-pointer">
              {submitting
                ? <LoaderCircle className="animate-spin" />
                : "Get Started"
              }
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form >
  )
}
