'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Settings, ArrowLeft, Heart, Map, Terminal, Plus, WifiOff, Cloud, ArrowRightFromLine, LogIn, Download, Link as Chain, Eye, Trash2, CloudUpload, Replace, X, CloudDownload, BookOpenCheck, Copy, Check, CloudOff, RefreshCcw, EyeOff, MapPin, Route, Landmark, Hexagon, Spline, Gavel, User, Bug, DollarSign, MousePointerClick } from 'lucide-react'
import { topology } from "topojson-server"
import { toKML } from "@placemarkio/tokml"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { toast } from "sonner"
// import StarsBackground from "@/components/ui/starbackground"
import StarsBackgroundSimple from "@/components/ui/starbackgroundSimple"
import { useRouter } from 'next/navigation'
import { animateText, combineAndDownload, combineLayers, combineLayersForTopoJSON, getDailyMenuQuote, isMobile, localSet, TITLE, REPO, USER, getMaps } from "@/lib/utils"
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import PlanetBackground from '@/components/ui/PlanetBackground'

export default function Home({ revalidate, cloudMaps, session, systems }) {
  const [hashParts, setHashParts] = useState()
  const [dialog, setDialog] = useState()
  const [settingsDialog, setSettingsDialog] = useState()
  const router = useRouter()

  useEffect(() => {
    // restore menu state
    const hash = window.location.hash
    if (hash) {
      setHashParts(hash.substring(1).split("_"))
      if (hash === "#settingsFoundry") {
        setSettingsDialog(true)
        setTimeout(() => document.querySelector(".foundry-btn")?.click(), 250)
      } else if (hash === "#settings") {
        setSettingsDialog(true)
      } else {
        setDialog(true)
      }
    }

    // show any redirected to error message
    const queryParams = new URLSearchParams(window.location.search);
    const errorMsg = queryParams.get("error")
    if (errorMsg) {
      toast.warning(errorMsg)
    } else if (session?.user?.name) {
      toast.success(`Authenticated successfully`)
    }
    setTimeout(() => animateText('quoteDisplay', getDailyMenuQuote(), 100, 1_000), 3_000)
  }, [])

  useEffect(() => {
    if (!dialog && window.location.hash && !settingsDialog) {
      router.replace("")
    }
  }, [dialog, settingsDialog])

  return (
    <div className="fixed inset-0 overflow-hidden w-screen h-screen max-h-screen max-w-screen">
      <PlanetBackground />

      {/* Settings Cog Dialog */}
      <div className="absolute top-4 right-4 z-50">
        <Dialog open={!!settingsDialog} onOpenChange={(open) => !open && setSettingsDialog(null)}>
          <DialogTrigger asChild>
            <Button variant="ghost" className="w-[60px] h-[60px]" onClick={() => {
              setSettingsDialog(true)
              router.replace(`#settings`)
            }}
              onPointerEnter={(e) => e.currentTarget.childNodes[0].style.animation = 'spin 3s linear infinite'}
              onPointerLeave={(e) => e.currentTarget.childNodes[0].style.animation = 'none'}
            >
              <Settings className='' style={{ width: '30px', height: '30px' }} />
            </Button>
          </DialogTrigger>
          <DialogContent scifi={true} >
            <DialogTitle></DialogTitle>
            <DialogHeader>
              <DialogTitle className="text-cyan-400">Settings</DialogTitle>
            </DialogHeader>
            <DialogDescription />
            <div className="space-y-2 mt-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="scifi" className="w-full foundry-btn"><Chain /> Foundry</Button>
                </PopoverTrigger>
                <PopoverContent className={`flex flex-col ${session ? "w-[400px]" : ""}`}>
                  {session
                    ? <FoundryLinkContainer />
                    : <h3 className='text-gray-300 text-center text-xl'><Link href={`/login?back=/%23settings`} className='text-blue-300'><LogIn className='inline relative top-[-2px]' size={16} /> Login</Link> to link to Foundry</h3>
                  }
                </PopoverContent>
              </Popover>
              <Link href="/legal">
                <Button variant="scifi" className="w-full"><Gavel className="w-4 h-4" /> Legal</Button>
              </Link>
              {REPO &&
                <>
                  <Link href={`${REPO}/issues`} target="_blank">
                    <Button variant="scifi" className="w-full mt-2"><Bug className="w-4 h-4" /> Issues</Button>
                  </Link>
                  <Link href={`https://ko-fi.com/${USER}`} target="_blank">
                    <Button variant="scifi" className="w-full mt-2"><DollarSign className="w-4 h-4 relative top-[-2px]" /> Donate</Button>
                  </Link>
                </>
              }
              <Link href={session ? "/profile" : `/login?back=/%23settings&callback=/profile`}>
                <Button variant="scifi" className="w-full mt-2"><User className="w-4 h-4" /> Account</Button>
              </Link>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Title */}
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-40">
        <h1
          className={`text-3xl md:text-6xl font-extrabold text-white drop-shadow-lg opacity-0 animate-[fade-in-down_3s_ease-out_forwards]`}
          style={{ fontFamily: '"Press Start 2P", monospace', animationDelay: '2.8s' }}
        >
          {TITLE}
        </h1>
      </div>

      {/* Quote subtext */}
      <div className="absolute top-40 left-1/2 transform -translate-x-1/2 z-40 text-white opacity-50 text-xs text-center" id="quoteDisplay" style={{ fontFamily: '"Press Start 2P", monospace' }}></div>

      {/* Menu Dialog */}
      <div className="absolute md:bottom-20 bottom-45 left-1/2 transform -translate-x-1/2 z-40 space-y-4 text-center opacity-0 animate-[fade-in-up_1.2s_ease-out_forwards]">
        <Dialog open={!!dialog} onOpenChange={(open) => !open && setDialog(null)}>
          <DialogTrigger asChild>
            <Button variant="scifi" onClick={() => setDialog(true)}>
              P1 Start
            </Button>
          </DialogTrigger>
          <DialogContent className="md:max-w-[610px] md:min-w-[620px] md:max-h-[570px] md:min-h-[570px]" scifi={true}>
            <DialogDescription />
            <DialogTitle />
            <MainMenu cloudMaps={cloudMaps} revalidate={revalidate} session={session} hash={hashParts || []} systems={systems} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export function MainMenu({ cloudMaps, session, revalidate, hash, systems }) {
  // don't allow it to try and say settings are a system
  if (hash) if (hash[0]?.includes("settings")) hash = []
  const [selectedSystem, setSelectedSystem] = useState(typeof hash === "object" ? hash[0] : null)
  const [variantDialog, setVariantDialog] = useState()
  const [selectedMap, setSelectedMap] = useState()
  const [localMaps, setLocalMaps] = useState()
  const [tab, setTab] = useState(typeof hash === "object" ? (hash[1] || "local") : null)
  const router = useRouter()

  useEffect(() => {
    getMaps().then(maps => {
      setLocalMaps(maps)
      // restore session
      if (typeof hash !== "object") return
      if (hash[2]) {
        if (hash[2].length === 36) {
          setSelectedMap((cloudMaps || []).find(m => m.id === hash[2]))
        } else {
          setSelectedMap(Object.values(maps).find(m => m.id === Number(hash[2])))
        }
      }
    })
  }, [])

  useEffect(() => {
    if (!cloudMaps || !selectedMap) return
    if (selectedMap.hash) {
      const newCloudMap = cloudMaps.find(m => m.id === selectedMap.id)
      if (newCloudMap) setSelectedMap(newCloudMap)
    }
  }, [cloudMaps, selectedMap])

  useEffect(() => {
    if (selectedSystem && variantDialog) setVariantDialog(null)
    if (selectedSystem && tab && selectedMap) {
      router.replace(`#${selectedSystem}_${tab}_${selectedMap.hash ? selectedMap.id : selectedMap.id}`)
    } else if (selectedSystem && tab) {
      router.replace(`#${selectedSystem}_${tab}`)
    } else if (selectedSystem) {
      router.replace(`#${selectedSystem}`)
    } else {
      router.replace("")
    }
  }, [selectedSystem, selectedMap, tab, variantDialog])

  function variant(system) {
    if (system.includes("lancer")) {
      setVariantDialog({
        title: "Lancer",
        maps: [
          { id: "lancer", label: "Janederscore (recommended)" },
          { id: "lancerStarwall", label: "Starwall" },
        ],
      })
      return
    }
    setSelectedSystem(system)
  }

  return (
    <div className="" style={{ fontFamily: '"Press Start 2P", monospace' }}>
      {/* Breadcrumb */}
      <Breadcrumb className="absolute top-8 left-8">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink className="text-xs md:text-sm" onClick={() => { setSelectedSystem(null); setSelectedMap(null); }}>Systems</BreadcrumbLink>
          </BreadcrumbItem>
          {selectedSystem && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem className="text-xs md:text-sm" >
                <BreadcrumbLink onClick={() => setSelectedMap(null)}>{selectedSystem}</BreadcrumbLink>
              </BreadcrumbItem>
            </>
          )}
          {selectedMap && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem className="text-xs md:text-sm" >
                <BreadcrumbPage>{selectedMap.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Buttons for selected system */}
      {selectedSystem && !selectedMap && (
        <div className="absolute top-4 right-6">
          {tab === "local" &&
            <Link href={`/${selectedSystem}/?new=1`} className='mr-4'>
              <Button variant="scifi" title="Create a new map" className="p-3"><Plus /></Button>
            </Link>
          }
          {selectedSystem !== "custom" &&
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="scifi" title="Download base map data" className="p-3"><Download /></Button>
              </PopoverTrigger>
              <PopoverContent className="flex flex-col w-80 bg-black/80 border border-cyan-400 text-white">
                <p className='mb-3 text-gray-200'>Download the base {selectedSystem} map features. Your added locations will not be included.</p>
                <hr className='border my-2 border-gray-500' />
                <p className='my-2 text-gray-300'>Topojson is a newer version of Geojson, and the recommended format for {TITLE}</p>
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
        <DetailedView data={selectedMap} revalidate={revalidate} session={session} setSelectedMap={setSelectedMap} setLocalMaps={setLocalMaps} localMaps={localMaps} cloudMaps={cloudMaps} />
      )}

      {/* Local and Cloud tabs */}
      {selectedSystem && !selectedMap && (
        <Tabs defaultValue={tab} className="w-full h-[300px] mt-12" scifi={true} onValueChange={tab => setTab(tab)}>
          <TabsList className="w-full" scifi={true}>
            <TabsTrigger value="local" scifi={true}>Local</TabsTrigger>
            <TabsTrigger value="cloud" scifi={true}>Cloud</TabsTrigger>
          </TabsList>
          <TabsContent value="local" scifi={true}>

            {localMaps &&
              <div className='flex flex-wrap justify-evenly max-h-[205px] overflow-auto'>
                {Object.keys(localMaps).filter(i => i.split('-')[0] === selectedSystem).length === 0 &&
                  <p>No local {selectedSystem} maps found. <Link href={`/${selectedSystem}?new=1`} className="text-blue-300">Create a new one.</Link><LogIn className='animate-pulse inline relative top-[-1px] ms-1' size={18} /></p>
                }
                {Object.entries(localMaps).map(([key, data]) => {
                  const [system, dateId] = key.split('-')
                  if (system !== selectedSystem) return null
                  // console.log("text size", getSize(data.name))
                  return (
                    <Button variant="scifi" className="w-full m-0 p-0 my-1" onClick={() => setSelectedMap(data)} key={key}>
                      {data.name?.length > 20 ? `${data.name?.substring(0, 20)}...` : data.name}
                      {/* {data.name} */}
                    </Button>
                  )
                })}
              </div>
            }

          </TabsContent>
          <TabsContent value="cloud" scifi={true}>
            {!session &&
              <h3 className='text-gray-300'>Please <Link href={`/api/auth/signin?callbackUrl=${window?.location.toString() || ""}`} className='text-blue-300'>login</Link> to publish a map <LogIn className='animate-pulse inline relative top-[-1px] ms-1' size={18} /></h3>
            }
            {(Object.values(cloudMaps || {}).filter(m => m.map === selectedSystem).length === 0) && session &&
              <p>No cloud {selectedSystem} maps found</p>
            }
            {cloudMaps &&
              <div className='flex flex-wrap justify-evenly max-h-[205px] overflow-auto'>
                {Object.values(cloudMaps).map(data => {
                  // console.log("data", data)
                  if (data.map !== selectedSystem) return null
                  return (
                    <Button variant="scifi" className="w-full m-0 p-0 my-1 md:text-[.8em] text-[.6em]" onClick={() => setSelectedMap(data)} key={data.id}>
                      {data.name?.length > 20 ? `${data.name?.substring(0, 20)}...` : data.name}
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
        <div className="flex flex-wrap gap-2 justify-evenly mt-8 max-h-[465px] overflow-auto">
          {systems.map((system) => (
            <div key={system}>
              {system === "custom"
                ?
                <Card className="w-[250px] h-[250px] lg:w-[269px] lg:h-[269px] cursor-pointer rounded-xl" onClick={() => setSelectedSystem(system)}>
                  <CardContent className="p-2 w-full h-full">
                    <StarsBackgroundSimple>
                      <CardDescription className="text-center w-[225px] h-[225px] lg:w-[243px] lg:h-[243px] hover-grow">
                        <div className="flex items-center justify-center w-full h-full">
                          <span className="text-center text-3xl lg:text-4xl text-white">CUSTOM</span>
                        </div>
                      </CardDescription>
                    </StarsBackgroundSimple>
                  </CardContent>
                </Card >
                :
                <Card className="w-[250px] h-[250px] lg:w-[269px] lg:h-[269px] cursor-pointer rounded-xl" onClick={() => variant(system)}>
                  <CardContent className="p-2 w-full h-full">
                    <StarsBackgroundSimple>
                      <Image
                        src={`/systems/${system}.webp`}
                        unoptimized={system === "fallout"}
                        alt={system}
                        width={200}
                        height={200}
                        className="object-cover w-full h-full hover-grow rounded-xl"
                      />
                    </StarsBackgroundSimple>
                  </CardContent>
                </Card>
              }
            </div>
          ))}
          {/* {systems.length === 2 && <p className='mb-10 mt-2 text-center'>Looking for more maps? Checkout one of the <a href="https://github.com/CodaBool/stargazer/wiki/Forks" className='text-blue-300'>forks</a></p>}*/}
        </div>
      )}


      {/* variant picker dialog */}
      <Dialog open={variantDialog} onOpenChange={setVariantDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Choose a variant for {variantDialog?.title}
            </DialogTitle>
            <DialogDescription>
              This map has multiple implementations
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            {variantDialog?.maps?.map(map => (
              <Button
                key={map.id}
                variant="outline"
                className="justify-start"
                onClick={() => setSelectedSystem(map.id)}
              >
                {map.label}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DetailedView({ data, revalidate, session, cloudMaps, setSelectedMap, setLocalMaps, localMaps }) {
  const [alert, setAlert] = useState()
  const isRemote = typeof data.published === "boolean"

  if (!data) return null
  const remoteCopies = cloudMaps?.filter(m => m.name.trim().toLowerCase() === data.name.trim().toLowerCase())

  if (isRemote) {
    return (
      <div className="bg-[radial-gradient(ellipse_80%_50%_at_center,_black_30%,_transparent_100%)] w-full p-4 text-sm mt-12">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          {/* Left: Info Block */}
          <div className="md:w-1/2">
            <h1 className="text-lg font-bold text-white">
              <Cloud className="inline relative top-[-4px]" size={34} /> Cloud
            </h1>
            <p className="text-gray-400 text-xs md:text-md mb-2">
              {new Date(data.updatedAt).toLocaleDateString("en-US", {
                hour: "numeric",
                minute: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <div className="flex gap-4 text-gray-400 text-sm">
              <span className="flex items-center gap-1" title="Locations/Points"><MapPin size={16} /> {data.locations}</span>
              <span className="flex items-center gap-1" title="Territories/Polygons"><Hexagon size={16} /> {data.territories}</span>
              <span className="flex items-center gap-1" title="Guides/Lines"><Spline size={16} /> {data.guides}</span>
            </div>
            <div className="text-gray-400 mt-[.25em] text-xs md:text-md">
              Published:
              {data.published ? (
                <>
                  <Check className="inline text-blue-300 relative top-[-3px] ms-1" />
                  {navigator.clipboard ? (
                    <div className="flex gap-2 m-0 flex-wrap">
                      <Button variant="scifi" className="w-full" onClick={() => {
                        navigator.clipboard.writeText(data.id)
                        toast.success(`copied ID ${data.id}`)
                      }}>
                        <Copy className="mr-2" /> Copy ID
                      </Button>
                      <Button variant="scifi" className="w-full mt-[.25em]" onClick={() => {
                        navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_URL}/${data.map}/${data.id}`)
                        toast.success(`copied URL`)
                      }}>
                        <Copy className="mr-2" /> Copy URL
                      </Button>
                    </div>
                  ) : (
                    <Input value={data.id} readOnly className="w-full text-xs" />
                  )}
                </>
              ) : (
                <X className="inline text-red-200 relative top-[-3px] ms-1" />
              )}
            </div>
          </div>

          {/* Right: Button Panel */}
          <div className="md:w-1/2 flex flex-wrap gap-3 md:justify-end justify-center mt-4 md:mt-0">
            <Button className="w-full md:w-full" variant="scifiDestructive" onClick={() => setAlert(data.name)} title="Delete">
              <Trash2 className="mr-2" /> Delete
            </Button>
            <Button className="w-full md:w-full" variant="scifi" onClick={() => saveLocally(data, setLocalMaps)} title="Copy to a local map">
              <CloudDownload className="mr-2" /> To Local
            </Button>
            {/* TODO: should be possible to have a remote map viewable before publishing */}
            {data.published ? (
              <Link href={`/${data.map}/${data.id}`} className='w-full'>
                <Button className="w-full" variant="scifi" title="View">
                  <Eye className="mr-2" /> View
                </Button>
              </Link>
            ) : (
              <Button className="w-full" variant="scifi" title="View" disabled>
                <Eye className="mr-2" /> View
              </Button>
            )}
            <Link href={`/${data.map}/${data.id}/settings`} className='w-full'>
              <Button className="w-full" variant="scifi" title="Settings">
                <Settings className="mr-2" /> Settings
              </Button>
            </Link>
            {data.published ? (
              <Button className="w-full md:w-full" variant="scifi" title="Unpublish" onClick={() => putMap({ ...data, published: false }, revalidate, setSelectedMap)}>
                <CloudOff className="mr-2" /> Unpublish
              </Button>
            ) : (
              <Button className="w-full md:w-full" variant="scifi" title="Publish" onClick={() => putMap({ ...data, published: true }, revalidate, setSelectedMap)}>
                <BookOpenCheck className="mr-2" /> Publish
              </Button>
            )}
          </div>
        </div>

        {/* Delete Alert */}
        <AlertDialog open={!!alert} onOpenChange={(open) => !open && setAlert(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete <b>{alert}</b></AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div>
                  Are you sure you want to permanently delete <b>{alert}</b>?
                  You may want to download a backup.
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
              <AlertDialogAction className="cursor-pointer" onClick={() => {
                deleteMapRemote(data.id, revalidate);
                setSelectedMap(null);
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
    <div className="bg-[radial-gradient(ellipse_80%_50%_at_center,_black_30%,_transparent_100%)] w-full p-4 text-sm mt-12">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        {/* Left: Info Block */}
        <div className="md:w-1/2 flex flex-col justify-center">
          <h1 className="text-lg font-bold text-white">
            <WifiOff className="inline relative top-[-4px]" size={30} /> Local
          </h1>
          <p className="text-gray-400 text-xs md:text-md mb-2">
            {new Date(data.updated).toLocaleDateString("en-US", {
              hour: "numeric",
              minute: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <div className="flex gap-4 text-gray-400 text-sm">
            <span className="flex items-center gap-1" title="Locations/Points">
              <MapPin size={16} /> {data.geojson?.features.filter(f => f.geometry.type === "Point").length}
            </span>
            <span className="flex items-center gap-1" title="Territories/Polygons">
              <Hexagon size={16} /> {data.geojson?.features.filter(f => f.geometry.type.includes("Poly")).length}
            </span>
            <span className="flex items-center gap-1" title="Guides/Lines">
              <Spline size={16} /> {data.geojson?.features.filter(f => f.geometry.type.includes("LineString")).length}
            </span>
          </div>
        </div>

        {/* Right: Button Panel */}
        <div className="md:w-1/2 flex flex-wrap gap-3 md:justify-end justify-center mt-4 md:mt-0">
          <Button className="w-full" variant="scifiDestructive" onClick={() => setAlert(data.name)} title="Delete">
            <Trash2 className="mr-2" /> Delete
          </Button>
          <Link href={`/${data.map}?id=${data.id}`} passHref className='w-full'>
            <Button className="w-full" variant="scifi" title="View">
              <Eye className="mr-2" /> View
            </Button>
          </Link>
          <Popover>
            <PopoverTrigger asChild>
              <Button className="w-full" variant="scifi" title="Download">
                <Download className="mr-2" /> Download
              </Button>
            </PopoverTrigger>
            <PopoverContent className="flex flex-col text-sm">
              {data.map !== "custom" &&
                <>
                  <p className="mb-3 text-gray-200">This is your map data combined with the core map data</p>
                  <hr className="border my-2 border-gray-500" />
                </>
              }
              <p className="my-2 text-gray-300">Topojson is a newer version of Geojson, and the recommended format for {TITLE}</p>
              <Button className="cursor-pointer w-full" variant="secondary" onClick={() => download("topojson", data)}>
                <ArrowRightFromLine className="mr-2" /> Topojson
              </Button>
              <p className="my-2 text-gray-300">Geojson is an extremely common spec for geography data</p>
              <Button className="cursor-pointer w-full my-2" variant="secondary" onClick={() => download("geojson", data)}>
                <ArrowRightFromLine className="mr-2" /> Geojson
              </Button>
              <p className="my-2 text-gray-300">KML can be imported into a <a href="https://www.google.com/maps/d/u/0/?hl=en" className="text-blue-300" target="_blank" rel="noopener noreferrer">Google Maps</a> layer.</p>
              <Button className="cursor-pointer w-full" variant="secondary" onClick={() => download("kml", data)}>
                <ArrowRightFromLine className="mr-2" /> KML
              </Button>
            </PopoverContent>
          </Popover>
          <Link href={`/${data.map}/${data.id}/settings`} passHref className='w-full'>
            <Button className="w-full" variant="scifi" title="Settings">
              <Settings className="mr-2" /> Settings
            </Button>
          </Link>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full" variant="scifi" title="Upload">
                <Cloud className="mr-2" /> Upload
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[40em] overflow-auto">
              <DialogHeader>
                <DialogTitle>{session ? "Upload to Cloud" : "Login"}</DialogTitle>
                <DialogDescription className="my-3 text-base">
                  {session
                    ? `Upload ${data.name} into the cloud.`
                    : "Please login to upload your map."
                  }
                </DialogDescription>
              </DialogHeader>
              {session &&
                <DialogClose asChild>
                  <Button size="lg" className="cursor-pointer rounded" onClick={() => uploadMap(data, revalidate)}>
                    <CloudUpload className="mr-2" /> Upload as a new Map
                  </Button>
                </DialogClose>
              }
              {!session &&
                <DialogClose asChild>
                  <Link href={`/api/auth/signin?callbackUrl=${window?.location.toString() || ""}`} className='text-blue-300'>
                    <Button size="lg" className="rounded w-full" >
                      <User className="mr-2" /> Login
                    </Button>
                  </Link>
                </DialogClose>
              }
              {remoteCopies?.length > 0 &&
                <>
                  <hr className="mt-2" />
                  <div className="flex justify-center items-center font-bold">
                    <Replace className="mr-2 mt-1" size={20} /> Replace an existing Cloud Map
                  </div>
                  <p className="text-gray-400">Click below to replace cloud data with your local data (names must match, remote settings have priority):</p>
                  {remoteCopies.map(cloudMap => (
                    <DialogClose asChild key={cloudMap.id}>
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
                        <CardContent className="flex gap-4">
                          <span className="flex items-center gap-1" title="Locations/Points"><MapPin size={16} /> {cloudMap.locations}</span>
                          <span className="flex items-center gap-1" title="Territories/Polygons"><Hexagon size={16} /> {cloudMap.territories}</span>
                          <span className="flex items-center gap-1" title="Guides/Lines"><Spline size={16} /> {cloudMap.guides}</span>
                        </CardContent>
                      </Card>
                    </DialogClose>
                  ))}
                </>
              }
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Delete Alert */}
      <AlertDialog open={!!alert} onOpenChange={open => !open && setAlert(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete <b>{alert}</b></AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                Are you sure you want to permanently delete <b>{alert}</b>?
                You may want to download a backup.
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction className="cursor-pointer" onClick={() => {
              deleteMapLocal(localMaps, data, setLocalMaps);
              setSelectedMap(null);
            }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>

  )
}


async function download(type, data) {
  try {
    console.log("res", data)

    let downloadData, finalFileType = "application/json"
    if (data.map === "custom") {
      if (type === "geojson") {
        downloadData = JSON.stringify(data.geojson)
      } else if (type === "kml") {
        const combinedGeojson = combineLayers([data.geojson]);
        downloadData = toKML(combinedGeojson)
        finalFileType = "application/vnd.google-earth.kml+xml"
      } else if (type === "topojson") {
        downloadData = JSON.stringify(topology(combineLayersForTopoJSON([data.geojson])))
      }

    } else {
      const response = await fetch(`/api/download/${data.map}`)
      const json = await response.json()
      const [finalData, fileType] = combineAndDownload(type, json, data.geojson)
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
        revalidate(`/`)
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
  console.log("sending", localMap)
  fetch('/api/map', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ geojson: localMap.geojson, id: localMap.id, map: localMap.map, name: localMap.name, replace: true }),
  })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        toast.warning(data.error)
      } else {
        revalidate(`/`)
        toast.success(`Cloud map for ${localMap.map} updated successfully`)
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
        revalidate(`/`)
      }
    })
    .catch(error => {
      console.log(error)
      toast.warning("A server error occurred")
    });
}

async function saveLocally(map, setLocalMaps) {
  const response = await fetch(`/api/map?id=${map.id}`)
  const data = await response.json()
  const time = Date.now()
  const key = `${map.map}-${time}`
  const local = await getMaps()
  const maps = {
    ...local, [key]: {
      geojson: data.geojson,
      config: data.config || {},
      name: map.name,
      id: time,
      updated: time,
      map: map.map,
    }
  }
  localSet("maps", maps)
  setLocalMaps(maps)
  toast.success(data.name + " saved locally")
}

function putMap(body, revalidate, setSelectedMap) {
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
        revalidate(`/`)
        setSelectedMap(data.map)
        toast.success(`"${data.map.name}" successfully updated. Changes may not take effect immediately`)
      }
    })
    .catch(error => {
      console.log(error)
      toast.warning("A server error occurred")
    })
}

export function FoundryLinkContainer() {
  const [secret, setSecret] = useState()
  const [error, setError] = useState()

  useEffect(() => {
    fetch('/api/profile')
    .then(res => res.json())
    .then(({user}) => {
      if (user) {
        setSecret(user.secret)
      } else {
        setError("Could not load secret")
      }
    }).catch(err => {
      console.log("error", err)
      toast.warning('Account could not be fetched at this time CODE: 522')
      setError("Could not load secret")
    })
  }, [])

  return (
    <>
      {secret === undefined && error === undefined && (
        <div className="flex justify-center items-center h-[246px] coolguy">
          <div className="animate-spin w-8 h-8 border-4 border-current border-t-transparent text-[#0ff] rounded-full" />
        </div>
      )}
      {error && (
        <p>{error}</p>
      )}
      {secret && (
        <FoundryLink secret={secret} />
      )}
    </>
  )
}


function FoundryLink({secret}) {
  const [submitting, setSubmitting] = useState()
  const [showSecret, setShowSecret] = useState()
  const [secretValue, setSecretValue] = useState(secret)

  async function refreshSecret() {
    if (!window.confirm('This overwrites your current secret! All Foundry instances must have this new secret entered in the Stargazer module settings page.')) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({ refreshSecret: true }),
      })
      const response = await res.json()

      if (response.secret) {
        toast.success('Successfully refreshed secret')
        setSecretValue(response.secret)
        setShowSecret(true)
      } else {
        console.error(response.error)
        toast.warning('Could not refresh secret at this time')
      }
    } catch (err) {
      console.error(err)
      toast.error('Unexpected error refreshing secret')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <p className='mb-3 text-gray-200'>Link to your FoundryVTT by pasting this secret into the module settings</p>
      <hr className='border my-2 border-gray-500' />
      <p className='text-sm text-gray-400'>Warning: this exposes your account to some risk. All connected players and enabled modules in Foundry can read this value once entered.</p>
      <div className="flex items-center">
        <Input value={secretValue} readOnly className="my-4 mx-0 flex-grow" type={showSecret ? 'text' : 'password'} />
        <Button size="sm" className="cursor-pointer rounded ml-2" variant="outline" onClick={() => setShowSecret(!showSecret)}>
          {showSecret ? <EyeOff /> : <Eye />}
        </Button>
      </div>

      {navigator.clipboard &&
        <Button size="sm" className="cursor-pointer rounded mb-4" variant="outline" onClick={() => {
          navigator.clipboard.writeText(secretValue)
          toast.success("Copied to clipboard")
        }}>
          <Copy />Copy to Clipboard
        </Button>
      }
      <Button size="sm" className="cursor-pointer rounded" variant="destructive" onClick={refreshSecret} disabled={submitting}>
        <RefreshCcw />Request Replacement Secret
      </Button>
    </>
  )
}
