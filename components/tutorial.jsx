import { CircleHelp, Heart, MoonStar, Sparkles, SquareArrowOutUpRight, Telescope } from "lucide-react"
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
import { isMobile, useStore, getMaps, TITLE, REPO, USER } from "@/lib/utils"

export default function Tutorial({ name }) {
  const { tutorial, setTutorial, setCredits, credits } = useStore()
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
  }, [])

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

      <Dialog open={!!credits} onOpenChange={o => !o && setCredits(null)}>
        <DialogContent className="max-w-[410px]" style={{ color: 'white' }}>
          <DialogHeader>
            <DialogTitle className="text-center">
              <>
                <Heart size={18} className="pe-[2px] animate-bounce inline mr-2" /> Credits
              </>
            </DialogTitle>
            <DialogDescription className="py-6" asChild>
              <Credits name={name} />
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <Dialog open={!!tutorial} onOpenChange={(open) => !open && setTutorial(null)} >
        <DialogContent className="max-h-[880px] overflow-auto">
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
                          <CollapsibleTrigger>What is {TITLE}?</CollapsibleTrigger>
                          <CollapsibleContent className="text-white my-4">
                            <p>Custom scifi map tool for RPGs. You can create your own custom locations. A <a href="https://github.com/CodaBool/map" className="text-blue-200" target="_blank">Foundry VTT integration</a> is available. Main features:</p>
                            <br />

                            <ul className="list-disc ml-5">
                              <li>create custom locations</li>
                              <li>publish your map online</li>
                              <li>measure distances and find coordinates</li>
                              <li>search all locations</li>
                            </ul>
                          </CollapsibleContent>
                        </Collapsible>
                        <Collapsible>
                          <CollapsibleTrigger>How can I share or download my map?</CollapsibleTrigger>
                          <CollapsibleContent className="text-white my-4">
                            <p>Publishing is done straight from the home page.</p>
                            <br />

                            <ol className="list-decimal ml-5">
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
                            <ol className="list-decimal ml-5">
                              <li>copy your account secret found at the home page, by clicking the cog icon.</li>
                            </ol>
                            <hr className="my-2 mt-4" />
                            <h3 className="text-lg">Foundry</h3>
                            <ol className="list-decimal ml-5" start={2}>
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

                            <h3 className="text-lg">Expert script kitty <span style={{ color: "#5BCEFA" }}>co</span><span style={{ color: "#F5A9B8" }}>di</span><span style={{ color: "#FFFFFF" }}>ng</span><span style={{ color: "#F5A9B8" }}> so</span><span style={{ color: "#5BCEFA" }}>cks</span> level</h3>
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
                        <p className="text-white text-center">To add locations to the map, use the controls in the top right corner.</p>
                        <p className="text-white text-center">Click on any of the video thumbnails below to see more details.</p>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col items-center hover-grow">
                            <video src="/tutorial/line.webm" className="cursor-pointer min-h-[150px] bg-gray-900 animate-pulse" autoPlay loop muted playsInline width={200} height={200} onClick={() => setFullscreenVideo({ src: "/tutorial/line.webm", title: "Create a Line", desc: "Add points with a single click. Use a double click to finish the line." })} />
                            <p className="text-center mt-2">Create a Line</p>
                          </div>
                          <div className="flex flex-col items-center hover-grow">
                            <video src="/tutorial/point.webm" className="cursor-pointer min-h-[150px] bg-gray-900 animate-pulse" autoPlay loop muted playsInline width={200} height={200} onClick={() => setFullscreenVideo({ src: "/tutorial/point.webm", title: "Create a Point", desc: "Add a point with a single click" })} />
                            <p className="text-center mt-2">Create a Point</p>
                          </div>
                          <div className="flex flex-col items-center hover-grow">
                            <video src="/tutorial/poly_create.webm" className="cursor-pointer min-h-[150px] bg-gray-900 animate-pulse" autoPlay loop muted playsInline width={200} height={200} onClick={() => setFullscreenVideo({ src: "/tutorial/poly_create.webm", title: "Create a Polygon", desc: "Add points with a single click. Use a double click to finish the polygon." })} />
                            <p className="text-center mt-2">Create a Polygon</p>
                          </div>
                          <div className="flex flex-col items-center hover-grow">
                            <video src="/tutorial/move.webm" className="cursor-pointer min-h-[150px] bg-gray-900 animate-pulse" autoPlay loop muted playsInline width={200} height={200} onClick={() => setFullscreenVideo({ src: "/tutorial/move.webm", title: "Move a Feature", desc: "Click to select and then click and drag to move." })} />
                            <p className="text-center mt-2">Move</p>
                          </div>
                          <div className="flex flex-col items-center hover-grow">
                            <video src="/tutorial/poly_edit.webm" className="cursor-pointer min-h-[150px] bg-gray-900 animate-pulse" autoPlay loop muted playsInline width={200} height={200} onClick={() => setFullscreenVideo({ src: "/tutorial/poly_edit.webm", title: "Edit a Polygon", desc: "Double click a polygon to edit. Click any midpoint to add a new point. Click and drag an existing point to move it." })} />
                            <p className="text-center mt-2">Edit a Polygon</p>
                          </div>
                          <div className="flex flex-col items-center hover-grow">
                            <video src="/tutorial/delete.webm" className="cursor-pointer min-h-[150px] bg-gray-900 animate-pulse" autoPlay loop muted playsInline width={200} height={200} onClick={() => setFullscreenVideo({ src: "/tutorial/delete.webm", title: "Delete a Feature", desc: 'Select a shape and click the delete button. The "delete" key on your keyboard will also delete the selected shape.' })} />
                            <p className="text-center mt-2">Delete</p>
                          </div>
                        </div>

                        <p className="text-white mt-1 text-center">When done, enter preview mode to see how your map will look.</p>
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


function Credits({ name }) {
  return (
    <>
      <span className="text-xl"><Telescope className="inline pr-2 ml-[6.8em]" size={32} /> Major</span>
      <span className="flex mb-12 mt-5">
        <span className="flex-1">
          <svg width="200" height="100" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(-40, -90) scale(0.4)">
              <path id="svg_3" d="m110.45,277.97498l9.54922,0l2.95078,-8.78524l2.95078,8.78524l9.54921,0l-7.72546,5.42952l2.95093,8.78524l-7.72547,-5.42966l-7.72547,5.42966l2.95093,-8.78524l-7.72547,-5.42952z" stroke="black" fill="#fff" />
              <path id="svg_5" d="m218.45,252.97498l9.54922,0l2.95078,-8.78524l2.95078,8.78524l9.54922,0l-7.72547,5.42952l2.95094,8.78524l-7.72547,-5.42966l-7.72547,5.42966l2.95094,-8.78524l-7.72547,-5.42952z" stroke="black" fill="white" />
              <path id="svg_6" d="m270.45001,295.97498l9.54922,0l2.95078,-8.78524l2.95078,8.78524l9.54922,0l-7.72547,5.42952l2.95094,8.78524l-7.72547,-5.42966l-7.72547,5.42966l2.95094,-8.78524l-7.72547,-5.42952z" stroke="black" fill="#fff" />
              <path id="svg_7" d="m379.45,425.97501l9.54922,0l2.95078,-8.78524l2.95078,8.78524l9.54922,0l-7.72547,5.42952l2.95094,8.78524l-7.72547,-5.42966l-7.72547,5.42966l2.95094,-8.78524l-7.72547,-5.42952z" stroke="black" fill="#fff" />
              <path id="svg_8" d="m529.45003,436.97504l9.54922,0l2.95078,-8.78524l2.95078,8.78524l9.54922,0l-7.72547,5.42952l2.95094,8.78524l-7.72547,-5.42966l-7.72547,5.42966l2.95094,-8.78524l-7.72547,-5.42952z" stroke="black" fill="#fff" />
              <path id="svg_9" d="m547.45006,338.97501l9.54922,0l2.95078,-8.78524l2.95078,8.78524l9.54922,0l-7.72547,5.42952l2.95094,8.78524l-7.72547,-5.42966l-7.72547,5.42966l2.95094,-8.78524l-7.72547,-5.42952z" stroke="black" fill="#fff" />
              <path id="svg_10" d="m362.45003,345.97501l9.54922,0l2.95078,-8.78524l2.95078,8.78524l9.54922,0l-7.72547,5.42952l2.95094,8.78524l-7.72547,-5.42966l-7.72547,5.42966l2.95094,-8.78524l-7.72547,-5.42952z" stroke="black" fill="#fff" />
              <line id="svg_11" y2="257.00005" x2="232.0001" y1="282.00006" x1="123.00008" stroke="mediumpurple" fill="none" />
              <line id="svg_12" y2="441.00008" x2="542.00014" y1="342.00007" x1="560.00015" stroke="mediumpurple" fill="none" />
              <line id="svg_13" y2="442.00008" x2="543.00014" y1="428.00008" x1="391.00012" stroke="mediumpurple" fill="none" />
              <line id="svg_14" y2="342.00007" x2="560.00015" y1="349.00007" x1="376.00012" stroke="mediumpurple" fill="none" />
              <line id="svg_15" y2="300.00006" x2="285.0001" y1="256.00005" x1="230.0001" stroke="mediumpurple" fill="none" />
              <line id="svg_16" y2="346.00007" x2="375.00012" y1="427.00008" x1="391.00012" stroke="mediumpurple" fill="none" />
              <line id="svg_17" y2="349.00007" x2="374.00012" y1="298.00006" x1="284.0001" stroke="mediumpurple" fill="none" />
            </g>
          </svg>
        </span>
        <span className="flex-1 text-left">
          {name.includes("lancer") &&
            <>
              <span><Sparkles className="inline pr-2" /><a href="https://janederscore.tumblr.com" target="_blank"> Janederscore <SquareArrowOutUpRight className="inline" size={14} /></a></span><br />
              <span><Sparkles className="inline pr-2" /> Starwall</span><br />
            </>}
          {name === "fallout" &&
            <>
              <span className="text-xs md:text-md"><Sparkles className="inline pr-2" /> <a href="https://github.com/MeepChangeling" target="_blank"> MeepChangeling <SquareArrowOutUpRight className="inline" size={14} /></a></span><br />
            </>
          }
          {name === "alien" &&
            <>
              <span className="text-xs md:text-md"><Sparkles className="inline pr-2" /> <a href="https://github.com/claydegruchy" target="_blank"> Clay DeGrunchy <SquareArrowOutUpRight className="inline" size={14} /></a></span><br />
            </>
          }
          {name === "mothership" &&
            <>
              <span><Sparkles className="inline pr-2" /> morgan_x_4</span><br />

            </>
          }
          {name === "warhammer" &&
            <>
              <span className="text-xs md:text-md"><Sparkles className="inline pr-2" /> <a href="https://jambonium.co.uk/horus-heresy-map-project" target="_blank"> Michelle Janion <SquareArrowOutUpRight className="inline" size={14} /></a></span><br />
              <span className="text-[0.7em] md:text-md"><Sparkles className="inline pr-2" /> <a href="https://wyrmlog.wyrmworld.com" target="_blank"> Purple Wyrm (icons) <SquareArrowOutUpRight className="inline" size={14} /></a></span><br />
            </>
          }
          {/* {name === "cyberpunk" &&
            <>
              <span className="text-xs md:text-md"><Sparkles className="inline pr-2" /> <a href="https://www.reddit.com/user/devianaut" target="_blank"> Devianaut <SquareArrowOutUpRight className="inline" size={14} /></a></span><br />
            </>
          }*/}
          {name === "starwars" &&
            <>
              <span className="text-[0.7em] md:text-md"><Sparkles className="inline pr-2" /> <a href="https://github.com/jennygrahamjones" target="_blank"> Jenny Graham-Jones <SquareArrowOutUpRight className="inline" size={14} /></a></span><br />
            </>
          }
        </span>
      </span>
      <span className="text-xl"><MoonStar className="inline pr-2 ml-[7em]" size={32} /> Minor</span>
      <span className="flex">
        <span className="flex-1">
          <svg width="240" height="100" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(-40, -10) scale(0.4)">
              <path id="svg_3" d="m179.45002,183.97498l9.54922,0l2.95078,-8.78524l2.95078,8.78524l9.54921,0l-7.72546,5.42952l2.95093,8.78524l-7.72547,-5.42966l-7.72547,5.42966l2.95093,-8.78524l-7.72547,-5.42952z" stroke="#000" fill="#fff" />
              <path id="svg_5" d="m226.45,220.97498l9.54922,0l2.95078,-8.78524l2.95078,8.78524l9.54922,0l-7.72547,5.42952l2.95094,8.78524l-7.72547,-5.42966l-7.72547,5.42966l2.95094,-8.78524l-7.72547,-5.42952z" stroke="#000" fill="#fff" />
              <path id="svg_6" d="m239.45,116.97495l9.54922,0l2.95078,-8.78524l2.95078,8.78524l9.54922,0l-7.72547,5.42952l2.95094,8.78524l-7.72547,-5.42966l-7.72547,5.42966l2.95094,-8.78524l-7.72547,-5.42952z" stroke="#000" fill="#fff" />
              <path id="svg_7" d="m476.45001,128.97495l9.54922,0l2.95078,-8.78524l2.95078,8.78524l9.54922,0l-7.72547,5.42952l2.95094,8.78524l-7.72547,-5.42966l-7.72547,5.42966l2.95094,-8.78524l-7.72547,-5.42952z" stroke="#000" fill="#fff" />
              <path id="svg_8" d="m551.45003,151.97501l9.54922,0l2.95078,-8.78524l2.95078,8.78524l9.54922,0l-7.72547,5.42952l2.95094,8.78524l-7.72547,-5.42966l-7.72547,5.42966l2.95094,-8.78524l-7.72547,-5.42952z" stroke="#000" fill="#fff" />
              <path id="svg_9" d="m383.45004,120.97498l9.54922,0l2.95078,-8.78524l2.95078,8.78524l9.54922,0l-7.72547,5.42952l2.95094,8.78524l-7.72547,-5.42966l-7.72547,5.42966l2.95094,-8.78524l-7.72547,-5.42952z" stroke="#000" fill="#fff" />
              <path id="svg_10" d="m274.45002,165.97498l9.54922,0l2.95078,-8.78524l2.95078,8.78524l9.54922,0l-7.72547,5.42952l2.95094,8.78524l-7.72547,-5.42966l-7.72547,5.42966l2.95094,-8.78524l-7.72547,-5.42952z" stroke="#000" fill="#fff" />
              <line id="svg_18" y2="226.00005" x2="240.0001" y1="186.00004" x1="191.00009" stroke="mediumpurple" fill="none" />
              <line id="svg_19" y2="132.00004" x2="487.00014" y1="156.00004" x1="564.00015" stroke="mediumpurple" fill="none" />
              <line id="svg_20" y2="170.00004" x2="287.0001" y1="124.00003" x1="395.00012" stroke="mediumpurple" fill="none" />
              <line id="svg_21" y2="120.00003" x2="252.0001" y1="185.00004" x1="191.00009" stroke="mediumpurple" fill="none" />
              <line id="svg_22" y2="124.00003" x2="394.00012" y1="131.00004" x1="488.00014" stroke="mediumpurple" fill="none" />
              <line id="svg_23" y2="170.00004" x2="289.00011" y1="224.00005" x1="239.0001" stroke="mediumpurple" fill="none" />
              <line id="svg_24" y2="171.00004" x2="289.00011" y1="121.00003" x1="252.0001" stroke="mediumpurple" fill="none" />
            </g >
          </svg>
        </span>
        <span className="flex-1">
          {/* <span><Sparkle className="inline pr-2" /><a href="" target="_blank"> placeholder <SquareArrowOutUpRight className="inline" size={14} /></a></span><br /> */}
          {/* <span><Sparkle className="inline pr-2" /> contribute to be added</span><br /> */}
        </span>
      </span>
      {TITLE === "Stargazer" &&
        <span className="text-center block text-[dimgray] mt-4">Created with <Heart size={14} className="inline" /> by <Link href={`/easteregg?redirect=${window?.location?.href || "/" + name}`} style={{ color: "#60677c" }}>{USER}</Link></span>
      }

      {name.includes("lancer") && <span className="text-center block text-[dimgray] mt-4">{TITLE} is not an official Lancer product<br />Lancer is copyright Massif Press</span>}
      {name === "cyberpunk" && <span className="text-center block text-[dimgray] mt-4 text-xs">{TITLE} is not an official R. Talsorian Games Inc., CD Projekt Red S.A., or Cyberpunk product<br />This project is created for entertainment purposes only</span>}
      {name === "mothership" && <span className="text-center block text-[dimgray] mt-4 text-xs">{TITLE} is not an official Mothership RPG or Tuesday Knight Games product<br />This project is created for entertainment purposes only.</span>}
      {name === "dnd" && <span className="text-center block text-[dimgray] mt-4 text-xs">{TITLE} is not an official Dungeons & Dragons or Wizards of the Coast product<br />This project is created for entertainment purposes only.</span>}
      {REPO &&
        <span className="text-center">
          <Link href={`/legal?redirect=${window?.location?.href || "/" + name}`} className="hover:underline text-sm inline text-[#8A8A8A]">
            Full Disclaimer
          </Link>
        </span>
      }
    </>
  )
}
