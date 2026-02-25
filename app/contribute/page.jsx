import { redirect } from "next/navigation"
import db from "@/lib/db"

export default async function Page({ searchParams }) {
  const { map, x, y, name } = await searchParams
  if (!map || !x || !y || !name) {
    console.error("bad redirect", map, x, y, name)
    redirect('/?error=could%20not%20find%20location')
  }

  redirect(`/?error=feature%20still%20in%20development`)

  // TODO: have this use the new location id system.
  const location = await db.location.findMany({
    where: {
      coordinates: `${x},${y}`,
      map: map,
      name: name,
    },
  })
  if (location.length === 1) {
    redirect(`/contribute/${map}/${location[0].id}`, "push")
    // return (
    //   <div className="flex items-center justify-center min-h-[80vh]">
    //     <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-indigo-900 rounded-full" />
    //   </div>
    // )
  } else {
    redirect(`/?error=feature%20not%20found`)
  }
}
