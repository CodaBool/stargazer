import db from "@/lib/db"

export async function POST(req) {
  try {
    const body = await req.json()
    if (!body.secret) throw "unauthorized"
    const user = await db.user.findUnique({ where: { secret: body.secret } })
    if (!user) throw "unauthorized"

    const maps = await db.map.findMany({
      where: {
        userId: user.id,
      },
    }) || []

    const localMaps = body.maps
    const updatedLocalMaps = { ...localMaps }

    console.log("maps", maps)
    console.log("localMaps", updatedLocalMaps)
    let length = 0
    let added = 0
    const hashChanged = []
    for (const map of maps) {
      if (!map.published) {
        console.log("skipping unpublished map", map.id)
        continue
      }
      length++
      if (!localMaps[map.id]) {
        updatedLocalMaps[map.id] = {
          name: map.name,
          map: map.map,
          uuid: map.id,
          hash: map.hash,
        }
        added++
        console.log("adding missing map", map.id)
      } else {
        console.log("hash check", localMaps[map.id].hash, "vs", map.hash)
        if (localMaps[map.id].hash !== map.hash) {
          hashChanged.push(map.name)
          updatedLocalMaps[map.id].name = map.name;
          updatedLocalMaps[map.id].hash = map.hash;
        }
      }
    }

    return Response.json({ msg: "success", maps: updatedLocalMaps, length, hashChanged, added });
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
