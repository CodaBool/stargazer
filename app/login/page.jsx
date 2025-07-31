import { getProviders } from "next-auth/react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import SignInPage from "./client"

export default async function ServerSignInPage({ searchParams }) {
  const session = await getServerSession(authOptions)
  const { callbackUrl, back, url, callback } = await searchParams
  const backUrl = back || '/'

  // redirect if a session exists
  // use callback if one is found in the URL
  if (session && callbackUrl) {
    const decodedCallbackUrl = decodeURIComponent(callbackUrl);
    const baseUrl = process.env.NEXTAUTH_URL;
    const path = decodedCallbackUrl.replace(baseUrl, "");
    redirect(path)
  } else if (session) {
    redirect("/")
  }

  const providers = await getProviders()
  return <SignInPage providers={providers} backUrl={backUrl} callbackUrl={callback} />
}
