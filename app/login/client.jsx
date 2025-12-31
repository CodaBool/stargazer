"use client"
import { useRouter } from "next/navigation"
import { useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { ArrowLeft, LoaderCircle } from "lucide-react"
import { toast } from 'sonner'
import { useEffect } from "react"

export default function SignInClient({ providers, backUrl, callbackUrl }) {
  const [email, setEmail] = useState("")
  const router = useRouter()
  const [emailError, setEmailError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const searchParams = useSearchParams()

  useEffect(() => {
    const error = searchParams.get("error")
    if (error) {
      switch (error) {
        case "OAuthSignin":
        case "OAuthCallback":
        case "OAuthCreateAccount":
        case "EmailCreateAccount":
        case "Callback":
          toast.warning("Something went wrong during the sign-in process. Please try again.")
          break
        case "OAuthAccountNotLinked":
          toast.warning("This account exists under a different sign-in method. Please use the correct provider.")
          break
        case "EmailSignin":
          toast.warning("Failed to send the verification email. Please check your email address and try again.")
          break
        case "SessionRequired":
          toast.warning("You must be signed in to access this page.")
          break
        default:
          toast.warning("An unknown error occurred. Please try again.")
          break
      }
    }
  }, [searchParams])

  // TODO: find out what happens with these common email providers
  // yahoo.com
  // aol.com
  // icloud.com
  // msn.com

  console.log("backUrl", backUrl)
  return (
    <div className="flex mt-20 mx-4 items-center justify-center bg-black starfield">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-center text-2xl">Sign In</CardTitle>
            <Button variant="ghost" onClick={() => router.push(backUrl)}>
              <ArrowLeft />
            </Button>
          </div>
          <CardDescription>
            Pick your preferred method
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {providers &&
            Object.values(providers).map((provider) => {
              if (provider.id === "http-email") {
                return (
                  <div key={provider.id}>
                    <Input
                      placeholder="your@email.com"
                      value={email}
                      type="email"
                      id="email"
                      name="email"
                      onChange={(e) => {
                        const inputEmail = e.target.value;
                        setEmail(inputEmail);
                        const domain = inputEmail.split("@")[1];
                        if (domain === "gmail.com") {
                          setEmailError("Gmail is not supported. For some reason, the emails get blocked.");
                        } else if (["live.com", "hotmail.com", "outlook.com"].includes(domain)) {
                          setEmailError("");
                          toast.warning('Emails from this provider may go to your "Junk Mail" folder');
                        } else {
                          setEmailError("");
                        }
                      }}
                    />
                    {/* <input name="csrfToken" type="hidden" defaultValue={csrfToken} /> */}
                    {emailError && <p className="text-red-300 text-sm my-2 text-center">{emailError}</p>}
                    <Button
                      onClick={() => {
                        if (email.split("@")[1] === "gmail.com") {
                          toast.warning("Gmail is not supported for sign-in")
                          return
                        }
                        setSubmitting(provider.id)
                        signIn(provider.id, { email, callbackUrl })
                        setTimeout(() => {
                          setSubmitting(false)
                        }, 3_000)
                      }}
                      disabled={submitting}
                      variant="outline"
                      className="w-full mt-2"
                    >
                      {submitting === provider.id
                        ? <LoaderCircle className="animate-spin" />
                        : <span>{provider.name}</span>
                      }

                    </Button>
                    <hr className="mt-4" />
                  </div>
                )
              }
              return (
                <Button
                  key={provider.id}
                  onClick={() => {
                    setSubmitting(provider.id)
                    signIn(provider.id, { callbackUrl })
                    setTimeout(() => {
                      setSubmitting(false)
                    }, 3_000)
                  }}
                  variant="outline"
                  disabled={submitting}
                  className="w-full"
                >
                  {submitting === provider.id
                    ? <LoaderCircle className="animate-spin" />
                    : <span>{provider.name}</span>
                  }
                </Button>
              )
            }
            )}
        </CardContent>
      </Card>
    </div>
  )
}
