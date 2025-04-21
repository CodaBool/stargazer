import db from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from '../auth/[...nextauth]/route'

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) throw "unauthorized"
    const body = await req.json()
    const user = await db.user.findUnique({ where: { email: session.user.email } })
    if (!user) throw "there is an issue with your account or session"

    // check if this user has at least 2 approved comments
    const publishedComments = await db.comment.findMany({ where: { userId: user.id, published: true } })
    let published = publishedComments.length > 1
    if (user.vip) {
      published = true
    }

    let response, locationId
    if (body.table === "location") {
      response = await db.location.create({
        data: {
          name: body.name,
          description: body.description,
          type: body.type.split(".")[0],
          coordinates: body.coordinates,
          unofficial: body.unofficial,
          faction: body.faction,
          source: body.source,
          capital: body.capital,
          city: body.city,
          destroyed: body.destroyed,
          map: body.map,
          userId: user.id,
          geometry: body.type.split(".")[1],
          published,
        }
      })
      locationId = response.id
    } else if (body.table === "comment") {
      response = await db.comment.create({
        data: {
          userId: user.id,
          content: body.content,
          locationId: Number(body.locationId),
          published,
        }
      })
      locationId = body.locationId
    }
    if (!response) throw "could not create new row"

    if (!published) {
      // send email for review
      const urlParams = new URLSearchParams({
        subject: `New ${body.map} ${body.table} for review`,
        to: process.env.EMAIL,
        name: user.alias ? user.alias : user.email,
        from: user.email,
        secret: process.env.EMAIL_SECRET,
      }).toString()

      let html = `
        <h1><a href="https://starlazer.vercel.app/contribute/${body.map}/${locationId}">${body.map.toUpperCase()}</a></h1>
        <a href="https://starlazer.vercel.app/api/contribute?type=${body.table}&id=${response.id}&secret=${process.env.EMAIL_SECRET}">approve</a>
        <h1>User</h1>
        <p><strong>userId:</strong> ${user.id}</p>
        <p><strong>email:</strong> ${session.user.email}</p>
        <p><strong>alias:</strong> ${user.alias}</p>
        <p><strong>number of published comments:</strong> ${publishedComments.length}</p>
      `
      if (body.table === "comment") {
        html += `<h1 style="margin-top: 1em">Comment</h1>
          <div style="margin: 1em; border: 1px solid; padding: 1em">${body.content}</div>
        `
      } else {
        html += `<h1>${body.type.split(".")[1].toUpperCase()}</h1>
          <p><strong>name:</strong> ${body.name}</p>
          <p><strong>type:</strong> ${body.type.split(".")[0]}</p>
          <p><strong>coordinates:</strong> ${body.coordinates}</p>
          <p><strong>unofficial:</strong> ${body.unofficial ? "true" : "false"}</p>
          <p><strong>destroyed:</strong> ${body.destroyed ? "true" : "false"}</p>
          <p><strong>capital:</strong> ${body.capital ? "true" : "false"}</p>
          <p><strong>faction:</strong> ${body.faction}</p>
          <p><strong>city:</strong> ${body.city}</p>
          <p><strong>alias:</strong> ${body.alias}</p>
          <p><strong>source:</strong> ${body.source}</p>
          <p><strong>locationId:</strong> ${response.id}</p>
          <div style="margin: 1em; border: 1px solid; padding: 1em">${body.description}</div>
        `
      }

      const email = await fetch(`https://email.codabool.workers.dev/?${urlParams}`, {
        body: html,
        method: "POST",
      })

      // TODO: the email worker did not give a helpful error. I had to see its logs
      if (!email.ok) throw await email.text()
    }

    return Response.json({
      msg: published ? `Your ${body.table} has been published` : `Your ${body.table} has been submitted for review`
    })
  } catch (error) {
    console.error(error)
    if (typeof error === 'string') {
      return Response.json({ error }, { status: 400 })
    } else if (typeof error?.message === "string") {
      return Response.json({ error: error.message }, { status: 500 })
    } else {
      return Response.json(error, { status: 500 })
    }
  }
  // const { searchParams } = new URL(request.url)
  // const id = searchParams.get('id')
  // const formData = await request.formData()
  // const name = formData.get('name')
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
