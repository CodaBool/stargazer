import { Gavel } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full text-sm text-gray-400 p-4 flex justify-center items-center gap-2">
      <Gavel className="w-4 h-4" />
      <Link href="/legal" className="hover:underline">
        Legal
      </Link>
    </footer>
  );
}
