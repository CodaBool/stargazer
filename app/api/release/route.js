import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export async function GET(req) {
  try {

    const now = new Date()
    const release = new Date('2025-10-31')
    const diff = Math.ceil((release.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    const font = await fetch(
      new URL('../../../public/font/PressStart2P-Regular.ttf', import.meta.url)
    ).then(res => res.arrayBuffer())

    return new ImageResponse(
      (
        <div
          style={{
            fontFamily: 'Press Start 2P',
            fontSize: 62,
            background: 'transparent',
            color: 'white',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          {diff} days
        </div>
      ),
      {
        width: 300,
        height: 150,
        fonts: [
          {
            name: 'Press Start 2P',
            data: font,
            weight: 700,
          },
        ],
        headers: {
          // 'cache-control': 'no-store',
          'cache-control': 'public, max-age=0, s-maxage=86400'
        },
      }
    )
  } catch (error) {
    console.error(error)
    if (typeof error === 'string') {
      return Response.json({ error }, { status: 400 })
    } else if (typeof error?.message === "string") {
      return Response.json({ error: error.message }, { status: 500 })
    } else {
      return Response.json(error, { status: 500 })
    }
  }
}
