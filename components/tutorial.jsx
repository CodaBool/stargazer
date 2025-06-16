// import { useMemo } from 'react'
import { CircleHelp } from "lucide-react"
import { useStore } from "./cartographer"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useEffect } from "react"

export default function Starfield({ IS_GALAXY, name }) {
  const { tutorial, setTutorial } = useStore()

  useEffect(() => {
    if (!tutorial) return
    console.log("tutorial change", tutorial)
  }, [tutorial])

  return (
    <Dialog open={true} onOpenChange={(open) => !open && setTutorial(null)}>
      {/* <DialogTrigger><CircleHelp />Tutorial</DialogTrigger> */}
      <DialogContent>
        <DialogHeader>
          <DialogTitle><CircleHelp className="inline" size={18} /> Tutorial</DialogTitle>
          <DialogDescription asChild>
            <div>
              <h1 className="text-2xl">Welcome to Stargazer!</h1>
              <Collapsible>
                <CollapsibleTrigger>How can I create and edit features?</CollapsibleTrigger>
                <CollapsibleContent>
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
                <CollapsibleTrigger>How can I KYS?</CollapsibleTrigger>
                <CollapsibleContent>
                  <p>a gun.</p>
                  <br />
                </CollapsibleContent>
              </Collapsible>

            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}
