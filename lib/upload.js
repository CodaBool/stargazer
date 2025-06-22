import pg from 'pg'
const { Client } = pg
import * as d3 from 'd3-geo'
import { feature } from 'topojson-client'
import fs from 'fs'
import path from 'path'

// can use `DELETE FROM "Location";`
// to reset table to allow for inserting new data

const topojsonDir = path.join(process.cwd(), '../app/[map]/topojson')
// get this from the user table
const client = new Client({ connectionString: process.env.POOL_URL })
client.connect()

const res = await client.query(`SELECT id FROM "User" WHERE email = '${process.env.EMAIL}' LIMIT 1`)
const ADMIN_ID = res.rows[0]?.id

// Read all topojson files in the directory
const topojsonFiles = fs.readdirSync(topojsonDir).filter(file => file.endsWith('.json'))

// Iterate over each topojson file
for (const file of topojsonFiles) {
  const filePath = path.join(topojsonDir, file)
  const topo = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  const mapName = path.basename(file, '.json')

  const insertData = async (name) => {
    console.log("+", name)

    for (const [type, layer] of Object.entries(topo.objects)) {
      console.log("  + Type", type)

      // D3 expects geojson
      const geojson = feature(topo, layer)

      for (const feat of Object.values(geojson.features)) {
        const { properties, geometry } = feat
        let coord = "complex"
        // console.log("obj", geometry)

        if (geometry.type === "Point") {
          // Point location
          coord = geometry.coordinates.join(",")
        } else {
          // Compute centroid for Polygon
          const centroid = d3.geoPath().centroid(feat)
          coord = centroid.join(",")
        }
        const query = `
          INSERT INTO "Location" (
            name, description, city, type, coordinates, faction, source, "userId", published,
            capital, label, destroyed, resolved, "unofficial", alias, map, geometry
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17);
        `

        const values = [
          properties.name,
          properties.description || "",
          properties.city || "",
          properties.type,
          coord,
          properties.faction || "",
          properties.source || "",
          ADMIN_ID,
          true, // published
          properties.capital || false,
          properties.label || false,
          properties.destroyed || false,
          true, // resolved
          properties.unofficial || false,
          properties.alias || "",
          name, // map
          geometry.type,
        ]

        try {
          await client.query(query, values)
          console.log(`    + Inserted ${properties.name} for ${name} ${type}`)
        } catch (error) {
          console.error(`Error inserting ${properties.name}:`, error)
        }
      }
    }
  }

  await insertData(mapName)
}
await client.end()
