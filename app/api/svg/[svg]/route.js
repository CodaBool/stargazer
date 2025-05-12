import * as svgs from '@/components/svg.js';

export async function GET(req, { params }) {
  try {
    const { svg } = await params
    let icon = svgs[svg]
    if (!icon) throw "no icon for " + svg + " found"
    icon = icon.replace(
      /<svg([^>]*)>/,
      `<svg$1><style>svg { fill: white; }</style>`
    );
    return new Response(icon, {
      headers: { "Content-Type": "image/svg+xml" }
    })
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
