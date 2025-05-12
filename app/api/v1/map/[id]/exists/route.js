import db from "@/lib/db"

export async function GET(req) {
  try {
    const id = req.nextUrl.pathname.split('/')[4]
    const map = await db.map.findUnique({
      where: { id },
    })
    if (!map) return Response.json({ exists: false })
    if (!map.published) return Response.json({ exists: false, published: false })
    return Response.json({ exists: true, map: map.map, name: map.name })
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
}
