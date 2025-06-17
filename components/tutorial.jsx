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
import { useStore } from "@/lib/utils"

export default function Tutorial({ IS_GALAXY, name }) {
  const { tutorial, setTutorial } = useStore()
  const [check, setCheck] = useState()
  const [osKey, setOSKey] = useState("Alt")

  useEffect(() => {
    if (navigator.platform.toUpperCase().indexOf('MAC') >= 0) {
      setOSKey("Option")
    }
    setCheck(localStorage.getItem("noTutorial") === "true")
  }, [])

  return (
    <Dialog open={!!tutorial} onOpenChange={(open) => !open && setTutorial(null)}>
      <DialogContent>
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
                  <p>When creating polygons and lines, you need to <b>double click</b> to finish the shape. Otherwise a new point will be added.</p>
                  <br />
                  <p>To edit a polygon or line. You must <b>double click</b> any point on the feature. Then you can either click and drag an existing point. Or you can add new points by clicking on a small dot between any two points</p>
                </CollapsibleContent>
              </Collapsible>
              <Collapsible>
                <CollapsibleTrigger>How can I share or download my map?</CollapsibleTrigger>
                <CollapsibleContent className="text-white my-4">
                  <p>Publishing is done straight from the main menu.</p>
                  <br />

                  <ol className="list-decimal">
                    <li>Sign in using a magic link</li>
                    <li>upload a local map</li>
                    <li>Your map will be publicly accessible at /mapName/yourUniqueMapID</li>
                  </ol>
                  <br />
                  <p>Downloading is done straight from the main menu.</p>
                </CollapsibleContent>
              </Collapsible>
              <Collapsible>
                <CollapsibleTrigger>Are there any hotkeys?</CollapsibleTrigger>
                <CollapsibleContent className="text-white my-4">
                  <p>Ctrl ={">"} toggle measure distance tool (click to start once mode is active)</p>
                  <br />
                  <p>{osKey} ={">"} toggle coordinate view</p>
                </CollapsibleContent>
              </Collapsible>

            </div>
          </DialogDescription>
        </DialogHeader>
        <div>
          <Checkbox
            checked={check}
            onCheckedChange={e => {
              const newValue = e ? "true" : "false"
              setCheck(e)
              localStorage.setItem("noTutorial", newValue)
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
