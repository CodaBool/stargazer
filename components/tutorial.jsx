import { CircleHelp } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useEffect, useState } from "react"
import { isMobile, useStore, getMaps, TITLE } from "@/lib/utils"
import { useMap } from "@vis.gl/react-maplibre"

export default function Tutorial({ name }) {
  const { tutorial, setTutorial } = useStore()
  const { map } = useMap()
  const [check, setCheck] = useState()
  // const [osKey, setOSKey] = useState("Alt")
  const [fullscreenVideo, setFullscreenVideo] = useState()
  const mobile = isMobile()

  useEffect(() => {
    // if (navigator.platform.toUpperCase().indexOf('MAC') >= 0) {
    //   setOSKey("Option")
    // }
    setCheck(localStorage.getItem("noTutorial") === "true")
    // if this is the first time, show a tutorial
    getMaps().then(maps => {
      if (Object.keys(maps).length === 0 && !localStorage.getItem("noTutorial") && !tutorial && !mobile) {
        setTutorial("faq")
      }
    })
    map.on('draw.modechange', (e) => {
      console.log('Draw mode changed to:', e.mode)
      // Run your JS here
    })
  }, [])
  // useEffect(() => {
  //   console.log("tutorial", tutorial)
  // }, [tutorial])

  return (
    <>
      <Dialog open={!!fullscreenVideo} onOpenChange={() => setFullscreenVideo(null)}>
        <DialogContent className="p-3 bg-black max-w-[90vw] max-h-[90vh] text-center">
          <DialogTitle className="mb-4 text-4xl">{fullscreenVideo?.title}</DialogTitle>
          <DialogDescription>{fullscreenVideo?.desc}</DialogDescription>
          {fullscreenVideo?.src && (
            <video
              src={fullscreenVideo.src}
              autoPlay
              loop
              muted
              playsInline
              controls
              className="w-full h-full object-contain max-w-[80vw] max-h-[60vh] mx-auto"
            />
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={!!tutorial} onOpenChange={(open) => !open && setTutorial(null)} >
        <DialogContent className="max-h-[850px] overflow-auto">
          <DialogHeader>
            <DialogTitle><CircleHelp className="inline" size={18} /> Tutorial</DialogTitle>
            <DialogDescription asChild>
              <div>
                <h1 className="text-2xl text-gray-200">Welcome to {TITLE}!</h1>
                {mobile
                  ? <p className="my-8">Unfortunately many features are not available on mobile. Please visit the website on desktop to view the full capabilities.</p>
                  : <>

                    <Tabs defaultValue="faq" className="w-full" value={tutorial}>
                      <TabsList className="w-full">
                        <TabsTrigger value="faq" onClick={() => setTutorial('faq')}>F.A.Q.</TabsTrigger>
                        <TabsTrigger value="create" onClick={() => setTutorial('create')}>Add Locations</TabsTrigger>
                      </TabsList>
                      <TabsContent value="faq">
                        <Collapsible>
                          <CollapsibleTrigger>How can I share or download my map?</CollapsibleTrigger>
                          <CollapsibleContent className="text-white my-4">
                            <p>Publishing is done straight from the home page.</p>
                            <br />

                            <ol className="list-decimal">
                              <li>Sign in</li>
                              <li>upload a local map</li>
                              <li>Your map will be publicly accessible at /{name}/yourUniqueMapID</li>
                            </ol>
                            <br />
                            <p>Downloading is done straight from the home page.</p>
                          </CollapsibleContent>
                        </Collapsible>
                        <Collapsible>
                          <CollapsibleTrigger>Are there any hotkeys?</CollapsibleTrigger>
                          <CollapsibleContent className="text-white my-4">
                            <p>Z ={">"} toggle measure distance tool</p>
                            <br />
                            <p>C ={">"} toggle coordinate view</p>
                            <br />
                            <p>P / B ={">"} toggle preview mode</p>
                          </CollapsibleContent>
                        </Collapsible>
                        <Collapsible>
                          <CollapsibleTrigger>How can I integrate with FoundryVTT?</CollapsibleTrigger>
                          <CollapsibleContent className="text-white my-4">
                            <h3 className="text-lg">{TITLE}</h3>
                            <ol className="list-decimal">
                              <li>copy your account secret found at the home page, by clicking the cog icon.</li>
                            </ol>
                            <hr className="my-2 mt-4" />
                            <h3 className="text-lg">Foundry</h3>
                            <ol className="list-decimal" start={2}>
                              <li>Purchase and install the Stargazer module</li>
                              <li>Enter your secret from step 1 into Foundry settings</li>
                              <li>You can now use the sync button to automatically bring all your maps directly into Foundry. Even generating scenes using them!</li>
                            </ol>
                          </CollapsibleContent>
                        </Collapsible>
                        <Collapsible>
                          <CollapsibleTrigger>How can I preview or test my map?</CollapsibleTrigger>
                          <CollapsibleContent className="text-white my-4">
                            <p>Once you have added your features (e.g. set icons, colors, types and names). You can open the menu and click <b>Preview</b>. (or just press "p")</p>
                            <br />
                            <p>This preview is not sharable but is an exact match for what your map will look like once published</p>
                          </CollapsibleContent>
                        </Collapsible>
                        <Collapsible>
                          <CollapsibleTrigger>How can I make other changes to my map?</CollapsibleTrigger>
                          <CollapsibleContent className="text-white my-4">
                            <h3 className="text-lg">Advanced level</h3>
                            <p>All maps have settings. You can define things like the bounds of the map. Toggle the pregenerated planets. This can be found on the home page. </p>
                            <hr className="my-2 mt-4" />

                            <h3 className="text-lg">Expert script kitty <span style={{ color: "#5BCEFA" }}>co</span><span style={{ color: "#F5A9B8" }}>di</span><span style={{ color: "#FFFFFF" }}>ng</span><span style={{ color: "#F5A9B8" }}> so</span><span style={{ color: "#5BCEFA" }}>cks</span> vibe coder level</h3>
                            <p>All the code is open source and under a copyleft license. Feel free to fork and tweak as desired (I can write a wiki guide on GitHub, just ping me using an issue. Then I will write one up for you). I do expose some Maplibre settings like the style spec and layout overrides for the symbol layer. You can find those configs in the map settings page.</p>
                          </CollapsibleContent>
                        </Collapsible>
                        {process.env.NEXT_PUBLIC_REPO &&
                          <Collapsible>
                            <CollapsibleTrigger>Can you add a map for my favorite universe?</CollapsibleTrigger>
                            <CollapsibleContent className="text-white my-4">
                              <p>Due to copyright, I have no plans to add other maps.</p>
                            </CollapsibleContent>
                          </Collapsible>
                        }
                        {name !== "custom" &&
                          <Collapsible>
                            <CollapsibleTrigger>How can I edit the base {name} map?</CollapsibleTrigger>
                            <CollapsibleContent className="text-white my-4">
                              <p>Base map data is shared with everyone in the community. If you have a valid source for an addition or edit I would love to review it. Click the Contribute button in the menu to get started.</p>
                            </CollapsibleContent>
                          </Collapsible>
                        }
                      </TabsContent>
                      <TabsContent value="create">
                        <p className="text-white my-2 text-center">To add locations to the map, use the controls in the top right corner.</p>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col items-center">
                            <video src="/tutorial/line.webm" className="cursor-pointer min-h-[150px] bg-gray-900 animate-pulse" autoPlay loop muted playsInline width={200} height={200} onClick={() => setFullscreenVideo({ src: "/tutorial/line.webm", title: "Create a Line", desc: "Add points with a single click. Use a double click to finish the line." })} />
                            <p className="text-center mt-2">Create a Line</p>
                          </div>
                          <div className="flex flex-col items-center">
                            <video src="/tutorial/point.webm" className="cursor-pointer min-h-[150px] bg-gray-900 animate-pulse" autoPlay loop muted playsInline width={200} height={200} onClick={() => setFullscreenVideo({ src: "/tutorial/point.webm", title: "Create a Point", desc: "Add a point with a single click" })} />
                            <p className="text-center mt-2">Create a Point</p>
                          </div>
                          <div className="flex flex-col items-center">
                            <video src="/tutorial/poly_create.webm" className="cursor-pointer min-h-[150px] bg-gray-900 animate-pulse" autoPlay loop muted playsInline width={200} height={200} onClick={() => setFullscreenVideo({ src: "/tutorial/poly_create.webm", title: "Create a Polygon", desc: "Add points with a single click. Use a double click to finish the polygon." })} />
                            <p className="text-center mt-2">Create a Polygon</p>
                          </div>
                          <div className="flex flex-col items-center">
                            <video src="/tutorial/move.webm" className="cursor-pointer min-h-[150px] bg-gray-900 animate-pulse" autoPlay loop muted playsInline width={200} height={200} onClick={() => setFullscreenVideo({ src: "/tutorial/move.webm", title: "Move a Feature", desc: "Click to select and then click and drag to move." })} />
                            <p className="text-center mt-2">Move</p>
                          </div>
                          <div className="flex flex-col items-center">
                            <video src="/tutorial/poly_edit.webm" className="cursor-pointer min-h-[150px] bg-gray-900 animate-pulse" autoPlay loop muted playsInline width={200} height={200} onClick={() => setFullscreenVideo({ src: "/tutorial/poly_edit.webm", title: "Edit a Polygon", desc: "Double click a polygon to edit. Click any midpoint to add a new point. Click and drag an existing point to move it." })} />
                            <p className="text-center mt-2">Edit a Polygon</p>
                          </div>
                          <div className="flex flex-col items-center">

                            <video src="/tutorial/delete.webm" className="cursor-pointer min-h-[150px] bg-gray-900 animate-pulse" autoPlay loop muted playsInline width={200} height={200} onClick={() => setFullscreenVideo({ src: "/tutorial/delete.webm", title: "Delete a Feature", desc: 'Select a shape and click the delete button. The "delete" key on your keyboard will also delete the selected shape.' })} />
                            <p className="text-center mt-2">Delete</p>
                          </div>
                        </div>

                        <p className="text-white mt-4 text-center">When done, enter preview mode to see how your map will look.</p>

                      </TabsContent>
                    </Tabs>

                  </>
                }

              </div>
            </DialogDescription>
          </DialogHeader>
          {!mobile &&
            <div>
              <Checkbox
                checked={check}
                onCheckedChange={e => {
                  setCheck(e)
                  if (e) {
                    localStorage.setItem("noTutorial", true)
                  } else {
                    localStorage.removeItem("noTutorial")
                  }
                }}
              />
              <label className="ms-2 inline">
                <span>Don't show this tutorial again</span>
              </label>
            </div>
          }
        </DialogContent>
      </Dialog>
    </>

  )
}
