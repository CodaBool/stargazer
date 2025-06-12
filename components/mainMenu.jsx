'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Settings, ArrowLeft, Heart, Map, Terminal, Plus, WifiOff, Cloud, ArrowRightFromLine, LogIn, Download, Link as Chain, Eye, Trash2, CloudUpload, Replace, X, CloudDownload, BookOpenCheck, Copy, Check, CloudOff, RefreshCcw, EyeOff } from 'lucide-react'
import { topology } from "topojson-server"
import { toKML } from "@placemarkio/tokml"
import ThreejsPlanet from '@/components/threejsPlanet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Toggle } from "@/components/ui/toggle"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage
} from '@/components/ui/breadcrumb'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card'
import Image from 'next/image'
import lancerTitle from '@/public/lancer_title.webp'
import { toast } from "sonner"
import StarsBackground from "@/components/ui/starbackground"
import { useRouter } from 'next/navigation'
import { combineAndDownload, combineLayers, combineLayersForTopoJSON, isMobile, localGet, localSet } from "@/lib/utils"
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import Legal from "@/components/legal"
import PlanetBackground from '@/components/ui/PlanetBackground';

function FoundryLink({ secret }) {
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

export default function Home({ revalidate, cloudMaps, user }) {
  const [showUI, setShowUI] = useState()
  const [showTitle, setShowTitle] = useState()
  const [hashParts, setHashParts] = useState()
  const [dialog, setDialog] = useState()

  useEffect(() => {
    setTimeout(() => setShowTitle(true), 400)
    setTimeout(() => setShowUI(true), 100)
    // restore menu state
    const hash = window.location.hash
    if (hash) {
      setHashParts(hash.substring(1).split("_"))
      setDialog(true)
    }
  }, [])

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <PlanetBackground />

      {/* Settings Cog Dialog */}
      <div className="absolute top-4 right-4 z-50">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" className="md:w-20 md:h-20 w-16 h-16 p-0 m-0 cursor-pointer">
              <Settings className='md:w-16 md:h-16 h-8 w-[4em]' />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-black/80 border border-cyan-400 text-white max-w-md">
            <DialogTitle></DialogTitle>
            <DialogHeader>
              <DialogTitle className="text-cyan-400">Stargazer</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {/* <p className="hover:text-cyan-300 cursor-pointer">About</p> */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="scifi"><Chain /> Foundry</Button>
                </PopoverTrigger>
                <PopoverContent className="flex flex-col w-[385px]">
                  {user
                    ? <>
                      <p className='mb-3 text-gray-200'>Link Foundry to your Stargazer account by pasting this secret into the module settings</p>
                      <hr className='border my-2 border-gray-500' />
                      <p className='text-sm text-gray-400'>Warning: this exposes your Stargazer account to some risk. All connected players and enabled modules in Foundry can read this value once entered. Local maps are always safe, this risk only applies to Cloud maps.</p>
                      <FoundryLink secret={user?.secret} />
                    </>
                    : <h3 className='text-gray-300 text-center'>Provide an <Link href={`/api/auth/signin?callbackUrl=${process.env.NEXTAUTH_URL}/testing`} className='text-blue-300'>email address</Link> to link to Foundry <LogIn className='animate-pulse inline relative top-[-1px] ms-1' size={18} /></h3>
                  }
                </PopoverContent>
              </Popover>
              <Legal />

              {/* <p className="hover:text-cyan-300 cursor-pointer">Credits</p> */}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stargazer Title */}
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-40">
        <h1
          className={`text-4xl md:text-6xl font-extrabold text-white drop-shadow-lg transition-transform duration-1200 ${showTitle ? 'translate-y-0 opacity-100' : '-translate-y-38 opacity-0'
            }`}
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          Stargazer
        </h1>
      </div>

      {/* Lancer Dialog */}
      <div className="absolute md:bottom-20 bottom-45 left-1/2 transform -translate-x-1/2 z-40 space-y-4 text-center">
        <Dialog open={!!dialog} onOpenChange={(open) => !open && setDialog(null)}>
          <DialogTrigger asChild>
            <Button variant="scifi" onClick={() => setDialog(true)}
              className={`transition-opacity duration-1000 ${showUI ? 'opacity-100' : 'opacity-0'
                }`}
            >
              P1 Start
            </Button>
          </DialogTrigger>
          <DialogContent className="md:max-w-[610px] md:min-w-[620px] md:max-h-[430px] md:min-h-[430px]" scifi={true}>
            <DialogTitle />
            <MainMenu cloudMaps={cloudMaps} revalidate={revalidate} user={user} hash={hashParts || []} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

async function download(type, data) {
  try {
    let downloadData, finalFileType = "application/json"
    if (data.map === "custom") {
      const localGeojson = data.geojson
      if (type === "geojson") {
        downloadData = JSON.stringify(localGeojson)
      } else if (type === "kml") {
        const combinedGeojson = combineLayers([localGeojson]);
        downloadData = toKML(combinedGeojson)
        finalFileType = "application/vnd.google-earth.kml+xml"
      } else if (type === "topojson") {
        downloadData = JSON.stringify(topology(combineLayersForTopoJSON([localGeojson])))
      }

    } else {
      const response = await fetch(`/api/download/${data.map}`)
      const data = await response.json()
      const localGeojson = data.geojson
      const [finalData, fileType] = combineAndDownload(type, data, localGeojson)
      downloadData = finalData
      finalFileType = fileType
    }

    // Create and trigger file download
    const blob = new Blob([downloadData], { type: finalFileType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.map}.${type}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (error) {
    console.error("Error downloading map:", error);
  }
}

function deleteMapLocal(localMaps, map, setLocalMaps) {
  const updatedMaps = { ...localMaps }
  delete updatedMaps[`${map.map}-${map.id}`]
  localSet("maps", updatedMaps)
  setLocalMaps(updatedMaps)
}

function deleteMapRemote(id, revalidate) {
  fetch('/api/map', {
    method: 'DELETE',
    body: id,
  })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        toast.warning(data.error)
      } else {
        revalidate(`/testing`)
        toast.success(`${data.map.name} deleted`)
        // Optionally, you can add code here to update the UI after deletion
      }
    })
    .catch(error => {
      console.log(error)
      toast.warning("A server error occurred")
    })
}

function replaceRemoteMap(localMap, revalidate) {
  fetch('/api/map', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ geojson: localMap.geojson, id: localMap.id }),
  })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        toast.warning(data.error)
      } else {
        revalidate(`/testing`)
        toast.success(`Remote map for ${map.map} updated successfully`)
      }
    })
    .catch(error => {
      console.log(error)
      toast.warning("A server error occurred")
    })
}

function uploadMap(mapData, revalidate,) {
  const body = JSON.stringify(mapData)
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
        revalidate(`/testing`)
      }
    })
    .catch(error => {
      console.log(error)
      toast.warning("A server error occurred")
    });
}

async function saveLocally(map) {
  const response = await fetch(`/api/map?id=${map.id}`)
  const data = await response.json()
  const time = Date.now()
  const key = `${map.name}-${time}`
  localGet('maps').then(r => {
    r.onsuccess = () => {
      const newMaps = {
        ...r.result || {}, [key]: {
          geojson: JSON.parse(data.geojson),
          name: data.name,
          id: time,
          updated: time,
          map: mapName,
        }
      }
      localSet("maps", newMaps)
      setMaps(newMaps)
      toast.success("Map saved locally")
    }
  })
}

function putMap(body, revalidate) {
  console.log("put with", body, revalidate)
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
        revalidate(`/testing`)
        toast.success(`"${data.map.name}" successfully updated. Changes do not take effect immediately`)
      }
    })
    .catch(error => {
      console.log(error)
      toast.warning("A server error occurred")
    })
}

const systems = ['lancer', 'custom']

export function MainMenu({ cloudMaps, user, revalidate, hash }) {
  const [selectedSystem, setSelectedSystem] = useState(typeof hash === "object" ? hash[0] : null)
  const [selectedMap, setSelectedMap] = useState()
  const [localMaps, setLocalMaps] = useState()
  const [tab, setTab] = useState(typeof hash === "object" ? (hash[1] || "local") : null)
  const router = useRouter()

  useEffect(() => {
    localGet('maps').then(r => r.onsuccess = () => {
      setLocalMaps(r.result || {})
      // restore session
      if (typeof hash !== "object") return
      if (hash[2]) {
        if (hash[2].length === 36) {
          setSelectedMap((cloudMaps || []).find(m => m.id === hash[2]))
        } else {
          setSelectedMap(Object.values(r.result).find(m => m.id === Number(hash[2])))
        }
      }
    })
  }, [])

  useEffect(() => {
    if (!cloudMaps || !selectedMap) return
    // console.log("got a change in cloud maps, might need to update selectedMap", cloudMaps)
    if (selectedMap.hash) {
      const newCloudMap = cloudMaps.find(m => m.id === selectedMap.id)
      if (newCloudMap) setSelectedMap(newCloudMap)
    }
  }, [cloudMaps, selectedMap])

  useEffect(() => {
    if (selectedSystem && tab && selectedMap) {
      router.replace(`#${selectedSystem}_${tab}_${selectedMap.hash ? selectedMap.id : selectedMap.id}`)
    } else if (selectedSystem && tab) {
      router.replace(`#${selectedSystem}_${tab}`)
    } else if (selectedSystem) {
      router.replace(`#${selectedSystem}`)
    } else {
      router.replace("")
    }
  }, [selectedSystem, selectedMap, tab])

  return (
    <div className="" style={{ fontFamily: '"Press Start 2P", monospace' }}>
      {/* Breadcrumb */}
      <Breadcrumb className="absolute top-8 left-8">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink className="text-xs md:text-base" onClick={() => { setSelectedSystem(null); setSelectedMap(null); }}>Systems</BreadcrumbLink>
          </BreadcrumbItem>
          {selectedSystem && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem className="text-xs md:text-base" >
                <BreadcrumbLink onClick={() => setSelectedMap(null)}>{selectedSystem}</BreadcrumbLink>
              </BreadcrumbItem>
            </>
          )}
          {selectedMap && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem className="text-xs md:text-base" >
                <BreadcrumbPage>{selectedMap.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Buttons for selected system */}
      {selectedSystem && !selectedMap && (
        <div className="absolute top-4 right-16">
          {tab === "local" &&
            <Link href={`/${selectedSystem}/?new=1`} className='mr-4'>
              <Button variant="scifi" title="Create a new map"><Plus /></Button>
            </Link>
          }
          {selectedSystem !== "custom" &&
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="scifi" title="Download base map data"><Download /></Button>
              </PopoverTrigger>
              <PopoverContent className="flex flex-col w-80 bg-black/80 border border-cyan-400 text-white">
                <p className='mb-3 text-gray-200'>Download the base {selectedSystem} map features. Your added locations will not be included.</p>
                <hr className='border my-2 border-gray-500' />
                <p className='my-2 text-gray-300'>Topojson is a newer version of Geojson, and the recommended format for Stargazer</p>
                <Link href={`/api/download/${selectedSystem}`}>
                  <Button className="cursor-pointer w-full" variant="secondary">
                    <ArrowRightFromLine className="ml-[.6em] inline" /> Topojson
                  </Button>
                </Link>
                <p className='my-2 text-gray-300'>Geojson is a common spec for geography data</p>
                <Link href={`/api/download/${selectedSystem}?format=geo`}>
                  <Button className="cursor-pointer w-full my-2" variant="secondary">
                    <ArrowRightFromLine className="ml-[.6em] inline" /> <span className="ml-[5px]">Geojson</span>
                  </Button>
                </Link>
                <p className='my-2 text-gray-300'>KML can be imported into a <a href="https://www.google.com/maps/d/u/0/?hl=en" className='text-blue-300' target="_blank">Google Maps</a> layer. Which can be easily distributed publicly for free.</p>
                <Link href={`/api/download/${selectedSystem}?format=kml`}>
                  <Button className="cursor-pointer w-full" variant="secondary">
                    <ArrowRightFromLine className="ml-[.6em] inline" /> <span className="ml-[5px]">KML</span>
                  </Button>
                </Link>
              </PopoverContent>
            </Popover>
          }
        </div>
      )}

      {/* Buttons for selected map */}
      {selectedSystem && selectedMap && (
        <DetailedView data={selectedMap} revalidate={revalidate} user={user} setSelectedMap={setSelectedMap} setLocalMaps={setLocalMaps} localMaps={localMaps} />
      )}

      {/* Local and Remote tabs */}
      {selectedSystem && !selectedMap && (
        <Tabs defaultValue={tab} className="w-full h-[300px] mt-12" scifi={true} onValueChange={tab => setTab(tab)}>
          <TabsList className="w-full" scifi={true}>
            <TabsTrigger value="local" scifi={true}>Local</TabsTrigger>
            <TabsTrigger value="remote" scifi={true}>Remote</TabsTrigger>
          </TabsList>
          <TabsContent value="local" scifi={true}>

            {localMaps &&
              <div className='flex flex-wrap justify-evenly max-h-[205px] overflow-auto'>
                {Object.keys(localMaps).filter(i => i.split('-')[0] === selectedSystem).length === 0 &&
                  <p>No local {selectedSystem} maps found. <Link href={`/${selectedSystem}?new=1`} className="text-blue-300">Create a new map.</Link></p>
                }
                {Object.entries(localMaps).map(([key, data]) => {
                  const [system, dateId] = key.split('-')
                  if (system !== selectedSystem) return null
                  // console.log("text size", getSize(data.name))
                  return (
                    <Button variant="scifi" className="w-full m-0 p-0" onClick={() => setSelectedMap(data)} key={key}>
                      {data.name}
                    </Button>
                  )
                })}
              </div>
            }

          </TabsContent>
          <TabsContent value="remote" scifi={true}>
            {!user &&
              <h3 className='text-gray-300'>Provide an <Link href={`/api/auth/signin`} className='text-blue-300'>email address</Link> to publish a map <LogIn className='animate-pulse inline relative top-[-1px] ms-1' size={18} /></h3>
            }
            {Object.values(cloudMaps || {}).filter(m => m.map === selectedSystem).length === 0 &&
              <p>No remote {selectedSystem} maps found</p>
            }
            {cloudMaps &&
              <div className='flex flex-wrap justify-evenly max-h-[205px] overflow-auto'>
                {Object.values(cloudMaps).map(data => {
                  // console.log("data", data)
                  if (data.map !== selectedSystem) return null
                  return (
                    <Button variant="scifi" className="w-full m-0 p-0" onClick={() => setSelectedMap(data)} key={data.id}>
                      {data.name}
                    </Button>
                  )
                })}
              </div>
            }

          </TabsContent>
        </Tabs>
      )}

      {/* Systems view */}
      {!selectedSystem && (
        <div className="flex flex-wrap gap-2 justify-evenly mt-8">
          {systems.map((system) => (
            <div key={system}>
              {system === "lancer"
                ?
                <Card className="max-w-[250px] cursor-pointer lg:max-w-[269px] rounded-xl m-1" onClick={() => setSelectedSystem(system)}>
                  <CardContent className="p-2">
                    <StarsBackground>
                      <Image
                        src={lancerTitle}
                        alt="Lancer Map"
                        className="hover-grow rounded-xl"
                      />
                    </StarsBackground>
                  </CardContent>
                </Card>
                :
                <Card className="max-w-[250px] cursor-pointer lg:max-w-[269px] rounded-xl m-1" onClick={() => setSelectedSystem(system)}>
                  <CardContent className="p-2">
                    <StarsBackground>
                      <CardDescription className="text-center w-[225px] h-[225px] lg:w-[243px] lg:h-[243px] hover-grow">
                        <div className="flex items-center justify-center w-full h-full">
                          <span className="text-center text-2xl lg:text-4xl text-white">CUSTOM</span>
                        </div>
                      </CardDescription>
                    </StarsBackground>
                  </CardContent>
                </Card >
              }
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DetailedView({ data, revalidate, user, cloudMaps, setSelectedMap, setLocalMaps, localMaps }) {
  const [alert, setAlert] = useState()
  const router = useRouter()
  const isRemote = data.hash

  if (!data) return null
  const remoteCopies = cloudMaps?.filter(m => m.name.trim().toLowerCase() === data.name.trim().toLowerCase())

  if (isRemote) {
    return (
      <div className="bg-gray-800 w-full p-4 text-sm mt-12">
        <h1><Cloud className='inline relative top-[-4px]' size={34} /> Cloud</h1>
        <span></span>
        <p className="text-gray-400 mb-6">{new Date(data.updatedAt).toLocaleDateString("en-US", {
          hour: "numeric",
          minute: "numeric",
          month: "long",
          day: "numeric",
        })}</p>
        <p className="text-gray-400 ">Locations: {data.locations}</p>
        <p className="text-gray-400 ">Territories: {data.territories}</p>
        <p className="text-gray-400">Guides: {data.guides}</p>
        <p className="text-gray-400">Published:
          {data.published
            ? <>
              <Check className="inline text-blue-300 relative top-[-3px] ms-1" />
              {navigator.clipboard
                ? <>
                  <Button size="sm" variant="scifi" onClick={() => navigator.clipboard.writeText(data.id)}><Copy />Copy ID</Button>
                  <Button size="sm" variant="scifi" onClick={() => navigator.clipboard.writeText(`https://stargazer.vercel.app/${data.map}/${data.id}`)}><Copy />Copy URL</Button>
                </>
                : <Input value={data.id} readOnly className="inline ms-2 w-full" />
              }
            </>
            : <X className="inline text-red-200 relative top-[-3px] ms-1" />
          }
        </p>
        <div className='flex flex-wrap justify-evenly mt-6'>
          <Button variant="scifiDestructive" onClick={() => setAlert(data.name)} title="Delete"><Trash2 /></Button>
          <Button variant="scifi" onClick={() => saveLocally(data)} title="Download"><CloudDownload /></Button>
          <Button variant="scifi" disabled={!data.published} onClick={() => router.push(`/${data.map}/${data.id}`)} title="View"><Eye /></Button>

          {data.published
            ? <Button variant="scifi" title="Unpublish" onClick={() => putMap({ ...data, published: !data.published }, revalidate)}><CloudOff /></Button>
            : <Button variant="scifi" title="Publish" onClick={() => putMap({ ...data, published: !data.published }, revalidate)}><BookOpenCheck /></Button>
          }
        </div>
        <AlertDialog open={!!alert} onOpenChange={open => !open && setAlert(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete <b>{alert}</b> </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div>
                  Are you sure you want to permanently delete {alert}?
                  You may want to download a backup.
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
              <AlertDialogAction className="cursor-pointer" onClick={() => {
                deleteMapRemote(data.id, revalidate)
                setSelectedMap(null)
              }}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }
  return (
    <div className="bg-gray-800 w-full p-4 text-sm mt-12">
      <h1 className=''><WifiOff className='inline relative top-[-4px]' size={30} /> Local</h1>
      <p className="text-gray-400 mb-6">{new Date(data.updated).toLocaleDateString("en-US", {
        hour: "numeric",
        minute: "numeric",
        month: "long",
        day: "numeric",
      })}</p>
      <p className="text-gray-400 ">Locations: {data.geojson?.features.filter(f => f.geometry.type === "Point").length}</p>
      <p className="text-gray-400 ">Territories: {data.geojson?.features.filter(f => f.geometry.type.includes("Poly")).length}</p>
      <p className="text-gray-400">Guides: {data.geojson?.features.filter(f => f.geometry.type === "LineString").length}</p>
      <div className='flex flex-wrap justify-evenly mt-6'>
        <Button variant="scifiDestructive" onClick={() => setAlert(data.name)} title="Delete"><Trash2 /></Button>
        <Button variant="scifi" onClick={() => router.push(`/${data.map}?id=${data.id}`)} title="View"><Eye /></Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="scifi" title="Download"><Download /></Button>
          </PopoverTrigger>
          <PopoverContent className="flex flex-col text-sm">
            {data.map !== "custom" &&
              <>
                <p className='mb-3 text-gray-200'>This is your map data combined with the core map data</p>
                <hr className='border my-2 border-gray-500' />
              </>
            }
            <p className='my-2 text-gray-300'>Topojson is a newer version of Geojson, and the recommended format for Stargazer</p>
            <Button className="cursor-pointer w-full" variant="secondary" onClick={() => download("topojson", data)}>
              <ArrowRightFromLine className="ml-[.6em] inline" /> Topojson
            </Button>
            <p className='my-2 text-gray-300'>Geojson is an extremely common spec for geography data</p>
            <Button className="cursor-pointer w-full my-2" variant="secondary" onClick={() => download("geojson", data)}>
              <ArrowRightFromLine className="ml-[.6em] inline" /> <span className="ml-[5px]">Geojson</span>
            </Button>
            <p className='my-2 text-gray-300'>KML can be imported into a <a href="https://www.google.com/maps/d/u/0/?hl=en" className='text-blue-300' target="_blank">Google Maps</a> layer. Which can be easily distributed publicly for free.</p>
            <Button className="cursor-pointer w-full" variant="secondary" onClick={() => download("kml", data)}>
              <ArrowRightFromLine className="ml-[.6em] inline" /> <span className="ml-[5px]">KML</span>
            </Button>
          </PopoverContent>
        </Popover>
        <Button variant="scifi" onClick={() => router.push(`/${data.map}/${data.id}/settings`)} title="Settings"><Settings /></Button>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="scifi" disabled={!user} title="Upload"><Cloud /></Button>
          </DialogTrigger>
          <DialogContent className="max-h-[40em] overflow-auto">
            <DialogHeader>
              <DialogTitle>Upload to Cloud</DialogTitle>
              <DialogDescription className="my-3 text-base">
                Upload <b>{data.name}</b> into the cloud.
              </DialogDescription>
            </DialogHeader>
            <DialogClose asChild>
              <Button size="lg" className="cursor-pointer rounded" onClick={() => uploadMap(data, revalidate)}><CloudUpload /> Upload as a new Map</Button>
            </DialogClose>

            {remoteCopies?.length > 0 &&
              <>
                <hr className="mt-2" />
                <div className="flex justify-center"><Replace className="mr-2 mt-1" size={20} /> <span className="font-bold">Replace an existing Remote Map</span></div>
                <p className="text-gray-400">Available Cloud Maps for replacement are shown below. Click on one to replace the remote data with your local data. To help prevent data loss, you can only replace remote maps of the same name</p>
                {remoteCopies?.map(cloudMap => {
                  // console.log("iterate  over remote copies", cloudMap)
                  return (
                    <DialogClose asChild key={cloudMap.id} >
                      <Card onClick={() => replaceRemoteMap(data, revalidate)} className="cursor-pointer hover-grow">
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
                  )
                })}
              </>
            }
          </DialogContent>
        </Dialog>
      </div>
      {/* Are you sure you want to delete alert */}
      <AlertDialog open={!!alert} onOpenChange={open => !open && setAlert(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete <b>{alert}</b> </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                Are you sure you want to permanently delete {alert}?
                You may want to download a backup.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction className="cursor-pointer" onClick={() => {
              deleteMapLocal(localMaps, data, setLocalMaps)
              setSelectedMap(null)
            }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
