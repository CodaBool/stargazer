// app/(whatever)/vote/page.jsx
import { ArrowLeft, Gavel, Vote } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TITLE } from "@/lib/utils"

// ✅ Adjust these imports to your project
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import db from "@/lib/db"
import FeatureVoteClient from "./component.jsx"
import { getServerSession } from "next-auth"

const FEATURES = [
  { id: 1, label: "Allow for better control over what the player vs GM sees" },
  { id: 2, label: "More in depth planet stats (magnetic field, radiation, biodiversity, habitability, compound presets)" },
  { id: 3, label: "Random narrative generation (points of interest, terrain features, phenomena, flora & fauna, hooks)" },
  { id: 4, label: "Better settings import and export" },
  { id: 5, label: "Can link locations to other maps (can be used for a regional map inside a world map)" },
  { id: 6, label: "Allow for custom remote 3D STL files in drawer view" },
  { id: 7, label: "Fog of war" },
  { id: 8, label: "Integrate with external generators (watabou)" },
  { id: 9, label: "Add Aunic space to Lancer" },
  { id: 10, label: "Support using a custom URL for a map" },
  { id: 11, label: "Integrate with simple-quest module" },
  { id: 12, label: "Allow polygons and lines to have Foundry links" },
  { id: 13, label: "Focus on stability and fixing bugs" },
  { id: 14, label: "translations" },
  { id: 15, label: "expose api and include macros" },
]

export default async function Page() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login?back=/&callback=/contribute/vote')
  // const user = await db.user.findUnique({ where: { email: session.user.email } })
  // if (!user) redirect('/login?back=/&callback=/contribute/vote')

  // Load current user's selected votes (up to 3)
  const myVotes = await db.featureVote.findMany({
    where: { userId: session.user.id },
    select: { featureId: true },
  })
  const initialSelectedIds = myVotes.map((v) => v.featureId)

  // Load counts
  const grouped = await db.featureVote.groupBy({
    by: ["featureId"],
    _count: { featureId: true },
  })

  const countsMap = new Map(grouped.map((g) => [g.featureId, g._count.featureId]))
  const featuresWithCounts = FEATURES.map((f) => ({
    ...f,
    count: countsMap.get(f.id) ?? 0,
  }))

  async function submitVotes(featureIds) {
    "use server"

    const session = await getServerSession(authOptions)
    const uid = session?.user?.id
    if (!uid) throw new Error("Unauthorized")

    if (!Array.isArray(featureIds)) throw new Error("Invalid payload")

    // Normalize + validate as ints, unique, max 3
    const normalized = Array.from(
      new Set(
        featureIds
          .map((n) => (typeof n === "number" ? n : Number(n)))
          .filter((n) => Number.isInteger(n))
      )
    )

    if (normalized.length > 3) throw new Error("You can vote for up to 3 items.")

    const allowed = new Set(FEATURES.map((f) => f.id))
    for (const id of normalized) {
      if (!allowed.has(id)) throw new Error("Invalid feature selection.")
    }

    // Replace the user's selections in one transaction.
    await db.$transaction([
      db.featureVote.deleteMany({ where: { userId: uid } }),
      ...(normalized.length
        ? [
            db.featureVote.createMany({
              data: normalized.map((featureId) => ({ userId: uid, featureId })),
              skipDuplicates: true,
            }),
          ]
        : []),
    ])
  }

  return (
    <div className="starfield">
      <Card className="mx-auto my-8 max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              <Vote className="inline" /> Vote on the next Stargazer feature
            </CardTitle>
            <Link href="/">
              <Button variant="ghost">
                <ArrowLeft />
              </Button>
            </Link>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <FeatureVoteClient
            features={featuresWithCounts}
            initialSelectedIds={initialSelectedIds}
            submitVotesAction={submitVotes}
            maxSelections={3}
          />
        </CardContent>

        <CardFooter >
          <span className="w-full text-center text-gray-500">
          Want to suggest
          <a
            href="https://github.com/CodaBool/map/issues"
            className="text-[#878ec7] hover:underline ps-1"
            target="_blank"
          >
             something else?
            </a>
          </span>

        </CardFooter>
      </Card>
    </div>
  )
}
