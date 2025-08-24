

export async function GET(req, { params }) {
  const rawParams = await params
  // console.log("path", rawParams.path.join("/"))
  const url = `https://${rawParams.path.join("/")}`
  // console.log("fetch", url)
  const res = await fetch(url)
  const buffer = await res.arrayBuffer()
  const contentType = res.headers.get("content-type") || "application/octet-stream"
  return new Response(buffer, {
    status: res.status,
    headers: {
      "Content-Type": contentType,
      "Access-Control-Allow-Origin": "*", // allow any origin
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}
