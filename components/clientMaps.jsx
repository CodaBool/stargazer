'use client'
import Link from "next/link"
import { useEffect, useState } from "react"
import { Eye, Trash2, ArrowRightFromLine, Pencil, Save, Cloud, CloudDownload, Replace, CloudUpload, BookOpenCheck, Check, X, CloudOff, Copy, Download, RefreshCcw, EyeOff } from 'lucide-react'
import { Input } from "./ui/input"
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { combineAndDownload, isMobile } from "@/lib/utils"
import { toast } from "sonner"
import { create } from 'zustand'
import { useRouter } from 'next/navigation'

const useMaps = create(set => ({
  maps: {},
  setMaps: maps => set({ maps }),
}))

export default function ClientMaps({ map, revalidate, cloudMaps, session }) {
  const [nameInput, setNameInput] = useState()
  const [showNameInput, setShowNameInput] = useState()
  const maps = useMaps((state) => state.maps)
  const setMaps = useMaps((state) => state.setMaps)
  const router = useRouter()

  useEffect(() => {
    setMaps(JSON.parse(localStorage.getItem('maps')))
  }, [])

  function deleteMap(key) {
    if (window.confirm('Are you sure you want to delete this map?')) {
      const updatedMaps = { ...maps }
      delete updatedMaps[key]
      localStorage.setItem('maps', JSON.stringify(updatedMaps))
      setMaps(updatedMaps)
    }
  }

  function replaceRemoteMap(id, localMap) {
    fetch('/api/map', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ geojson: localMap.geojson, id }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          toast.warning(data.error)
        } else {
          setShowNameInput(false)
          revalidate(`/app/${map.map}/export`)
          toast.success(`Remote map for ${map.map} updated successfully`)
        }
      })
      .catch(error => {
        console.log(error)
        toast.warning("A server error occurred")
      })
  }

  function uploadMap(key, name) {
    const body = JSON.stringify(maps[key])
    fetch('/api/map', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body,
    })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          toast.warning(data.error)
        } else {
          toast.success(`${data.map.map} map, ${data.map.name}, successfully uploaded`)
          revalidate(`/app/${map}/export`)
        }
      })
      .catch(error => {
        console.log(error)
        toast.warning("A server error occurred")
      });
  }

  function editName(key, name) {
    setNameInput(name)
    setShowNameInput(key)
    setTimeout(() => {
      document.getElementById(`local-map-${key}`)?.focus()
    }, 200)
  }

  function saveName(key) {
    const updatedMaps = { ...maps, [key]: { ...maps[key], name: nameInput } }
    localStorage.setItem('maps', JSON.stringify(updatedMaps))
    setMaps(updatedMaps)
    setShowNameInput(false)
    setNameInput(null)
  }

  async function download(type, key) {
    try {
      const response = await fetch(`/api/download/${map}`)
      const data = await response.json()
      const localGeojson = maps[key].geojson
      const [finalData, fileType] = combineAndDownload(type, data, localGeojson)

      // Create and trigger file download
      const blob = new Blob([finalData], { type: fileType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${map}.${type}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading map:", error);
    }
  }

  if (!Object.entries(maps || {}).length) return (
    <p>You have no {map} maps saved locally. <Link href={`/${map}?new=1`} className="text-blue-300">Create a new map</Link></p>
  )


  return (
    <div className="flex items-center my-2 flex-wrap">
      {Object.entries(maps || {}).map(([key, data]) => {
        const [name, dateId] = key.split('-')
        const remote = cloudMaps.filter(m => m.name.trim() === data.name.trim())

        return (
          <div key={key} className="bg-gray-800 p-4 m-2 rounded w-full md:w-[440px]">
            {showNameInput === key
              ? <>
                <Input value={nameInput} className="w-[80%] mb-4 inline" id={`local-map-${key}`}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') saveName(key)
                  }}
                />
                <Save onClick={() => saveName(key)} size={22} className="cursor-pointer inline ml-4" />
              </>
              : <h2 className="text-2xl font-bold mb-4">{data.name} <Pencil onClick={() => editName(key, data.name)} size={16} className="cursor-pointer inline ml-4" /></h2>
            }
            <p className="text-gray-400 ">Created: {new Date(parseInt(dateId)).toLocaleDateString("en-US", {
              hour: "numeric",
              minute: "numeric",
              month: "long",
              day: "numeric",
            })}</p>
            <p className="text-gray-400 ">Updated: {new Date(data.updated).toLocaleDateString("en-US", {
              hour: "numeric",
              minute: "numeric",
              month: "long",
              day: "numeric",
            })}</p>
            <p className="text-gray-400 ">Locations: {data.geojson?.features.filter(f => f.geometry.type === "Point").length}</p>
            <p className="text-gray-400 ">Territories: {data.geojson?.features.filter(f => f.geometry.type.includes("Poly")).length}</p>
            <p className="text-gray-400">Guides: {data.geojson?.features.filter(f => f.geometry.type === "LineString").length}</p>
            <div className="grid grid-cols-2 gap-2">
              {/* <div className="flex justify-between items-center mt-4"> */}
              <Button className="cursor-pointer rounded m-2" onClick={() => router.push(`/${map}?id=${dateId}`)} variant="outline"><Eye /> View</Button>
              <Button className="text-red-500 cursor-pointer rounded m-2" variant="destructive" onClick={() => deleteMap(key)}><Trash2 /> Delete</Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Button className="cursor-pointer rounded m-2" disabled={!session} ><Cloud /> Upload</Button>
                </DialogTrigger>
                <DialogContent className="max-h-[40em] overflow-auto">
                  <DialogHeader>
                    <DialogTitle>Upload to Cloud</DialogTitle>
                    <DialogDescription>
                      You can either overwrite an existing remote map, or create a new one
                    </DialogDescription>
                  </DialogHeader>
                  <DialogClose asChild>
                    <Button size="lg" className="cursor-pointer rounded" onClick={() => uploadMap(key, data.name)}><CloudUpload /> Upload as a New Map</Button>
                  </DialogClose>

                  {remote.length > 0 &&
                    <>
                      <hr className="mt-2" />
                      <div className="flex justify-center"><Replace className="mr-2 mt-1" size={20} /> <span className="font-bold">Replace an existing Remote Map</span></div>
                      <p className="text-gray-400">Available Cloud Maps for replacement are shown below. Click on one to replace the remote data with your local data. To prevent data loss, you can only replace remote maps of the same name</p>
                      {remote.map(cloudMap => (
                        <DialogClose asChild key={cloudMap.id} >
                          <Card onClick={() => replaceRemoteMap(cloudMap.id, data)} className="cursor-pointer hover-grow">
                            <CardHeader>
                              <CardTitle>{cloudMap.name}</CardTitle>
                              <CardDescription>{new Date(cloudMap.updatedAt).toLocaleDateString("en-US", {
                                hour: "numeric",
                                minute: "numeric",
                                month: "long",
                                day: "numeric",
                              })}</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <p className="text-gray-400 ">Locations: {cloudMap.locations}</p>
                              <p className="text-gray-400 ">Territories: {cloudMap.territories}</p>
                              <p className="text-gray-400">Guides: {cloudMap.guides}</p>
                            </CardContent>
                          </Card>
                        </DialogClose>
                      ))}
                    </>
                  }
                </DialogContent>
              </Dialog>

              <Popover>
                <PopoverTrigger asChild>
                  <Button className="cursor-pointer rounded m-2"><Download /> Download</Button>
                </PopoverTrigger>
                <PopoverContent className="flex flex-col text-sm">
                  <p className='mb-3 text-gray-200'>This is your map data combined with the core map data</p>
                  <hr className='border my-2 border-gray-500' />
                  <p className='my-2 text-gray-300'>Topojson is a newer version of Geojson, and the recommended format for Stargazer</p>
                  <Button className="cursor-pointer w-full" variant="secondary" onClick={() => download("topojson", key)}>
                    <ArrowRightFromLine className="ml-[.6em] inline" /> Topojson
                  </Button>
                  <p className='my-2 text-gray-300'>Geojson is an extremely common spec for geography data</p>
                  <Button className="cursor-pointer w-full my-2" variant="secondary" onClick={() => download("geojson", key)}>
                    <ArrowRightFromLine className="ml-[.6em] inline" /> <span className="ml-[5px]">Geojson</span>
                  </Button>
                  <p className='my-2 text-gray-300'>KML can be imported into a <a href="https://www.google.com/maps/d/u/0/?hl=en" className='text-blue-300' target="_blank">Google Maps</a> layer. Which can be easily distributed publicly for free.</p>
                  <Button className="cursor-pointer w-full" variant="secondary" onClick={() => download("kml", key)}>
                    <ArrowRightFromLine className="ml-[.6em] inline" /> <span className="ml-[5px]">KML</span>
                  </Button>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        );
      })}
    </div>
  )
}

export function CloudMaps({ maps, revalidate, mapName }) {
  const [nameInput, setNameInput] = useState()
  const [showNameInput, setShowNameInput] = useState()
  const setMaps = useMaps((state) => state.setMaps)
  const router = useRouter()

  function putMap(body) {
    fetch('/api/map', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
    })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          toast.warning(data.error)
        } else {
          setShowNameInput(null)
          revalidate(`/app/${mapName}/export`)
          toast.success(`"${data.map.name}" successfully updated. Changes do not take effect immediately`)
        }
      })
      .catch(error => {
        console.log(error)
        toast.warning("A server error occurred")
      })
  }

  function deleteMap(id) {
    if (!window.confirm('Are you sure you want to delete this map?')) return
    fetch('/api/map', {
      method: 'DELETE',
      body: id,
    })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          toast.warning(data.error)
        } else {
          revalidate(`/app/${mapName}/export`)

          toast.success(`${data.map.name} deleted`)
          // Optionally, you can add code here to update the UI after deletion
        }
      })
      .catch(error => {
        console.log(error)
        toast.warning("A server error occurred")
      })
  }

  async function saveLocally(id) {
    const response = await fetch(`/api/map?id=${id}`)
    const data = await response.json()
    const key = `${mapName}-${Date.now()}`
    const prev = JSON.parse(localStorage.getItem('maps')) || {}
    const newMaps = {
      ...prev, [key]: {
        geojson: JSON.parse(data.geojson),
        name: data.name,
        updated: Date.now(),
        map: mapName,
      }
    }
    localStorage.setItem('maps', JSON.stringify(newMaps))
    setMaps(newMaps)
    toast.success("Map saved locally")
  }

  return (
    <div className="flex items-center my-2 flex-wrap justify-start">
      {maps.map(map =>
        <div className="bg-gray-800 p-4 rounded shadow-lg m-2 min-w-full md:min-w-[25em]" key={map.id}>
          {showNameInput
            ? <>
              <Input value={nameInput} className="w-[80%] mb-4 inline" id={`local-map-${map.id}`}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') putMap({ name: nameInput, id: map.id })
                }}
              />
              <Save onClick={() => putMap({ name: nameInput, id: map.id })} size={22} className="cursor-pointer inline ml-4" />
            </>
            : <h2 className="text-2xl font-bold mb-4">{map.name} <Pencil onClick={() => { setNameInput(map.name); setShowNameInput(map.id) }} size={16} className="cursor-pointer inline ml-4" /></h2>
          }
          <p className="text-gray-400 ">Created: {new Date(map.createdAt).toLocaleDateString("en-US", {
            hour: "numeric",
            minute: "numeric",
            month: "long",
            day: "numeric",
          })}</p>
          <p className="text-gray-400 ">Updated: {new Date(map.updatedAt).toLocaleDateString("en-US", {
            hour: "numeric",
            minute: "numeric",
            month: "long",
            day: "numeric",
          })}</p>
          <p className="text-gray-400 ">Locations: {map.locations}</p>
          <p className="text-gray-400 ">Territories: {map.territories}</p>
          <p className="text-gray-400">Guides: {map.guides}</p>
          <p className="text-gray-400">Published:
            {map.published
              ? <>
                <Check className="inline text-blue-300 relative top-[-3px] ms-1" />
                {navigator.clipboard
                  ? <Button size="sm" className="cursor-pointer rounded" variant="ghost" onClick={() => navigator.clipboard.writeText(`https://starlazer.vercel.app/${map.map}/${map.id}`)}><Copy />Share Code</Button>
                  : <Input value={map.id} readOnly className="inline ms-2 w-20" />
                }
              </>
              : <X className="inline text-red-200 relative top-[-3px] ms-1" />
            }
          </p>


          <div className="grid grid-cols-2 gap-2">
            <Button className="cursor-pointer rounded m-2" onClick={() => saveLocally(map.id)} variant="outline"><CloudDownload /> Save Locally</Button>
            <Button className="cursor-pointer rounded m-2" disabled={!map.published} variant="outline" onClick={() => router.push(`/${map.map}/${map.id}`)}><Eye /> View</Button>
            {map.published
              ? <Button className="cursor-pointer rounded mr-2 m-2" onClick={() => putMap({ published: !map.published, id: map.id })}><CloudOff /> Unpublish</Button>
              : <Button className="cursor-pointer rounded mr-2 m-2" onClick={() => putMap({ published: !map.published, id: map.id })}><BookOpenCheck /> Publish</Button>
            }
            <Button className="text-red-500 cursor-pointer rounded m-2" variant="destructive" onClick={() => deleteMap(map.id)}><Trash2 /> Delete</Button>
          </div>
        </div>
      )
      }
    </div >
  )
}


export function FoundryLink({ secret }) {
  const [submitting, setSubmitting] = useState()
  const [showSecret, setShowSecret] = useState()
  const [secretValue, setSecretValue] = useState(secret)

  async function refreshSecret() {
    if (!window.confirm('Create a new secret? Only do this if your current secret was leaked. This will make any application using your current secret invalid.')) return
    setSubmitting(true)
    const res = await fetch('/api/profile', {
      method: 'PUT',
      body: JSON.stringify({
        refreshSecret: true,
      })
    })
    const response = await res.json()
    setSubmitting(false)
    if (response.secret) {
      toast.success("Successfully refreshed secret")
      setSecretValue(response.secret)
      setShowSecret(true)
    } else {
      console.error(response.error)
      toast.warning("Could not refresh secret at this time")
    }
  }

  return (
    <>
      {navigator.clipboard
        ? <Button size="sm" className="cursor-pointer rounded my-4" variant="ghost" onClick={() => navigator.clipboard.writeText(secretValue)}><Copy />API Key</Button>
        : <div className="flex items-center">
          <Input value={secretValue} readOnly className="my-4 mx-0 flex-grow" type={showSecret ? 'text' : 'password'} />
          <Button size="sm" className="cursor-pointer rounded ml-2" variant="outline" onClick={() => setShowSecret(!showSecret)}>
            {showSecret ? <EyeOff /> : <Eye />}
          </Button>
        </div>
      }
      <Button size="sm" className="cursor-pointer rounded" variant="destructive" onClick={refreshSecret} disabled={submitting}>
        <RefreshCcw />Request New Secret
      </Button>
    </>
  )
}
