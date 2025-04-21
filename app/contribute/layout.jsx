import Menu from "@/components/menu"
import { Toaster } from "@/components/ui/sonner"


export default function Contribute({ children }) {
  return (
    <>
      <Menu nav="true" path="/contribute" />
      <Toaster />
      {children}
    </>
  )
}
