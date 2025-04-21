# links
- https://www.naturalearthdata.com/downloads/50m-cultural-vectors
- https://geojson.io (saves topojson at 3x the size as mapshaper!)
- https://mapshaper.org
- https://jsonformatter.org/json-pretty-print
- https://nerdcave.com/tailwind-cheat-sheet
- icon https://lucide.dev/icons
- merge 2 geojson when data rows are different https://findthatpostcode.uk/tools/merge-geojson
- svg to code https://nikitahl.github.io/svg-2-code
- svg minimize https://svgomg.net
- mapbox pricing https://console.mapbox.com
- turf https://turfjs.org/docs/api/centroid
- maplibre gl https://maplibre.org/maplibre-gl-js/docs/API
- react map gl https://visgl.github.io/react-map-gl/docs/api-reference/maplibre/map
- maplibre style editor https://maplibre.org/maputnik
- draw api https://github.com/mapbox/mapbox-gl-draw/blob/main/docs/API.md
- nextjs cache options https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config

# icons
- https://game-icons.net

# inspo
- https://www.google.com/maps/d/u/0/viewer?hl=en_US&mid=1puuQVpbfh4ofYflJxJPB6iul6JQ&ll=40.00675267193506%2C-74.04422471111134&z=7
- https://github.com/MeepChangeling/FalloutTTRPGWorldMap
- vaults = https://fallout.fandom.com/wiki/Map:FO_Vault_Map_(base_1959_map)
- extra = https://fallout.fandom.com/wiki/Map:FO_United_States_Map_(base_1959_map)

# commands
- npx mapshaper -i ./merge_me/guide.json ./merge_me/point.json ./merge_me/territory.json combine-files -merge-layers -o ./merge_me/merged.json
- npx mapshaper -i source.geojson -clean -o ./merged.json target=source,source,source

result.features = this.files.filter((f) => f.geojson.features).map((f) => f.geojson.features).flat(1)

npx mapshaper *.json \
  -each 'this.properties = Object.assign({name:"", type:"", description:"", faction:"", FID:"", icon:"", source:""}, this.properties || {})' \
  -merge-layers \
  -o merged.geojson


# rules
- all styling depends on map/{type & faction}

# Fallout location types
- base
- settlement
- town
- city
- vault
- building
- cave
- compound

# Region change
- all factions, regions, clusters will now be type "region". Neutral states, countries, and Lancer guide. Will now be "null" type. Regions will now use a faction prop which will determine further detail
- "region" is the default polygon type. Common other types are: fallout ["faction"], lancer: ["cluster", "faction"]

# todo:
- style fixes, too dark
- contribute pages (save for later)
- measure broken on mobile
- look into why @mapbox/mapbox-gl-draw can't be used again
- replace back some of the stargazer -> https://starlazer.vercel.app/ changes
  - https://github.com/CodaBool/starlaser/blob/976af63a5b5b86634afad0d7f2767656d007b46f/app/api/auth/[...nextauth]/route.js#L15
  - https://github.com/CodaBool/starlaser/blob/976af63a5b5b86634afad0d7f2767656d007b46f/app/api/contribute/route.js#L63
  - https://github.com/CodaBool/starlaser/blob/976af63a5b5b86634afad0d7f2767656d007b46f/app/contribute/[map]/[id]/page.jsx#L78


# menu items needed
- measure btn
- coordinate
- layer toggle

# Events
## moving mouse on mobile
touchMove
pointerMove (both platforms)

## click start on mobile
touchStart
pointerEnter
pointerDown (both platforms)

## click end on mobile
touchEnd
pointerOut
pointerUp (both platforms)

--------------------------------

## click start on desktop
mouseDown

## click end on desktop
click

## moving mouse on desktop
mouseMove


# Map VTT Data
- starfinder 5.5%
	- seems there is no real need for one but Star Wars map could work for this one
- RED 5.1%
	- interactive copyrighted https://www.nightcity.io/red
	- Ced23Ric image (2022) https://www.reddit.com/r/cyberpunkred/comments/z1744r/night_city_2045_map_cleaned_and_updated/
		- [best] best https://www.ced23ric.de/cpr-pbp/CyberpunkRed_NightCity2045_full_map_rework_dpl.jpg
	- crossvalidated image (2022) https://www.reddit.com/r/cyberpunkred/comments/114bn3e/night_city_2045_map_revamp/
		- best https://www.reddit.com/media?url=https%3A%2F%2Fi.redd.it%2Fbrr12zotooia1.jpg
	- [blurry] fandom image (2024) https://cyberpunk-red-2047.fandom.com/wiki/Night_City_Map
- Star Wars 3.7%
	- Henry M Bernberg interactive (2019) http://www.swgalaxymap.com
		- [both] embed https://hbernberg.carto.com/viz/76e286d4-fbab-11e3-b014-0e73339ffa50/embed_map
	- Otherlife_Art interactive (2024) https://www.reddit.com/r/Star_Wars_Maps/comments/12yolnk/ultimate_star_wars_galaxy_map_online_update_and/
		- dev is responsive in this thread
		- [both] embed https://otherlife.davidcanavese.com/galaxymap2/
- Alien 3.3%
	- [both] Clay DeGruchy interactive https://map.weylandyutani.company
	- [both] image (2024) https://uploads.worldanvil.com/uploads/maps/4145d8eb23b023c349544e8dda5282c7.jpg
- Warhammer 2.3%
	- [both] s3xyrandal image (2023) https://tcrepo.com/downloads/warhammer-40k-galaxy-map/
	- [both] Michelle Louise Janion (2023) https://jambonium.co.uk/40kmap/
	- kyrtuck image (2024) https://www.deviantart.com/kyrtuck/art/Warhammer-40-000-Map-2-1082557287
- Fallout 2.2%
	- stargazer
- Lancer 2.1%
	- stargazer

# Saving Data Spitballing
- save geojson locally after any and all actions
- button to copy share ID, which will upload topojson to R2. Provide an ID and give a notice that after 90 days it will be deleted unless claimed by an account
- export geojson to local file (can toggle source + user)
- store multiple maps, have a selection screen if a local storage is found


# star wars types

## territory
- sector
-
## guide
## location
