import SettingsForm from "@/components/forms/settings"

export default async function mapLobby({ params }) {
  const { map, id } = await params
  console.log("params", map, id)

  return <SettingsForm map={map} id={id} />
}
