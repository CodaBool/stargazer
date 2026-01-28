'use client'

import { useEffect, useState } from "react";
import { ArrowLeft, Check } from 'lucide-react'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function WaitForPremium({ name, email }) {
  const [state, setState] = useState({ premium: false, loading: true, error: "" });

  useEffect(() => {
    let cancelled = false;
    let tries = 0;
    const maxTries = 20; // ~20 * 1500ms = 30s
    const intervalMs = 1500;

    async function tick() {
      tries += 1;
      try {
        const res = await fetch("/api/profile", { cache: "no-store" });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = await res.json();
        if (cancelled) return;

        if (data?.user?.premium) {
          setState({ premium: true, loading: false, error: "" });
          return;
        }

        if (tries >= maxTries) {
          setState({
            premium: false,
            loading: false,
            error: "Payment succeeded, but activation is taking longer than expected. Try refreshing in a moment.",
          });
          return;
        }

        setTimeout(tick, intervalMs);
      } catch (e) {
        if (cancelled) return;
        setState({
          premium: false,
          loading: false,
          error: "Payment succeeded, but we couldn’t confirm activation yet. Please refresh in a moment.",
        });
      }
    }

    tick();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className='starfield'>
      <Card className="mx-auto my-8 max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle><Check className='inline' /> Purchase Complete</CardTitle>
            <Link href="/">
              <Button variant="ghost">
                <ArrowLeft />
              </Button>
            </Link>
          </div>
          <CardDescription>
            {state.loading &&
              <div className="flex items-center">
                Activating Premium<div className="animate-spin inline-block w-4 h-4 border-4 border-current border-t-transparent text-indigo-900 rounded-full ms-5" />
              </div>
            }
            {state.premium && <p>Your premium account is now active.</p>}
            {state.error && <p>{state.error}</p>}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-3xl space-y-6">
            <p>Thank you <b>{name || ""}</b> for your purchase!</p>

            {state.premium &&
              <p className="text-gray-200">You can now upload an unlimited number of maps. Without any time limitations.</p>
            }

            <hr />
            <p>
              A confirmation email will be sent to{' '}
              <b>{email || ""}</b>. If you have any questions, please email:{' '}
            </p>
            <p className='text-center'><a href={`mailto:${process.env.NEXT_PUBLIC_EMAIL}`}>{process.env.NEXT_PUBLIC_EMAIL}</a></p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
