import { ArrowLeft, Heart, Map, Terminal } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default async function Page({ searchParams }) {
  const { redirect } = await searchParams
  const redirectUrl = redirect || '/'

  return (
    <div className='text-gray-600' style={{
      background: 'linear-gradient(90deg, #FEFEE3 25%, #FDFD96 25%, #FDFD96 50%, #FEFEE3 50%, #FEFEE3 75%, #FDFD96 75%, #FDFD96 100%)',
      backgroundSize: '20px 20px',
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: "column"
    }}>
      <Link href={redirectUrl} className="mb-4">
        <ArrowLeft size={42} />
      </Link>
      <h1 className='text-gray-500'>Made with <Heart size={16} className="inline text-black animate-pulse" fill="red" /> by <a href="https://codabool.com" className='text-black' target='_blank'>CodaBool</a></h1>
      <h3 className='text-gray-500'>Other Creations:</h3>
      <a href="https://codabool.itch.io/terminal" className='my-4 text-2xl' target="_blank"><Terminal className='inline' /> Terminal</a>
      <a href="https://codabool.itch.io/maps-in-cyberspace" className='my-4 text-2xl' target="_blank"><Map className='inline' /> Maps in Cyberspace</a>
      <div style={{ position: 'absolute', bottom: 0, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Image src="/pom.gif" unoptimized alt="the fantastic mr. purin" width={300} height={300} priority style={{ width: "auto", height: 'auto' }} />
      </div>
    </div>
  )
}
