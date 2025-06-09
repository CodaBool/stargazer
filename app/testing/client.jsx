'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Settings, ArrowLeft, Heart, Map, Terminal, Plus, WifiOff, Cloud, ArrowRightFromLine, LogIn, Download, Link as Chain, Eye, Trash2 } from 'lucide-react'
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
import StarsBackground from "@/components/ui/starbackground"
import ClientMaps from '@/components/clientMaps'
import { useRouter } from 'next/navigation'
import { localGet, localSet } from '@/lib/utils'
import Link from 'next/link'

export default function Home({ session, revalidate, cloudMaps }) {
  const [showUI, setShowUI] = useState(true)
  const [showTitle, setShowTitle] = useState(false)

  useEffect(() => {
    setTimeout(() => setShowTitle(true), 300)
    setTimeout(() => setShowUI(true), 300)
  }, [])


  return (
    <div className="relative w-full h-screen overflow-hidden">
      <ThreejsPlanet planetSize={1} type="terrestrial" />

      {/* Settings Cog Dialog */}
      <div className="absolute top-4 right-4 z-50">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" className="w-20 h-20 p-0 m-0 cursor-pointer">
              <Settings style={{ height: '4em', width: '4em' }} />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-black/80 border border-cyan-400 text-white max-w-md">
            <DialogTitle></DialogTitle>
            <DialogHeader>
              <DialogTitle className="text-cyan-400">Stargazer Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <p className="hover:text-cyan-300 cursor-pointer">About</p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="scifi"><Chain /> Foundry</Button>
                </PopoverTrigger>
                <PopoverContent className="flex flex-col w-[385px]">
                  {session
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
              <p className="hover:text-cyan-300 cursor-pointer">Credits</p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stargazer Title */}
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-40">
        <h1
          className={`text-6xl font-extrabold text-white drop-shadow-lg transition-transform duration-1000 ${showTitle ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'
            }`}
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          Stargazer
        </h1>
      </div>

      {/* Lancer Dialog */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-40 space-y-4 text-center">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="scifi"
              className={`transition-opacity duration-1000 ${showUI ? 'opacity-100' : 'opacity-0'
                }`}
            >
              Start
            </Button>
          </DialogTrigger>
          <DialogContent className="md:max-w-[610px] md:min-w-[620px] md:max-h-[430px] md:min-h-[430px]" scifi={true}>
            <DialogTitle />
            <MainMenu cloudMaps={cloudMaps} revalidate={revalidate} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}


export function MainMenu({ cloudMaps }) {
  const [selectedSystem, setSelectedSystem] = useState()
  const [selectedMap, setSelectedMap] = useState()
  const [localMaps, setLocalMaps] = useState()
  const [numOfMapsForThisSys, setNumOfMapsForThisSys] = useState()
  const router = useRouter()

  const systems = ['lancer', 'custom']

  const getSize = (name) => {
    if (name.length < 5) return 'text-lg'
    if (name.length < 10) return 'text-sm'
    return 'text-xs'
  }

  useEffect(() => {
    localGet('maps').then(r => r.onsuccess = () => {
      setLocalMaps(r.result || {})
    })
  }, [])

  console.log(selectedMap)

  useEffect(() => {
    if (!selectedSystem) return
    setNumOfMapsForThisSys(Object.keys(localMaps).filter(m => m.startsWith(selectedSystem)).length)
  }, [selectedSystem])

  return (
    <div className="" style={{ fontFamily: '"Press Start 2P", monospace' }}>
      {/* Breadcrumb */}
      <Breadcrumb className="absolute top-8 left-8">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink className="" onClick={() => { setSelectedSystem(null); setSelectedMap(null); }}>Systems</BreadcrumbLink>
          </BreadcrumbItem>
          {selectedSystem && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink onClick={() => setSelectedMap(null)}>{selectedSystem}</BreadcrumbLink>
              </BreadcrumbItem>
            </>
          )}
          {selectedMap && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{selectedMap.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Buttons for selected system */}
      {selectedSystem && !selectedMap && (
        <div className="absolute top-4 right-16">
          <Link href={`/${selectedSystem}/?new=1`} className='mr-4'>
            <Button variant="scifi" title="Create a new map"><Plus /></Button>
          </Link>
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
        <>
          {/* <div className="flex flex-wrap gap-4 h-[40px] my-2 p-0">
            <Button variant="scifi">View</Button>
            <Button variant="scifi">Delete</Button>
            <Button variant="scifi">Upload</Button>
            <Button variant="scifi">Download</Button>
            <Button variant="scifi">Settings</Button>
          </div> */}

          <div className="bg-gray-800 w-full p-4 text-sm">
            <p className="text-gray-400 mb-6">{new Date(selectedMap.updated).toLocaleDateString("en-US", {
              hour: "numeric",
              minute: "numeric",
              month: "long",
              day: "numeric",
            })}</p>
            <p className="text-gray-400 ">Locations: {selectedMap.geojson?.features.filter(f => f.geometry.type === "Point").length}</p>
            <p className="text-gray-400 ">Territories: {selectedMap.geojson?.features.filter(f => f.geometry.type.includes("Poly")).length}</p>
            <p className="text-gray-400">Guides: {selectedMap.geojson?.features.filter(f => f.geometry.type === "LineString").length}</p>
            <div className='flex flex-wrap justify-evenly mt-6'>
              <Button className="" variant="scifiDestructive" onClick={() => deleteMap(key)}><Trash2 title="Delete Map" /></Button>
              <Button className="" variant="scifi" onClick={() => router.push(`/${selectedSystem}?id=${selectedMap.id}`)}><Eye title="View Map" /></Button>
              <Button className="" variant="scifi" onClick={() => router.push(`/${selectedSystem}/${selectedMap.id}/settings`)}><Settings /></Button>
              <Button className="" variant="scifi" onClick={() => router.push(`/${selectedSystem}/${selectedMap.id}/settings`)}><Settings /></Button>
            </div>
          </div>
        </>
      )}

      {selectedSystem && !selectedMap && (
        <Tabs defaultValue="local" className="w-full h-[300px]" scifi={true}>
          <TabsList className="w-full" scifi={true}>
            <TabsTrigger value="local" scifi={true}>Local</TabsTrigger>
            <TabsTrigger value="remote" scifi={true}>Remote</TabsTrigger>
          </TabsList>
          <TabsContent value="local" scifi={true}>

            {localMaps &&
              <div className='flex flex-wrap justify-evenly max-h-[205px] overflow-auto'>
                {numOfMapsForThisSys === 0 &&
                  <p>No local {selectedSystem} maps found. <Link href={`/${selectedSystem}?new=1`} className="text-blue-300">Create a new map.</Link></p>
                }
                {Object.entries(localMaps).map(([key, data]) => {
                  const [system, dateId] = key.split('-')
                  if (system !== selectedSystem) return null
                  // console.log("text size", getSize(data.name))
                  return (
                    <Card className="max-w-[250px] cursor-pointer lg:max-w-[269px] rounded-xl m-1" onClick={() => setSelectedMap(data)} key={key}>
                      <CardContent className="p-2">
                        <StarsBackground>
                          <CardDescription className="text-center w-[128px] h-[128px] lg:w-[243px] lg:h-[243px] hover-grow">
                            <div className="flex items-center justify-center w-full h-full">
                              <span className={`text-center ${getSize(data.name)} text-white`}>{data.name}</span>
                            </div>
                          </CardDescription>
                        </StarsBackground>
                      </CardContent>
                    </Card >
                  )
                })}
              </div>
            }

          </TabsContent>
          <TabsContent value="remote" scifi={true}>b</TabsContent>
          {/* <TabsContent value="local" scifi={true}><LocalMaps /></TabsContent>
          <TabsContent value="remote" scifi={true}><RemoteMaps /></TabsContent> */}
        </Tabs>
      )}

      {/* {!selectedSystem && !selectedMap && <div className="h-[40px] opacity-0 my-2 p-0"></div>} */}

      {/* Systems view */}
      {!selectedSystem && (
        <div className="flex flex-wrap gap-2 justify-evenly">
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

function LocalMaps() {
  return <h1>local</h1>
}
function RemoteMaps() {
  return <h1>remote</h1>
}


// function LocalMaps2({ map, revalidate, cloudMaps, session, maps }) {
//   const [nameInput, setNameInput] = useState()
//   const [showNameInput, setShowNameInput] = useState()
//   const router = useRouter()

//   function deleteMap(key) {
//     if (window.confirm('Are you sure you want to delete this map?')) {
//       const updatedMaps = { ...maps }
//       delete updatedMaps[key]
//       localSet("maps", updatedMaps)
//       setMaps(updatedMaps)
//     }
//   }

//   function replaceRemoteMap(id, localMap) {
//     fetch('/api/map', {
//       method: 'PUT',
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({ geojson: localMap.geojson, id }),
//     })
//       .then(response => response.json())
//       .then(data => {
//         if (data.error) {
//           toast.warning(data.error)
//         } else {
//           setShowNameInput(false)
//           revalidate(`/app/${map.map}/export`)
//           toast.success(`Remote map for ${map.map} updated successfully`)
//         }
//       })
//       .catch(error => {
//         console.log(error)
//         toast.warning("A server error occurred")
//       })
//   }

//   function uploadMap(key, name) {
//     const body = JSON.stringify(maps[key])
//     fetch('/api/map', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       body,
//     })
//       .then(response => response.json())
//       .then(data => {
//         if (data.error) {
//           toast.warning(data.error)
//         } else {
//           toast.success(`${data.map.map} map, ${data.map.name}, successfully uploaded`)
//           revalidate(`/app/${map}/export`)
//         }
//       })
//       .catch(error => {
//         console.log(error)
//         toast.warning("A server error occurred")
//       });
//   }

//   function editName(key, name) {
//     setNameInput(name)
//     setShowNameInput(key)
//     setTimeout(() => {
//       document.getElementById(`local-map-${key}`)?.focus()
//     }, 200)
//   }

//   function saveName(key) {
//     const updatedMaps = { ...maps, [key]: { ...maps[key], name: nameInput } }
//     localSet("maps", updatedMaps)
//     setMaps(updatedMaps)
//     setShowNameInput(false)
//     setNameInput(null)
//   }

//   async function download(type, key) {
//     try {
//       let downloadData, finalFileType = "application/json"
//       if (map === "custom") {
//         const localGeojson = maps[key].geojson
//         if (type === "geojson") {
//           downloadData = JSON.stringify(localGeojson)
//         } else if (type === "kml") {
//           const combinedGeojson = combineLayers([localGeojson]);
//           downloadData = toKML(combinedGeojson)
//           finalFileType = "application/vnd.google-earth.kml+xml"
//         } else if (type === "topojson") {
//           downloadData = JSON.stringify(topology(combineLayersForTopoJSON([localGeojson])))
//         }

//       } else {
//         const response = await fetch(`/api/download/${map}`)
//         const data = await response.json()
//         const localGeojson = maps[key].geojson
//         const [finalData, fileType] = combineAndDownload(type, data, localGeojson)
//         downloadData = finalData
//         finalFileType = fileType
//       }

//       // Create and trigger file download
//       const blob = new Blob([downloadData], { type: finalFileType });
//       const url = URL.createObjectURL(blob);
//       const a = document.createElement("a");
//       a.href = url;
//       a.download = `${map}.${type}`;
//       document.body.appendChild(a);
//       a.click();
//       document.body.removeChild(a);
//     } catch (error) {
//       console.error("Error downloading map:", error);
//     }
//   }

//   return (
//     <div className="flex items-center my-2 flex-wrap">
//       {Object.entries(maps || {}).map(([key, data]) => {
//         const [name, dateId] = key.split('-')
//         const remote = cloudMaps.filter(m => m.name.trim() === data.name.trim())

//         return (
//           <div key={key} className="bg-gray-800 p-4 m-2 rounded w-full md:w-[440px]">
//             {showNameInput === key
//               ? <>
//                 <Input value={nameInput} className="w-[80%] mb-4 inline" id={`local-map-${key}`}
//                   onChange={(e) => setNameInput(e.target.value)}
//                   onKeyDown={e => {
//                     if (e.key === 'Enter') saveName(key)
//                   }}
//                 />
//                 <Save onClick={() => saveName(key)} size={22} className="cursor-pointer inline ml-4" />
//               </>
//               : <h2 className="text-2xl font-bold mb-4">{data.name} <Pencil onClick={() => editName(key, data.name)} size={16} className="cursor-pointer inline ml-4" /></h2>
//             }
//             <p className="text-gray-400 ">Created: {new Date(parseInt(dateId)).toLocaleDateString("en-US", {
//               hour: "numeric",
//               minute: "numeric",
//               month: "long",
//               day: "numeric",
//             })}</p>
//             <p className="text-gray-400 ">Updated: {new Date(data.updated).toLocaleDateString("en-US", {
//               hour: "numeric",
//               minute: "numeric",
//               month: "long",
//               day: "numeric",
//             })}</p>
//             <p className="text-gray-400 ">Locations: {data.geojson?.features.filter(f => f.geometry.type === "Point").length}</p>
//             <p className="text-gray-400 ">Territories: {data.geojson?.features.filter(f => f.geometry.type.includes("Poly")).length}</p>
//             <p className="text-gray-400">Guides: {data.geojson?.features.filter(f => f.geometry.type === "LineString").length}</p>
//             <div className="grid grid-cols-2 gap-2">
//               {/* <div className="flex justify-between items-center mt-4"> */}
//               <Button className="cursor-pointer rounded m-2" onClick={() => router.push(`/${map}?id=${dateId}`)} variant="outline"><Eye /> View</Button>
//               <Button className="text-red-500 cursor-pointer rounded m-2" variant="destructive" onClick={() => deleteMap(key)}><Trash2 /> Delete</Button>

//               <Dialog>
//                 <DialogTrigger asChild>
//                   <Button className="cursor-pointer rounded m-2" disabled={!session} ><Cloud /> Upload</Button>
//                 </DialogTrigger>
//                 <DialogContent className="max-h-[40em] overflow-auto">
//                   <DialogHeader>
//                     <DialogTitle>Upload to Cloud</DialogTitle>
//                     <DialogDescription className="my-3 text-base">
//                       Upload <b>{data.name}</b> into the cloud.
//                     </DialogDescription>
//                   </DialogHeader>
//                   <DialogClose asChild>
//                     <Button size="lg" className="cursor-pointer rounded" onClick={() => uploadMap(key, data.name)}><CloudUpload /> Upload as a new Map</Button>
//                   </DialogClose>

//                   {remote.length > 0 &&
//                     <>
//                       <hr className="mt-2" />
//                       <div className="flex justify-center"><Replace className="mr-2 mt-1" size={20} /> <span className="font-bold">Replace an existing Remote Map</span></div>
//                       <p className="text-gray-400">Available Cloud Maps for replacement are shown below. Click on one to replace the remote data with your local data. To help prevent data loss, you can only replace remote maps of the same name</p>
//                       {remote.map(cloudMap => (
//                         <DialogClose asChild key={cloudMap.id} >
//                           <Card onClick={() => replaceRemoteMap(cloudMap.id, data)} className="cursor-pointer hover-grow">
//                             <CardHeader>
//                               <CardTitle>{cloudMap.name}</CardTitle>
//                               <CardDescription>{new Date(cloudMap.updatedAt).toLocaleDateString("en-US", {
//                                 hour: "numeric",
//                                 minute: "numeric",
//                                 month: "long",
//                                 day: "numeric",
//                               })}</CardDescription>
//                             </CardHeader>
//                             <CardContent>
//                               <p className="text-gray-400 ">Locations: {cloudMap.locations}</p>
//                               <p className="text-gray-400 ">Territories: {cloudMap.territories}</p>
//                               <p className="text-gray-400">Guides: {cloudMap.guides}</p>
//                             </CardContent>
//                           </Card>
//                         </DialogClose>
//                       ))}
//                     </>
//                   }
//                 </DialogContent>
//               </Dialog>

//               <Popover>
//                 <PopoverTrigger asChild>
//                   <Button className="cursor-pointer rounded m-2"><Download /> Download</Button>
//                 </PopoverTrigger>
//                 <PopoverContent className="flex flex-col text-sm">
//                   <p className='mb-3 text-gray-200'>This is your map data combined with the core map data</p>
//                   <hr className='border my-2 border-gray-500' />
//                   <p className='my-2 text-gray-300'>Topojson is a newer version of Geojson, and the recommended format for Stargazer</p>
//                   <Button className="cursor-pointer w-full" variant="secondary" onClick={() => download("topojson", key)}>
//                     <ArrowRightFromLine className="ml-[.6em] inline" /> Topojson
//                   </Button>
//                   <p className='my-2 text-gray-300'>Geojson is an extremely common spec for geography data</p>
//                   <Button className="cursor-pointer w-full my-2" variant="secondary" onClick={() => download("geojson", key)}>
//                     <ArrowRightFromLine className="ml-[.6em] inline" /> <span className="ml-[5px]">Geojson</span>
//                   </Button>
//                   <p className='my-2 text-gray-300'>KML can be imported into a <a href="https://www.google.com/maps/d/u/0/?hl=en" className='text-blue-300' target="_blank">Google Maps</a> layer. Which can be easily distributed publicly for free.</p>
//                   <Button className="cursor-pointer w-full" variant="secondary" onClick={() => download("kml", key)}>
//                     <ArrowRightFromLine className="ml-[.6em] inline" /> <span className="ml-[5px]">KML</span>
//                   </Button>
//                 </PopoverContent>
//               </Popover>

//               <div className="col-span-2 m-2">
//                 <Button className="cursor-pointer rounded w-full" onClick={() => router.push(`/${map}/${dateId}/settings`)}><Settings /> Settings</Button>
//               </div>
//             </div>
//           </div>
//         );
//       })}
//     </div>
//   )
// }
