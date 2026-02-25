import db from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from '../auth/[...nextauth]/route'

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) throw "unauthorized"

    const body = await req.json()

    const user = await db.user.findUnique({
      where: { email: session.user.email },
  })
    if (!user) throw "there is an issue with your account or session"

    // check if this user has at least 2 approved comments
    const publishedComments = await db.comment.findMany({
      where: { userId: user.id, published: true },
    })

    let published = publishedComments.length > 1
    if (user.vip) published = false

    let response, locationId

    if (body.table === "location") {
      response = await db.location.create({
        data: {
          name: body.name,
          description: body.description,
          type: body.type,
          geometry: body.geometry,
          coordinates: body.coordinates,
          source: body.source,
          map: body.map,
          userId: user.id,
          published,

          // optional
          faction: toStrOrNull(body.faction),
          alias: toStrOrNull(body.alias),
          locations: toStrOrNull(body.locations),
          region: toStrOrNull(body.region),
          people: toStrOrNull(body.people),
          tags: toStrOrNull(body.tags),
          composition: toStrOrNull(body.composition),
          image: toStrOrNull(body.image),
          caption: toStrOrNull(body.caption),
          baseColors: toStrOrNull(body.baseColors),
          featureColors: toStrOrNull(body.featureColors),
          layerColors: toStrOrNull(body.layerColors),
          atmosphereColors: toStrOrNull(body.atmosphereColors),
          temperature: toStrOrNull(body.temperature),
          diameter: toStrOrNull(body.diameter),
          gravity: toStrOrNull(body.gravity),
          pressure: toStrOrNull(body.pressure),
          hoursInDay: toStrOrNull(body.hoursInDay),
          daysInYear: toStrOrNull(body.daysInYear),
          hydroPercent: toStrOrNull(body.hydroPercent),
          icePercent: toStrOrNull(body.icePercent),
        },
      })

      locationId = response.id
    } else if (body.table === "comment") {
      response = await db.comment.create({
        data: {
          userId: user.id,
          content: body.content,
          locationId: Number(body.locationId),
          published,
        },
      })
      locationId = body.locationId
    }

    if (!response) throw "could not create new row"

    if (!published) {
      const urlParams = new URLSearchParams({
        subject: `New ${body.map} ${body.table} for review`,
        to: process.env.EMAIL,
        name: user.name ? user.name : user.email,
        from: user.email,
        secret: process.env.EMAIL_SECRET,
      }).toString()

      let html = `
        <h1><a href="https://stargazer.vercel.app/contribute/${body.map}/${locationId}">${String(
        body.map || "",
      ).toUpperCase()}</a></h1>
        <a href="https://stargazer.vercel.app/api/contribute?type=${body.table}&id=${response.id}&secret=${process.env.EMAIL_SECRET}">approve</a>
        <h2 style="margin-top: 1em">User</h2>
        <p><strong>userId:</strong> ${user.id}</p>
        <p><strong>email:</strong> ${session.user.email}</p>
        <p><strong>name:</strong> ${user.name ?? ""}</p>
        <p><strong>number of published comments:</strong> ${publishedComments.length}</p>
      `

      if (body.table === "comment") {
        html += `
          <h2 style="margin-top: 1em">Comment</h2>
          <div style="margin: 1em; border: 1px solid; padding: 1em">${body.content ?? ""}</div>
        `
      } else {
        const [type, geometry] = String(body.type ?? "").split(".")

        // show normalized numeric values (so reviewers see what DB will store)
        const s = k => toStrOrNull(body[k]) ?? ""

        html += `
          <h2 style="margin-top: 1em">Location</h2>
          <p><strong>name:</strong> ${body.name ?? ""}</p>
          <p><strong>type:</strong> ${type ?? ""}</p>
          <p><strong>geometry:</strong> ${geometry ?? ""}</p>
          <p><strong>coordinates:</strong> ${body.coordinates ?? ""}</p>

          <p><strong>faction:</strong> ${s("faction")}</p>
          <p><strong>alias:</strong> ${s("alias")}</p>
          <p><strong>locations:</strong> ${s("locations")}</p>
          <p><strong>region:</strong> ${s("region")}</p>
          <p><strong>people:</strong> ${s("people")}</p>
          <p><strong>tags:</strong> ${s("tags")}</p>
          <p><strong>composition:</strong> ${s("composition")}</p>

          <p><strong>image:</strong> ${s("image")}</p>
          <p><strong>caption:</strong> ${s("caption")}</p>

          <p><strong>baseColors:</strong> ${s("baseColors")}</p>
          <p><strong>featureColors:</strong> ${s("featureColors")}</p>
          <p><strong>layerColors:</strong> ${s("layerColors")}</p>
          <p><strong>atmosphereColors:</strong> ${s("atmosphereColors")}</p>

          <h3 style="margin-top: 1em">Numbers</h3>
          <p><strong>temperature (°C):</strong> ${s("temperature") ?? ""}</p>
          <p><strong>diameter (${geometry === "Point" && type === "star" ? "solar radii" : "km"}):</strong> ${s("diameter") ?? ""}</p>
          <p><strong>gravity (cm/s²):</strong> ${s("gravity") ?? ""}</p>
          <p><strong>pressure (millibars):</strong> ${s("pressure") ?? ""}</p>
          <p><strong>hoursInDay:</strong> ${s("hoursInDay") ?? ""}</p>
          <p><strong>daysInYear:</strong> ${s("daysInYear") ?? ""}</p>
          <p><strong>hydroPercent:</strong> ${s("hydroPercent") ?? ""}</p>
          <p><strong>icePercent:</strong> ${s("icePercent") ?? ""}</p>

          <p><strong>source:</strong> ${body.source ?? ""}</p>
          <p><strong>locationId:</strong> ${response.id}</p>

          <h3 style="margin-top: 1em">Description</h3>
          <div style="margin: 1em; border: 1px solid; padding: 1em">${body.description ?? ""}</div>
        `
      }

      console.log("sending email with ")

      const email = await fetch(`https://email.codabool.workers.dev/?${urlParams}`, {
        body: html,
        method: "POST",
      })

      if (!email.ok) throw await email.text()
    }

    return Response.json({
      msg: published
        ? `Your ${body.table} has been published`
        : `Your ${body.table} has been submitted for review`,
    })
  } catch (error) {
    console.error(error)
    if (typeof error === "string") {
      return Response.json({ error }, { status: 400 })
    } else if (typeof error?.message === "string") {
      return Response.json({ error: error.message }, { status: 500 })
    } else {
      return Response.json(error, { status: 500 })
    }
  }
}

// be aware that nextjs 13 does aggressive caching on GETs
export async function GET(req, res) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const id = Number(searchParams.get('id'))
  // const action = searchParams.get('action')
  const secret = searchParams.get('secret')
  if (secret !== process.env.EMAIL_SECRET) throw "unauthorized"
  try {
    await db[type].update({
      where: { id },
      data: { published: true },
    })
    return new Response(`successfully published ${type}`)
  } catch (error) {
    console.error("could not publish", id, type, secret, error);
    return Response.json({ error }, { status: 500 });
  }
}


const toStrOrNull = v => {
  if (v === null || v === undefined) return null
  const s = String(v).trim()
  return s === "" ? null : s
}
