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
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import db from "@/lib/db"
import { ArrowLeft, Star, CircleX, MapPin, Hexagon, Spline } from "lucide-react"
import style from "../md.module.css"
import sanitizeHtml from "sanitize-html"
import { redirect } from "next/navigation"

export default async function Location({ params, searchParams }) {
  const session = await getServerSession(authOptions)
  const { id, map } = await params
  const { c: commentFormOpen } = await searchParams
  const authURL = `/login?back=/contribute/${map}/${id}&callback=/contribute/${map}/${id}?c=1`

  // unauthenticated and trying to create a comment
  if (commentFormOpen && !session) redirect(authURL)

  const user = session
    ? await db.user.findUnique({ where: { email: session.user.email } })
    : null
  const isAdmin = user?.email === process.env.EMAIL

  const location = await db.location.findUnique({
    where: { id: Number(id) },
    include: {
      comments: {
        where: {
          OR: [{ published: true }, { userId: user ? user.id : "" }],
        },
      },
    },
  })

  if (!location) redirect(`/contribute/${map}`)

  // Pull commenters (for name display + vip/admin badges)
  const commenterIds = location.comments.map((c) => c.userId)
  const commenters = await db.user.findMany({
    where: { id: { in: commenterIds } },
    select: { id: true, name: true, email: true, vip: true },
  })

  let viewable = location.published
  if (!viewable && location.userId === user?.id) viewable = true

  const vip = commenters.filter((u) => u.vip).map((u) => u.id)
  const adminArray = commenters
    .filter((u) => u.email === process.env.EMAIL)
    .map((u) => u.id)
  const adminId = adminArray.length === 1 ? adminArray[0] : null

  // sanitize location HTML
  location.description = sanitizeContent(location.description)

  // sanitize comment HTML and set display names
  location.comments.forEach((comment) => {
    const commenter = commenters.find((u) => u.id === comment.userId)
    comment.name = commenter?.name
      ? commenter.name
      : commenter?.email
        ? commenter.email.split("@")[0]
        : "Unknown"
    comment.content = sanitizeContent(comment.content)
  })

  // coordinate parsing for iframe
  let panX = "0"
  let panY = "0"
  let coordPretty = "complex, see map"

  if (location.coordinates && String(location.coordinates).includes(",")) {
    panX = Number(String(location.coordinates).split(",")[0].trim())
    panY = Number(String(location.coordinates).split(",")[1].trim())
    if (location.geometry === "Point") {
      coordPretty = Number(panY).toFixed(2) + " " + Number(panX).toFixed(2)
    }
  }

  // units
  const typeLower = String(location.type || "").toLowerCase()
  const diameterUnit = typeLower === "star" ? "solar radii" : "km"

  // tags
  const tagsCsv = location.tags ?? ""
  const tagsList = parseCsv(tagsCsv)

  // classic “badges” mapped from tags now
  const taggedUnofficial = hasTag(tagsCsv, "unofficial")
  const taggedDestroyed = hasTag(tagsCsv, "destroyed")
  const taggedCapital = hasTag(tagsCsv, "capital")

  return (
    <div className="mx-auto my-4 flex justify-center flex-col md:container select-text starfield">
      <Link href={`/contribute/${map}`} className="w-[50px] block">
        <div
          className="w-[50px] h-[50px] rounded-2xl border border-[#1E293B] mb-2 ml-6 md:ml-0"
          style={{ background: "#070a0d" }}
        >
          <ArrowLeft size={42} className="relative left-[3px] top-[3px]" />
        </div>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            <span>{location.name}</span>

            {!location.published && (
              <Badge variant="secondary">Pending Review</Badge>
            )}

            {taggedUnofficial && (
              <Badge variant="destructive">Unofficial</Badge>
            )}
            {taggedDestroyed && (
              <Badge variant="secondary">Destroyed</Badge>
            )}
            {taggedCapital && (
              <Badge variant="secondary">Capital</Badge>
            )}
          </CardTitle>

          <div>
            <GeometryIcon geometry={location.geometry} />
            <span className="text-gray-400 ms-2">
              {location.type}
            </span>
          </div>

          {/* Keep these “always useful” lines */}
          <span>
            Updated:{" "}
            <span className="text-gray-400">
              {new Date(location.updatedAt)
                .toISOString()
                .split("T")[0]
                .replace(/-/g, "/")}
            </span>
          </span>

          <span>
            Coordinates: <span className="text-gray-400">{coordPretty}</span>
          </span>

          {/* Show everything else only if truthy */}
          {metaLine("Faction", location.faction)}
          {metaLine("Alias", location.alias)}
          {metaLine("Locations", location.locations)}
          {metaLine("Region", location.region)}
          {metaLine("People", location.people)}
          {metaLine("Composition", location.composition)}
          {metaLine("Source", location.source)}

          {/* numeric-ish strings with units */}
          {unitLine("Temperature", location.temperature, "°C")}
          {unitLine("Diameter", location.diameter, diameterUnit)}
          {unitLine("Gravity", location.gravity, "cm/s²")}
          {unitLine("Pressure", location.pressure, "millibars")}
          {unitLine("Hours in Day", location.hoursInDay, "hours")}
          {unitLine("Days in Year", location.daysInYear, "days")}
          {unitLine("Hydro", location.hydroPercent, "(0–1)")}
          {unitLine("Ice", location.icePercent, "(0–1)")}

          {/* tags as badges */}
          {tagsList.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {tagsList.map((t) => {
                // don’t duplicate the “headline” badges above
                if (t === "unofficial" || t === "destroyed" || t === "capital") return null
                return (
                  <Badge key={t} variant="outline" className="text-xs">
                    {t}
                  </Badge>
                )
              })}
            </div>
          )}
        </CardHeader>

        {/* image block (truthy only) */}
        {(isTruthy(location.image) || isTruthy(location.caption)) && (
          <CardContent className="md:mx-6 mt-0 pt-0">
            {isTruthy(location.image) && (
              <div className="border border-gray-800 rounded-2xl bg-[#02050D] overflow-hidden">
                <img
                  src={location.image}
                  alt={location.caption || location.name}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto block"
                />
              </div>
            )}
            {isTruthy(location.caption) && (
              <p className="text-sm text-gray-400 mt-2 px-1">
                {location.caption}
              </p>
            )}
          </CardContent>
        )}

        {/* description (sanitized) */}
        <CardContent className="location-description border border-gray-800 rounded-2xl pt-4 md:mx-6 bg-[#02050D]">
          <div
            className={style.markdown}
            dangerouslySetInnerHTML={{ __html: location.description }}
          />
        </CardContent>

        <Accordion type="single" collapsible className="md:mx-8 mx-4">
          <AccordionItem value="item-1">
            <AccordionTrigger className="cursor-pointer">
              See on map
            </AccordionTrigger>
            <AccordionContent className="map-container flex justify-around">
              {isNaN(Number(panX)) || isNaN(Number(panY)) ? (
                <div>
                  <CircleX className="mx-auto" /> Invalid Coordinates
                </div>
              ) : (
                <iframe
                  src={`/${map}?locked=1&lng=${panX}&lat=${panY}&z=${
                    map.includes("lancer") ? 4 : 8
                  }&name=${encodeURIComponent(location.name)}&type=${
                    location.geometry
                  }&search=0&hamburger=0&zoom=0`}
                  width="600"
                  height="400"
                  style={{ border: "none" }}
                />
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <CardFooter className="flex-col items-start mt-4 md:p-6 p-1">
          {commentFormOpen ? (
            <CommentForm map={map} locationId={id} />
          ) : (
            <Link
              href={session ? `/contribute/${map}/${id}/?c=1` : authURL}
              className="md:w-[150px] w-full"
            >
              <Button
                variant="outline"
                className="md:w-[150px] w-full cursor-pointer"
              >
                Create Comment
              </Button>
            </Link>
          )}

          <div className="w-full my-4">
            {location.comments.map((comment) => {
              return (
                <div
                  className="border border-gray-800 p-2 rounded mb-1"
                  key={comment.id}
                >
                  <div className="flex items-center mb-1">
                    {adminId === comment.userId && (
                      <svg
                        fill="gold"
                        style={{
                          position: "relative",
                          left: "23px",
                          top: "-15px",
                        }}
                        width="20px"
                        height="14px"
                        viewBox="0 0 256 256"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M220,98.865c0-12.728-10.355-23.083-23.083-23.083s-23.083,10.355-23.083,23.083c0,5.79,2.148,11.084,5.681,15.14
	l-23.862,21.89L125.22,73.002l17.787-20.892l-32.882-38.623L77.244,52.111l16.995,19.962l-30.216,63.464l-23.527-21.544
	c3.528-4.055,5.671-9.344,5.671-15.128c0-12.728-10.355-23.083-23.083-23.083C10.355,75.782,0,86.137,0,98.865
	c0,11.794,8.895,21.545,20.328,22.913l7.073,84.735H192.6l7.073-84.735C211.105,120.41,220,110.659,220,98.865z" />
                      </svg>
                    )}

                    <Avatar
                      size={25}
                      name={comment.name}
                      variant="beam"
                      colors={[
                        "#DBD9B7",
                        "#C1C9C8",
                        "#A5B5AB",
                        "#949A8E",
                        "#615566",
                      ]}
                    />

                    <h2 className="font-bold text-lg mx-2">
                      {comment.name}
                    </h2>

                    {!comment.published && (
                      <Badge variant="secondary">Pending Review</Badge>
                    )}

                    {vip.includes(comment.userId) && adminId !== comment.userId && (
                      <Badge variant="outline" className="mx-2">
                        <Star size={12} className="mr-1" /> Valued Member
                      </Badge>
                    )}
                  </div>

                  <div className="location-description border border-gray-800 rounded-2xl p-3 md:mx-6 bg-[#02050D]">
                    <div
                      className={style.markdown}
                      dangerouslySetInnerHTML={{ __html: comment.content }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}


function sanitizeContent(html) {
  if (!html) return ""

  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.filter(
      (tag) => !["img", "svg", "math", "script", "table", "iframe"].includes(tag),
    ),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      a: ["href", "name", "target", "rel"],
    },
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href || ""

        if (
          href &&
          !href.startsWith("/") &&
          !href.startsWith("https://stargazer.vercel.app/")
        ) {
          const qs = new URLSearchParams({ url: href }).toString()
          return {
            tagName,
            attribs: {
              ...attribs,
              href: `/link?${qs}`,
            },
          }
        }

        return { tagName, attribs }
      },
    },
  })
}

/* ------------------------- csv/tag helpers ------------------------- */

function parseCsv(v) {
  if (!v) return []
  return String(v)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

function hasTag(csv, key) {
  return parseCsv(csv).includes(key)
}

function isTruthy(v) {
  if (v === null || v === undefined) return false
  if (typeof v === "string") return v.trim() !== ""
  return Boolean(v)
}

function unitLine(label, value, unit) {
  if (!isTruthy(value)) return null
  return (
    <span className="inline">
      {label}:{" "}
      <span className="text-gray-400 inline">
        {String(value)}{unit ? ` ${unit}` : ""}
      </span>
    </span>
  )
}

function metaLine(label, value) {
  if (!isTruthy(value)) return null
  return (
    <span className="inline">
      {label}: <span className="text-gray-400 inline">{String(value)}</span>
    </span>
  )
}

function GeometryIcon({ geometry }) {
  const g = String(geometry || "")
  return (
    <span className="cursor-help" title={`${g} Location`}>
      {g === "Point" && <MapPin size={16} className="inline mb-1" />}
      {g.includes("Poly") && <Hexagon size={16} className="inline mb-1" />}
      {g.includes("LineString") && <Spline size={16} className="inline mb-1" />}
    </span>
  )
}
