# TODO
- measure broken on mobile
- look into why @mapbox/mapbox-gl-draw can't be used again

# links
- https://www.naturalearthdata.com/downloads/50m-cultural-vectors
- https://geojson.io (saves topojson at 3x the size as mapshaper!)
- https://mapshaper.org
- https://jsonformatter.org/json-pretty-print
- https://nerdcave.com/tailwind-cheat-sheet
- lucide icons https://lucide.dev/icons
- external icons https://game-icons.net
- merge 2 geojson when data rows are different https://findthatpostcode.uk/tools/merge-geojson
- svg to code https://nikitahl.github.io/svg-2-code
- svg minimize https://svgomg.net
- turf https://turfjs.org/docs/api/centroid
- maplibre gl https://maplibre.org/maplibre-gl-js/docs/API
- react map gl https://visgl.github.io/react-map-gl/docs/api-reference/maplibre/map
- maplibre style editor https://maplibre.org/maputnik
- draw api https://github.com/mapbox/mapbox-gl-draw/blob/main/docs/API.md
- nextjs cache options https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config

# inspo
- fallout is missing some of these locations = https://www.google.com/maps/d/u/0/viewer?hl=en_US&mid=1puuQVpbfh4ofYflJxJPB6iul6JQ

# commands
- npx mapshaper -i ./merge_me/guide.json ./merge_me/point.json ./merge_me/territory.json combine-files -merge-layers -o ./merge_me/merged.json
- npx mapshaper -i source.geojson -clean -o ./merged.json target=source,source,source

```sh
npx mapshaper *.json \
  -each 'this.properties = Object.assign({name:"", type:"", description:"", faction:"", FID:"", icon:"", source:""}, this.properties || {})' \
  -merge-layers \
  -o merged.geojson
```



# JUNK
# watabou
> CAN USE seeds!
- village
- city
- realm (can use pins for city)

# azgaar = https://azgaar.github.io/Fantasy-Map-Generator/
- realm

# donjon
- solar

# other
- solar system
  - HAS SEED = https://fast-times.eldacur.com/cgi-bin/StarGen.pl
  - donjon = https://donjon.bin.sh/scifi/system/index.cgi
  - https://donjon.bin.sh/alien/system/
- planet
  - pixel = https://deep-fold.itch.io/pixel-planet-generator
  - 3D = https://wwwtyro.github.io/procedural.js/planet1/
- realm
  - probabletrain = https://probabletrain.itch.io/city-generator



# how can i integrate (rough draft)
- there isn't a point in getting accurate planet images. Should stylize
- what I need is the possible random data, which will fill any unknowns. Would be nice to seed based on static data
# smaller scale (planet, realm, city, village/glade)



## layer colors
- no atmosphere
- crater
