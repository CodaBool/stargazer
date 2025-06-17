import { CircleHelp } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useEffect, useState } from "react"
import { isMobile, useStore, windowLocalGet } from "@/lib/utils"

export default function Tutorial({ IS_GALAXY, name }) {
  const { tutorial, setTutorial } = useStore()
  const [check, setCheck] = useState()
  const [osKey, setOSKey] = useState("Alt")
  const mobile = isMobile()

  useEffect(() => {
    if (navigator.platform.toUpperCase().indexOf('MAC') >= 0) {
      setOSKey("Option")
    }
    setCheck(localStorage.getItem("noTutorial") === "true")
  }, [])

  // if this is the first time, show a tutorial
  useEffect(() => {
    windowLocalGet("maps").then(maps => {
      if (Object.keys(maps).length === 0 && !localStorage.getItem("noTutorial") && !tutorial && !mobile) {
        setTutorial(true)
      }
    })
  }, [])

  return (
    <Dialog open={!!tutorial} onOpenChange={(open) => !open && setTutorial(null)}>
      <DialogContent className="max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle><CircleHelp className="inline" size={18} /> Tutorial</DialogTitle>
          <DialogDescription asChild>
            <div>
              <h1 className="text-2xl text-gray-200">Welcome to Stargazer!</h1>
              <Collapsible>
                <CollapsibleTrigger>How can I create and edit features?</CollapsibleTrigger>
                <CollapsibleContent className="text-white my-4">
                  <p>Let's explain a few things about how to create your own map.</p>
                  <br />
                  <p>Create as many points, lines or polygons as you like! Once created you can click on a feature to edit details about it.</p>
                  <br />
                  <p>You can delete features by selecting them and clicking the trash.</p>
                  <br />
                  <p>To move a feature, click and drag it.</p>
                  <br />
                  <p>When creating polygons and lines, you need to <b>double click</b> to finish the shape. Otherwise a new point will be added instead.</p>
                  <br />
                  <p>To edit a polygon or line. You must <b>double click</b> any point <b>on</b> the feature. Then you can either click and drag an existing point. Or you can add new points by clicking on a small dot between any two points</p>
                </CollapsibleContent>
              </Collapsible>
              <Collapsible>
                <CollapsibleTrigger>How can I share or download my map?</CollapsibleTrigger>
                <CollapsibleContent className="text-white my-4">
                  <p>Publishing is done straight from the home page.</p>
                  <br />

                  <ol className="list-decimal">
                    <li>Sign in using a magic link</li>
                    <li>upload a local map</li>
                    <li>Your map will be publicly accessible at /mapName/yourUniqueMapID</li>
                  </ol>
                  <br />
                  <p>Downloading is done straight from the home page.</p>
                </CollapsibleContent>
              </Collapsible>
              <Collapsible>
                <CollapsibleTrigger>Are there any hotkeys?</CollapsibleTrigger>
                <CollapsibleContent className="text-white my-4">
                  <p>Ctrl ={">"} toggle measure distance tool (click to start once mode is active)</p>
                  <br />
                  <p>{osKey} ={">"} toggle coordinate view</p>
                  <br />
                  <p>P ={">"} toggle preview mode</p>
                </CollapsibleContent>
              </Collapsible>
              <Collapsible>
                <CollapsibleTrigger>How can I integrate with FoundryVTT?</CollapsibleTrigger>
                <CollapsibleContent className="text-white my-4">
                  <h3 className="text-lg">Stargazer</h3>
                  <ol className="list-decimal">
                    <li>copy your account secret found at the home page, by clicking the cog icon.</li>
                  </ol>
                  <hr className="my-2 mt-4" />
                  <h3 className="text-lg">Foundry</h3>
                  <ol className="list-decimal" start={2}>
                    <li>Purchase and install the Stargazer module</li>
                    <li>Enter your secret into Foundry settings</li>
                    <li>You can now use the sync button to automatically bring all your maps directly into Foundry. Even generating scenes using them.</li>
                  </ol>
                </CollapsibleContent>
              </Collapsible>
              <Collapsible>
                <CollapsibleTrigger>How can I preview or test my map?</CollapsibleTrigger>
                <CollapsibleContent className="text-white my-4">
                  <p>Once you have added your features. e.g. set icons, colors, types and names. You can open the menu and click <b>Preview</b>. (or just press "p")</p>
                  <br />
                  <p>This preview is not sharable but is an exact match for what your map will look like once published</p>
                </CollapsibleContent>
              </Collapsible>
              <Collapsible>
                <CollapsibleTrigger>How can I make other changes to my map?</CollapsibleTrigger>
                <CollapsibleContent className="text-white my-4">
                  <h3 className="text-lg">Advanced</h3>
                  <p>Great! All maps have settings. You can define things like the bounds of the map. Toggle the pregenerated planets. Or even if its set on Earth's surface! This can be found on the home page. </p>
                  <hr className="my-2 mt-4" />
                  <h3 className="text-lg">Expert</h3>
                  <p>All the code is open source and under a copyleft license. Feel free to fork and tweak as desired (I can write a wiki guide on GitHub, just ping me using an issue. Then I will write on up for you). I do expose some Maplibre settings like the style spec and layout overrides for the symbol layer. Find those configs in any map settings page.</p>
                </CollapsibleContent>
              </Collapsible>
              <Collapsible>
                <CollapsibleTrigger>Can you add a map for my favorite universe?</CollapsibleTrigger>
                <CollapsibleContent className="text-white my-4">
                  <p>Due to copyright, I have no plans to add other maps.</p>
                </CollapsibleContent>
              </Collapsible>
              {name !== "custom" &&
                <Collapsible>
                  <CollapsibleTrigger>How can I edit the base {name} map?</CollapsibleTrigger>
                  <CollapsibleContent className="text-white my-4">
                    <p>Base map data is shared with everyone in the community. If you have a valid source for an addition or edit I would love to review it. Click the Contribute button in the menu to get started.</p>
                  </CollapsibleContent>
                </Collapsible>
              }
            </div>
          </DialogDescription>
        </DialogHeader>
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
      </DialogContent>
    </Dialog>
  )
}
