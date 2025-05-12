import Image from "next/image"
import lancerTitle from '@/public/lancer_title.webp'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import StarsBackground from "@/components/ui/starbackground"
import Legal from "@/components/legal"

export default function page() {
  return (
    <>
      <h1 className="text-5xl my-2 text-center"></h1 >
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
          </Card>
        </Link>
        <Link href="/custom/export">
          <Card className="max-w-[150px] cursor-pointer lg:max-w-[269px] rounded-xl m-1">
            <CardContent className="p-2">
              <StarsBackground>
                <CardDescription className="text-center w-[128px] h-[128px] lg:w-[243px] lg:h-[243px] hover-grow">
                  <div className="flex items-center justify-center w-full h-full">
                    <span className="text-center text-2xl lg:text-5xl text-white">CUSTOM</span>
                  </div>
                </CardDescription>
              </StarsBackground>
            </CardContent>
          </Card >
        </Link>
      </div>
      <Legal />
    </>
  )
}
