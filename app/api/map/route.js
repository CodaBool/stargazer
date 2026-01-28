import db from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from '../auth/[...nextauth]/route'
import { S3Client, PutObjectCommand, DeleteObjectsCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import { combineLayers, USER_LOCATION_ID_START } from "@/lib/utils"
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CF_ACCESS_ID,
    secretAccessKey: process.env.CF_ACCESS_SECRET,
  },
})

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) throw "unauthorized"
    const searchParams = req.nextUrl.searchParams
    const id = searchParams.get('id')
    const user = await db.user.findUnique({ where: { email: session.user.email } })
    if (!user) throw "there is an issue with your account or session"
    const map = await db.map.findUnique({
      where: { id },
    })
    if (map.userId !== user.id) throw "unauthorized"

    // TODO: should allow for anyone to GET if published

    const command = new GetObjectCommand({
      Bucket: "maps",
      Key: id,
      ResponseContentType: "application/json",
    })
    const response = await s3.send(command)

    // Read stream to buffer
    const data = await response.Body?.transformToString();

    if (!data) throw 'file not found'
    const parsed = JSON.parse(data)

    return Response.json({ name: map.name, ...parsed })
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
export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions)
    const body = await req.json()
    let user

    // auth
    if (body.secret) {
      user = await db.user.findUnique({ where: { secret: body.secret } })
      if (!user) throw "unauthorized"
    } else if (session) {
      user = await db.user.findUnique({ where: { email: session.user.email } })
    } else {
      throw "unauthorized"
    }

    if (!user) throw "there is an issue with your account or session"
    if (body.replace) {
      // find id by name since the user has accepted the risk
      const mapToReplace = await db.map.findMany({
        where: {
          userId: String(user.id),
          name: String(body.name),
          map: String(body.map)
        },
      })
      if (mapToReplace.length > 1) throw "too many maps to replace"
      body.id = mapToReplace[0].id
    }
    const map = await db.map.findUnique({
      where: {
        id: String(body.id),
        userId: String(user.id),
      },
    })
    if (!map) throw "map not found"
    if (map.userId !== user.id) throw "unauthorized"

    // let geojsonChange = false

    const response = await s3.send(new GetObjectCommand({
      Bucket: "maps",
      Key: map.id,
      ResponseContentType: "application/json",
    }))
    const r2ObjRaw = await response.Body?.transformToString();
    if (!r2ObjRaw) throw 'file not found'
    const r2Obj = JSON.parse(r2ObjRaw)

    let prevMaxId = getStartingMaxId(r2Obj.geojson, r2Obj.maxId)
    const updates = { ...map }
    if (body.geojson) {
      if (!validGeojson(body.geojson)) throw "invalid geojson"
      const maxId = ensureUserFeatureIds(body.geojson, prevMaxId)
      const { locations, territories, guides } = getFeatureData(body.geojson)
      updates.locations = locations
      updates.territories = territories
      updates.guides = guides
      // const newHash = crypto.createHash('sha256').update(JSON.stringify(body.geojson)).digest('hex')
      // geojsonChange = map.hash !== newHash

      // // WARN: it might be possible that stale geojson is bundled with legit PUT data
      // if (!geojsonChange) throw "this map is already in sync"
      // updates.hash = newHash

      r2Obj.geojson = combineLayers([r2Obj.geojson, body.geojson])
      r2Obj.maxId = maxId
    }
    if (body.config) {
      r2Obj.config = {
        ...r2Obj.config,
        ...body.config,
      }
    }

    if (body.name) {
      updates.name = body.name
    }
    if (typeof body.published !== 'undefined') {
      updates.published = body.published
    }

    // update postgres
    const newMap = {
      ...map,
      name: updates.name,
      published: updates.published,
      guides: updates.guides,
      locations: updates.locations,
      territories: updates.territories,
    }
    await db.map.update({
      where: { id: body.id },
      data: newMap,
    })


    const putCommand = new PutObjectCommand({
      Body: JSON.stringify(r2Obj),
      Bucket: "maps",
      Key: map.id,
      // CacheControl: "STRING_VALUE",
      ContentType: "application/json",
      // Expires: new Date("TIMESTAMP"),
      Metadata: {
        "user": `${user.id}`,
        "version": `0`,
        "map": `${map.map}`,
        "name": `${user.name}`,
        "email": `${user.email}`,
        "published": `${map.published}`,
      },
    })
    const finalResponse = await s3.send(putCommand)

    return Response.json({ msg: "success", map: newMap })
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
export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) throw "unauthorized"
    const id = await req.text()
    const user = await db.user.findUnique({ where: { email: session.user.email } })
    if (!user) throw "there is an issue with your account or session"
    const map = await db.map.findUnique({
      where: { id },
    })
    if (map.userId !== user.id) throw "unauthorized"
    const deleteCommand = new DeleteObjectsCommand({
      Bucket: "maps",
      Delete: {
        Objects: [{ Key: id }]
      }
    })
    const response = await s3.send(deleteCommand)
    const deleted = await db.map.delete({
      where: { id },
    })

    return Response.json({ msg: "success", map: deleted })
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
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) throw "unauthorized"
    const body = await req.json()
    const user = await db.user.findUnique({ where: { email: session.user.email } })
    if (!user) throw "there is an issue with your account or session"

    if (!validGeojson(body.geojson)) throw "invalid geojson"

    const maps = await db.map.findMany({
      where: { userId: user.id },
    })

    if (!user.premium && maps.length > 0) {
      throw "only 1 upload allowed for free users"
    }

    let maxIdStart = getStartingMaxId(body.geojson, null)
    const maxId = ensureUserFeatureIds(body.geojson, maxIdStart)
    const { locations, territories, guides } = getFeatureData(body.geojson)

    // const hash = crypto.createHash('sha256').update(JSON.stringify(body.geojson)).digest('hex')
    // console.log("uploading map with hash", hash)

    const map = await db.map.create({
      data: {
        name: body.name,
        userId: user.id,
        locations,
        territories,
        guides,
        // hash,
        map: body.map
      }
    })

    if (!map?.id) throw "failed to upload map"

    const command = new PutObjectCommand({
      Body: JSON.stringify({
        geojson: body.geojson,
        config: body.config || {},
        maxId,
      }),
      Bucket: "maps",
      Key: map.id,
      // CacheControl: "STRING_VALUE",
      ContentType: "application/json",
      // Expires: new Date("TIMESTAMP"),
      Metadata: {
        "user": `${user.id}`,
        "map": `${body.map}`,
        "version": `0`,
        "name": `${user.name}`,
        "email": `${user.email}`,
        "published": `${map.published}`,
      },
    })

    const response = await s3.send(command)
    return Response.json({ msg: "success", map })
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


function getFeatureData(geojson) {
  let locations = 0
  let territories = 0
  let guides = 0
  geojson.features.forEach(f => {
    if (f.geometry.type === "Point") {
      locations++
    } else if (f.geometry.type.includes("Poly")) {
      territories++
    } else if (f.geometry.type.includes("LineString")) {
      guides++
    }
  })
  return { locations, territories, guides }
}

function validGeojson(geojson) {
  if (!geojson.type || geojson.type !== 'FeatureCollection') return false;
  if (!Array.isArray(geojson.features)) return false;
  for (const feature of geojson.features) {
    if (!feature.type || feature.type !== 'Feature') return false;
    if (!feature.geometry || typeof feature.geometry !== 'object') return false;
    if (!feature.geometry.type || !['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon', 'GeometryCollection'].includes(feature.geometry.type)) return false;
    if (!feature.geometry.coordinates || !Array.isArray(feature.geometry.coordinates)) return false;
  }
  return true;
}

// cut int4 in half an use that as the starting point for user ids
const INT4_MAX = 2147483647
function getStartingMaxId(geojson, storedMaxId) {
  if (Number.isInteger(storedMaxId) && storedMaxId >= USER_LOCATION_ID_START && storedMaxId <= INT4_MAX) {
    return storedMaxId;
  }

  // Legacy / first-time case: compute from existing feature ids once
  let maxId = USER_LOCATION_ID_START;

  if (geojson && geojson.type === "FeatureCollection" && Array.isArray(geojson.features)) {
    for (const f of geojson.features) {
      if (!f) continue;
      const id = f.id;
      if (Number.isInteger(id) && id >= USER_LOCATION_ID_START && id <= INT4_MAX && id > maxId) {
        maxId = id;
      }
    }
  }

  return maxId;
}
function ensureUserFeatureIds(geojson, prevMaxId) {
  if (!geojson || geojson.type !== "FeatureCollection" || !Array.isArray(geojson.features)) {
    return prevMaxId;
  }

  let maxId = prevMaxId;

  for (const f of geojson.features) {
    if (!f) continue;

    // If id is missing or outside the user range, treat as "needs a fresh id"
    if (!Number.isInteger(f.id) || f.id < USER_LOCATION_ID_START || f.id > INT4_MAX) {
      // handle overflow: wrap back into range if we ever hit the ceiling
      if (!Number.isInteger(maxId) || maxId < USER_LOCATION_ID_START || maxId >= INT4_MAX) {
        maxId = USER_LOCATION_ID_START
      }

      maxId += 1;
      f.id = maxId;
    }

    const props = f.properties || (f.properties = {});
    props.userCreated = true;
  }
  // console.log("verified geojson", geojson.features.map(f => ({name: f.properties.name, id: f.id})), "max", maxId)

  return maxId;
}
