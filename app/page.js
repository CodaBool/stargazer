import Image from "next/image"
// import lancer from '@/public/lancer_landing.webp'
import placeholder1 from '@/public/placeholder_1_landing.webp'
import placeholder2 from '@/public/placeholder_2_landing.webp'
import placeholder3 from '@/public/placeholder_3_landing.webp'
import alienTitle from '@/public/alien_title.webp'
import starwarsTitle from '@/public/starwars_title.webp'
import lancerTitle from '@/public/lancer_title.webp'
import falloutTitle from '@/public/fallout_title.webp'
import cyberpunkTitle from '@/public/cyberpunk_title.webp'
import warhammerTitle from '@/public/warhammer_40k_title.webp'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import StarsBackground from "@/components/ui/starbackground"

export default function page() {
  return (
    <>
      <h1 className="text-5xl my-2 text-center">Sci-Fi Maps</h1 >
      <div className="container mx-auto flex flex-wrap justify-center">
        <Link href="/lancer">
          <Card className="max-w-[150px] cursor-pointer lg:max-w-[269px] rounded-xl m-1">
            <CardContent className="p-2">
              <StarsBackground>
                <Image
                  src={lancerTitle}
                  alt="Lancer Map"
                  className="hover-grow rounded-xl"
                />
              </StarsBackground>
            </CardContent>
          </Card >
        </Link >
        <Link href="/fallout">
          <Card className="max-w-[150px] cursor-pointer lg:max-w-[269px] rounded-xl m-1">
            <CardContent className="p-2">
              <StarsBackground>
                <Image
                  src={falloutTitle}
                  alt="Fallout Map"
                  className="hover-grow rounded-xl"
                />
              </StarsBackground>
            </CardContent>
          </Card >
        </Link>
        <Link href="/starwars">
          <Card className="max-w-[150px] cursor-pointer lg:max-w-[269px] rounded-xl m-1">
            <CardContent className="p-2">
              <StarsBackground>
                <Image
                  src={starwarsTitle}
                  alt="Starwars Map"
                  className="hover-grow rounded-xl"
                />
              </StarsBackground>
            </CardContent>
          </Card >
        </Link>
      </div>
      <hr className="my-2" />
      <div className="container mx-auto flex flex-wrap justify-center">
        <Link href="https://www.nightcity.io/red">
          <Card className="m-1 max-w-[150px] cursor-pointer lg:max-w-[200px] rounded-xl">
            <CardHeader className="p-2 pb-1">
              <CardDescription className="text-[.7em] text-center">Devianaut | DeviousDrizzle</CardDescription>
            </CardHeader>
            <CardContent className="p-2">
              <StarsBackground>
                <Image
                  src={cyberpunkTitle}
                  alt="Cyberpunk RED Map"
                  className="hover-grow rounded-xl"
                />
              </StarsBackground>
            </CardContent>
          </Card >
        </Link >
        <Link href="https://map.weylandyutani.company/">
          <Card className="m-1 max-w-[150px] cursor-pointer lg:max-w-[200px] rounded-xl">
            <CardHeader className="p-2 pb-1">
              <CardDescription className="text-xs text-center">Clay DeGruchy</CardDescription>
            </CardHeader>
            <CardContent className="p-2">
              <StarsBackground>
                <Image
                  src={alienTitle}
                  alt="Alien map"
                  className="hover-grow rounded-xl"
                />
              </StarsBackground>
            </CardContent>
          </Card >
        </Link>
        <Link href="https://jambonium.co.uk/40kmap">
          <Card className="m-1 max-w-[150px] cursor-pointer lg:max-w-[200px] rounded-xl">
            <CardHeader className="p-2 pb-1">
              <CardDescription className="text-xs text-center">Michelle Louise Janion</CardDescription>
            </CardHeader>
            <CardContent className="p-2">
              <StarsBackground>
                <Image
                  src={warhammerTitle}
                  alt="Warhammer 40K map"
                  className="hover-grow rounded-xl"
                />
              </StarsBackground>
            </CardContent>
          </Card >
        </Link>
      </div>
    </>
  )
}
