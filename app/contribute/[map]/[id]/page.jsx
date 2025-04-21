import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import CommentForm from "@/components/forms/comment"
import Avatar from "boring-avatars"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getServerSession } from "next-auth"
import DOMPurify from "isomorphic-dompurify"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import db from "@/lib/db"
import { ArrowLeft, Star, CircleX } from "lucide-react"
import style from "../md.module.css"
// import MiniMap from "@/components/minimap"

export default async function Location({ params, searchParams }) {
  // const
  const session = await getServerSession(authOptions)
  const { id, map } = await params
  const { c: commentFormOpen } = await searchParams
  const user = session ? await db.user.findUnique({ where: { email: session.user.email } }) : null
  const isAdmin = user?.email === process.env.EMAIL

  const location = await db.location.findUnique({
    where: {
      id: Number(id),
      // map: mapFilter,
    },
    include: {
      comments: {
        where: {
          OR: [
            { published: true },
            { userId: user ? user.id : "" },
          ]
        }
      }
    }
  })

  // seems like an expensive operation
  const commenterIds = location?.comments.map(c => c.userId)
  const commenters = await db.user.findMany({
    where: {
      id: {
        in: commenterIds
      }
    },
    select: {
      id: true,
      alias: true,
      email: true,
      vip: true,
    }
  })

  let viewable = location?.published
  if (!viewable && location?.userId === user?.id) {
    viewable = true
  }

  // const creator = location.map.split('-')[1]
  // run this on every anchor tag
  DOMPurify.addHook('afterSanitizeElements', node => {
    if (node.tagName === 'A') {
      // check if relative, trusted, or already altered link
      if (!node.href.startsWith("/") && !node.href.startsWith('https://stargazer.vercel.app/')) {
        // give a prompt that the link is external
        const href = new URLSearchParams({ url: node.href }).toString()
        node.setAttribute('href', `/link?${href}`)
      }
    }
  })


  const vip = commenters.filter(u => u.vip).map(u => u.id)
  const adminArray = commenters.filter(u => u.email === process.env.EMAIL).map(u => u.id)
  let adminId
  if (adminArray.length === 1) {
    adminId = adminArray[0]
  }

  // strip dangerous tags
  DOMPurify.setConfig({
    FORBID_TAGS: ['img', 'svg', 'math', 'script', 'table', 'iframe'],
  })

  // sanitize location HTML
  location.description = DOMPurify.sanitize(location.description)

  // sanitize comment HTML
  location.comments.forEach(comment => {
    const commenter = commenters.find(user => user.id === comment.userId)
    comment.alias = commenter.alias ? commenter.alias : commenter.email.split('@')[0]
    comment.content = DOMPurify.sanitize(comment.content)
  })

  let panX = "wow such NaN"
  let panY = "wow such NaN"
  let type = "location"
  let coordPretty = "complex, see map"
  if (location.coordinates.includes(",")) {
    // console.log("coord setup", location.coordinates)
    panX = Number(location.coordinates.split(",")[0].trim())
    panY = Number(location.coordinates.split(",")[1].trim())
    if (location.geometry.includes("Poly")) {
      type = "territory"
    } else if (location.geometry === "LineString") {
      type = "guide"
    } else {
      coordPretty = Math.floor(Number(panY)) + " " + Math.floor(panX)
    }
  }
  console.log("open", `/${map}?locked=1&lng=${panX}&lat=${panY}&name=${encodeURIComponent(location.name)}&type=${type}&search=0&hamburger=0`)

  return (
    <div className="mx-auto my-4 flex justify-center flex-col md:container select-text">
      <Link href={`/contribute/${map}`} className="w-[50px] block">
        <div className="w-[50px] h-[50px] rounded-2xl border border-[#1E293B] mb-2 ml-6 md:ml-0" style={{ background: "#070a0d" }}>
          <ArrowLeft size={42} className="relative left-[3px] top-[3px]" />
        </div>
      </Link>
      <Card className="">
        <CardHeader>
          <CardTitle>
            {location.name}
            {!location.published && <Badge variant="secondary" className="mx-1">Pending Review</Badge>}
            {location.unofficial && <Badge variant="destructive" className="mx-1">Unofficial</Badge>}
            {location.destroyed && <Badge variant="secondary" className="mx-1">Destroyed</Badge>}
            {location.capital && <Badge variant="secondary" className="mx-1">Capital</Badge>}
          </CardTitle>
          <div className="text-gray-400">{location.type}</div>
          <span className="">Updated: <span className="text-gray-400">
            {new Date(location.updatedAt).toISOString().split('T')[0].replace(/-/g, '/')}
          </span></span>
          <span className="">Coordinates: <span className="text-gray-400">{coordPretty}</span></span>
          {location.faction && <span className="inline">Faction: <span className="text-gray-400 inline">{location.faction}</span></span>}
          {location.city && <span className="inline">City: <span className="text-gray-400 inline">{location.city}</span></span>}
          {location.alias && <span className="inline">Alias: <span className="text-gray-400 inline">{location.alias}</span></span>}
          {location.source && <span className="">Source: <span className="text-gray-400">{location.source}</span></span>}
        </CardHeader>

        <CardContent className="location-description border border-gray-800 rounded-2xl pt-4 md:mx-6 bg-[#02050D]">
          <div className={style.markdown} dangerouslySetInnerHTML={{ __html: location.description }}></div>
        </CardContent>


        <Accordion type="single" collapsible className="md:mx-8 mx-4">
          <AccordionItem value="item-1">
            <AccordionTrigger className="cursor-pointer">See on map</AccordionTrigger>
            <AccordionContent className="map-container flex justify-around">
              {isNaN(panX)
                ? <div>
                  <CircleX className="mx-auto" /> Invalid Coordinates
                </div>
                : <iframe src={`/${map}?locked=1&lng=${panX}&lat=${panY}&z=4&name=${encodeURIComponent(location.name)}&type=${type}&search=0&hamburger=0&zoom=0`} width="600" height="400" style={{ border: "none" }}></iframe>
              }
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <CardFooter className="flex-col items-start mt-4 md:p-6 p-1">
          {commentFormOpen
            ? <CommentForm map={map} locationId={id} />
            : session
              ? <Link href={`/contribute/${map}/${id}/?c=1`} className="md:w-[150px] w-full"><Button variant="outline" className="md:w-[150px] w-full cursor-pointer">Create Comment</Button></Link>
              : <Link href="/api/auth/signin" className="md:w-[150px] w-full"><Button variant="outline" className="md:w-[150px] w-full cursor-pointer">Create Comment</Button></Link>
          }
          <div className="w-full my-4">
            {location.comments.map(comment => {
              return (
                <div className="border border-gray-800 p-2 rounded mb-1" key={comment.id}>
                  <div className="flex items-center mb-1">
                    {adminId === comment.userId &&
                      <svg fill="gold" style={{ position: "relative", left: "23px", top: "-15px" }} width="20px" height="14px" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
                        <path d="M220,98.865c0-12.728-10.355-23.083-23.083-23.083s-23.083,10.355-23.083,23.083c0,5.79,2.148,11.084,5.681,15.14
	l-23.862,21.89L125.22,73.002l17.787-20.892l-32.882-38.623L77.244,52.111l16.995,19.962l-30.216,63.464l-23.527-21.544
	c3.528-4.055,5.671-9.344,5.671-15.128c0-12.728-10.355-23.083-23.083-23.083C10.355,75.782,0,86.137,0,98.865
	c0,11.794,8.895,21.545,20.328,22.913l7.073,84.735H192.6l7.073-84.735C211.105,120.41,220,110.659,220,98.865z"/>
                      </svg>
                    }
                    <Avatar
                      size={25}
                      name={comment.alias}
                      variant="beam"
                      colors={[
                        '#DBD9B7',
                        '#C1C9C8',
                        '#A5B5AB',
                        '#949A8E',
                        '#615566',
                      ]}
                    />
                    <h2 className="font-bold text-lg mx-2">{comment.alias}</h2>
                    {!comment.published && <Badge variant="secondary">Pending Review</Badge>}
                    {(vip.includes(comment.userId) && (adminId !== comment.userId)) && <Badge variant="outline" className="mx-2"><Star size={12} className="mr-1" /> Valued Member</Badge>}
                  </div>
                  <div className="location-description border border-gray-800 rounded-2xl p-3 md:mx-6 bg-[#02050D]">
                    <div className={style.markdown} dangerouslySetInnerHTML={{ __html: comment.content }}></div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardFooter >
      </Card>
    </div>
  )
}
