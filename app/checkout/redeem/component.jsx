'use client'
import { useEffect } from "react"
export default function RedeemComponent({ msg }) {
  useEffect(() => {
    window.parent.postMessage({ type: "premium", msg }, "*")
  }, [])
}
