# Icons
> I gather icons from a few sources for this project

## Lucide
1. download zip of repo from [github](https://github.com/lucide-icons/lucide)
2. cd icons && rm *.json
3. copy folder

## font awesome
1. download from [fontawesome.com](https://fontawesome.com/download)
2. `cd svgs/solid`
3. add `fill="white"` by running this bash

```sh
#!/bin/bash

find . -type f -name "*.svg" | while read -r file; do
  if grep -q "<path " "$file" && ! grep -q "fill=" "$file"; then
    sed -i 's/<path /<path fill="white" /g' "$file"
  fi
done

echo "Done."

```

4. copy folder

## Foundry
1. download zip from [foundry](https://foundryvtt.com/me/licenses)
2. `cd resource/app/public/icons/svg`
3. `rm *-black.svg`
4. copy folder

## Fallout
1. done manually by downloading from [fallout.wiki](https://fallout.wiki/wiki/Template:Location_map/Icons)
2. svg [minimize](https://svgomg.net)
3. svg [to code](https://nikitahl.github.io/svg-2-code)


## Lancer
1. done manually be downloading from [game-icons.net](https://game-icons.net/)
2. svg [minimize](https://svgomg.net)
3. svg [to code](https://nikitahl.github.io/svg-2-code)

# Package
> let's smash them all together

## Commands
1. `cd lib`
2. `npm run svg`

## What it does
It does a few things:
- add fill="white" when needed, for lucide it changes stroke="currentColor" to stroke="white"
- combines all non-exclusive icons into a main folder
- creates index json files which help create a search functionality


# Sprite
1. download latest spritezero release from [github](https://github.com/flother/spreet/releases)
2. `./spreet_0.11.0 ../public/svg ../public/sprite --minify-index-file --sdf --recursive --ratio 32`
  a. this can take up to 20 minutes
2. `./spreet_0.11.0 ../public/svg ../public/sprite --minify-index-file --sdf --recursive --ratio 32`
