export const dynamic = 'force-static'
import { ArrowLeft, Clock, Clock12, Github, Mail, MessageCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function NotFoundPage({ map, error, mapdId }) {

  console.log(error)
  if (error === "bad uuid") {
    return (
      <div className='text-gray-600 select-text justify-start p-4 md:pt-10 md:p-10' style={{
        background: 'linear-gradient(90deg, #FEFEE3 25%, #FDFD96 25%, #FDFD96 50%, #FEFEE3 50%, #FEFEE3 75%, #FDFD96 75%, #FDFD96 100%)',
        backgroundSize: '20px 20px',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        flexDirection: "column"
      }}>
        <Link href={`/${map}`} className="mb-4">
          <ArrowLeft size={42} />
        </Link>
        <h1 className='text-3xl font-bold'>Invalid Map ID "{mapdId}"</h1>

        <div className="flex items-center my-6">
          <span>make sure you have the correct map URL</span>
        </div>

        <div className='max-h-[600px] overflow-auto pb-20'>

          <p className='text-black mb-2'>If you are still experiencing issues, feel free to reach out:</p>

          <div className='flex flex-col items-center'>
            <a href="https://discord.gg/foundryvtt" target="_blank" className='flex items-center text-black w-full'>
              <span className='w-full text-sm'><MessageCircle className='mr-2 inline' />search for and DM <span className="mx-1 font-bold">CodaBool</span> in FoundryVTT Discord</span>
            </a>
            <a href="https://github.com/codabool/stargazer/issues" target="_blank" className='flex items-center text-black w-full'>
              <Github className='mr-2' /> open an issue
            </a>
          </div>
        </div>
      </div>
    )
  } else if (error === "file not found") {
    return (
      <div className='text-gray-600 select-text justify-start p-4 md:pt-10 md:p-10' style={{
        background: 'linear-gradient(90deg, #FEFEE3 25%, #FDFD96 25%, #FDFD96 50%, #FEFEE3 50%, #FEFEE3 75%, #FDFD96 75%, #FDFD96 100%)',
        backgroundSize: '20px 20px',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        flexDirection: "column"
      }}>
        <Link href={`/${map}`} className="mb-4">
          <ArrowLeft size={42} />
        </Link>
        <h1 className='text-3xl font-bold'>Map Not Found</h1>

        <div className="flex items-center my-6">
          <Clock12 className="mr-2 animate-spin" />
          <span>TLDR: Maps changes take 5 minutes to take effect</span>
        </div>

        <div className='max-h-[600px] overflow-auto pb-20'>
          <p className='md:text-lg text-black'>Uh oh, I couldn't find your map. Usually this is because your map is still being generated</p>
          <p className='md:text-lg text-black'>to save on costs, I use aggressive caching. This unfortunately means changes to maps take 5 minutes to become cached. If it's been well over 5 minutes, there is likely something wrong. Here are some things you can try:</p>
          <p className='md:text-lg text-black'></p>

          <ul className='list-disc list-inside ps-6'>
            <li>Ensure your map is visible in your account's export page</li>
            <li>Ensure your map is in a published state</li>
            <li>Use the view button on Cloud map</li>
            <li>Try the above steps from an incognito browser</li>
            <li>Safely recreate your map and publish it again. Make sure to make a backup after every action to ensure no data is lost.</li>
          </ul>

          <p className='text-black mb-2'>If you are still experiencing issues, feel free to reach out:</p>

          <div className='flex flex-col items-center'>
            <a href="mailto:codabool@pm.me" className='flex items-center text-black w-full'>
              <Mail className='mr-2' /> email <b className='pl-2'>codabool@pm.me</b>
            </a>
            <a href="https://discord.gg/foundryvtt" target="_blank" className='flex items-center text-black w-full'>
              <span className='w-full text-sm'><MessageCircle className='mr-2 inline' />search for and DM <span className="mx-1 font-bold">CodaBool</span> in FoundryVTT Discord</span>
            </a>
            <a href="https://github.com/codabool/stargazer/issues" target="_blank" className='flex items-center text-black w-full'>
              <Github className='mr-2' /> open an issue
            </a>
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 0, width: '100%', display: 'flex', justifyContent: 'center' }}>
          <Image src="/pom.gif" unoptimized alt="the fantastic mr. purin" width={100} height={100} priority style={{ width: "auto", height: '100px' }} />
        </div>
      </div>
    )
  }
  return (
    <div className='text-gray-600 select-text justify-start p-4 md:pt-10 md:p-10' style={{
      background: 'linear-gradient(90deg, #FEFEE3 25%, #FDFD96 25%, #FDFD96 50%, #FEFEE3 50%, #FEFEE3 75%, #FDFD96 75%, #FDFD96 100%)',
      backgroundSize: '20px 20px',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      flexDirection: "column"
    }}>
      <Link href={`/${map}`} className="mb-4">
        <ArrowLeft size={42} />
      </Link>
      <h1 className='text-3xl font-bold'>Map Not Found</h1>

      <div className="flex items-center my-6">
        <Clock12 className="mr-2 animate-spin" />
        <span>TLDR: Maps changes take 5 minutes to take effect</span>
      </div>

      <div className='max-h-[600px] overflow-auto pb-20'>
        <p className='md:text-lg text-black'>Uh oh, I couldn't find your map. Usually this is because your map is still being generated</p>
        <p className='md:text-lg text-black'>to save on costs, I use aggressive caching. This unfortunately means changes to maps take 5 minutes to become cached. If it's been well over 5 minutes, there is likely something wrong. Here are some things you can try:</p>
        <p className='md:text-lg text-black'></p>

        <ul className='list-disc list-inside ps-6'>
          <li>Ensure your map is visible in your account's export page</li>
          <li>Ensure your map is in a published state</li>
          <li>Use the view button on Cloud map</li>
          <li>Try the above steps from an incognito browser</li>
          <li>Safely recreate your map and publish it again. Make sure to make a backup after every action to ensure no data is lost.</li>
        </ul>

        <p className='text-black mb-2'>If you are still experiencing issues, feel free to reach out:</p>

        <div className='flex flex-col items-center'>
          <a href="mailto:codabool@pm.me" className='flex items-center text-black w-full'>
            <Mail className='mr-2' /> email <b className='pl-2'>codabool@pm.me</b>
          </a>
          <a href="https://discord.gg/foundryvtt" target="_blank" className='flex items-center text-black w-full'>
            <span className='w-full text-sm'><MessageCircle className='mr-2 inline' />search for and DM <span className="mx-1 font-bold">CodaBool</span> in FoundryVTT Discord</span>
          </a>
          <a href="https://github.com/codabool/stargazer/issues" target="_blank" className='flex items-center text-black w-full'>
            <Github className='mr-2' /> open an issue
          </a>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 0, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Image src="/pom.gif" unoptimized alt="the fantastic mr. purin" width={100} height={100} priority style={{ width: "auto", height: '100px' }} />
      </div>
    </div>
  )
}
