import { ArrowLeft, Heart, Map, Terminal, Gavel } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default async function Page({ searchParams }) {
  const { redirect } = await searchParams
  const redirectUrl = redirect || '/'

  return (
    <div className='text-gray-800' style={{
      background: 'linear-gradient(90deg, #FEFEE3 25%, #FDFD96 25%, #FDFD96 50%, #FEFEE3 50%, #FEFEE3 75%, #FDFD96 75%, #FDFD96 100%)',
      backgroundSize: '20px 20px',
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      userSelect: "text",
      flexDirection: "column",
      padding: "2rem",
      textAlign: "center"
    }}>
      <Link href={redirectUrl} className="mb-4">
        <ArrowLeft size={42} />
      </Link>

      <h1 className='text-gray-900 text-3xl font-bold mb-4 flex items-center gap-2'><Gavel /> Legal Disclaimers</h1>

      <div className="max-w-3xl space-y-6 ">
        <p><strong>Lancer:</strong> Stargazer is not an official Lancer product; it is a third party work, and is not affiliated with Massif Press. Stargazer is published via the Lancer <a href="https://massifpress.com/legal" className="text-blue-800 hover:underline">Third Party License.</a></p>

        <p><strong>Fallout:</strong> Stargazer is an unofficial, fan-made project with no affiliation to Bethesda Softworks. "Fallout" and all related names, logos, and intellectual property are trademarks or registered trademarks of Bethesda Softworks. This work is intended for entertainment and educational purposes only</p>

        <p><strong>Star Wars:</strong> Stargazer is an unofficial, fan-made project with no affiliation to Lucasfilm. "Star Wars" and all associated names, logos, and intellectual property are trademarks or registered trademarks of Lucasfilm. This project is non-commercial and created solely for fan enjoyment and educational purposes.</p>

        <p className="italic text-gray-700">Some logos, icons, names, and references used are included under a good faith assumption of fair use for non-commercial, educational fan work.
          These assets remain property of their respective copyright holders. This project makes no claims of ownership for these copyrighted materials.
        </p>
        <p className="italic text-gray-700">All code written for Stargazer is licensed under GNU General Public License v3.0 and is freely available from the project's <a href="https://github.com/codabool/stargazer" className="text-blue-800 hover:underline">GitHub repository</a>.</p>
        <p className="italic text-gray-700">This project is created for educational and entertainment purposes only.</p>
      </div>
    </div>
  )
}
