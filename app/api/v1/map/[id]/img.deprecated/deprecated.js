// export const maxDuration = 60
// export const dynamic = "force-dynamic"
// import db from "@/lib/db"
// // import chromium from '@sparticuz/chromium';
// // import puppeteer from 'puppeteer-core';
// // import puppeteer from 'puppeteer';
// // import sharp from 'sharp'

// import puppeteerCore from "puppeteer-core"
// import puppeteer from "puppeteer";
// import chromium from "@sparticuz/chromium"

// // import edgeChromium from 'chrome-aws-lambda'
// // import puppeteer from 'puppeteer-core'
// // const LOCAL_CHROME_EXECUTABLE = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'


// let browser

// export async function GET(req) {
//   try {

//     const id = req.nextUrl.pathname.split('/')[4]
//     // console.log("split", id)
//     const map = await db.map.findUnique({
//       where: { id },
//     })

//     const { searchParams } = new URL(req.url);

//     const lng = parseInt(searchParams.get('lng'))
//     const lat = parseInt(searchParams.get('lat'))
//     const z = parseFloat(searchParams.get('z'))

//     // Create a URL object
//     // const url = new URL(`http://localhost:3000/${map.map}/${id}`);
//     const url = new URL(`https://starlazer.vercel.app/${map.map}/${id}`);

//     // Set search parameters
//     if (z) url.searchParams.set('z', z)
//     if (lng) url.searchParams.set('lng', lng)
//     if (lat) url.searchParams.set('lat', lat)
//     url.searchParams.set('mini', 1)
//     // Get the final encoded URL
//     console.log("sending req to", url.toString())
//     // console.log("exec path", await chromium.executablePath())

//     // browser = await puppeteer.launch({
//     //   args: puppeteer.defaultArgs(),
//     //   defaultViewport: chromium.defaultViewport,
//     //   executablePath: await chromium.executablePath(),
//     //   // executablePath: process.env.CHROME_EXEC_PATH || await chromium.executablePath(path.join(CHROMIUM_DIR, chromiumBinary)),
//     //   headless: chromium.headless,
//     //   ignoreHTTPSErrors: true,
//     // })


//     const browser = await puppeteerCore.launch({
//       args: chromium.args,
//       defaultViewport: chromium.defaultViewport,
//       executablePath: await chromium.executablePath(),
//       headless: chromium.headless,
//     });

//     // browser = await puppeteer.launch({
//     //   args: chromium.args,
//     //   defaultViewport: chromium.defaultViewport,
//     //   executablePath: await chromium.executablePath(),
//     //   headless: chromium.headless,
//     //   ignoreHTTPSErrors: true,
//     // })

//     const page = await browser.newPage();
//     await page.setViewport({
//       width: 3840,  // 4K Width
//       height: 2160, // 4K Height (16:9 aspect ratio)
//       deviceScaleFactor: 2 // Increase rendering scale
//     })

//     await page.goto(url.toString(), { waitUntil: 'networkidle2', timeout: 30000 });

//     // Wait for the map canvas to be ready
//     await page.waitForSelector('canvas.maplibregl-canvas', { visible: true });

//     // Capture the screenshot
//     // optimizeForSpeed: true
//     // quality: 0-100
//     const screenshotBuffer = await page.screenshot({ type: 'webp', optimizeForSpeed: true, quality: 60 });

//     // Convert to WebP
//     // const webpBuffer = await sharp(screenshotBuffer).webp({ quality: 80 }).toBuffer();

//     await browser.close();

//     return new Response(screenshotBuffer, {
//         status: 200,
//         headers: { 'Content-Type': 'image/webp' }
//     })
//   } catch (error) {
//     if (browser) await browser.close()
//     console.error(error)
//     if (typeof error === 'string') {
//       return Response.json({ error }, { status: 400 })
//     } else if (typeof error?.message === "string") {
//       return Response.json({ error: error.message }, { status: 500 })
//     } else {
//       return Response.json(error, { status: 500 })
//     }
//   }
// }


// /*
// ========= working when done locally ============

// import puppeteer from 'puppeteer';
// browser = await puppeteer.launch({
//     headless: 'new', // Adjust if needed
//     args: ['--no-sandbox', '--disable-setuid-sandbox']
// });
// */


// /*
// the issue is with memory. I'm hitting the max memory of 1Gb easily
// ended up using 1.6Gb of memory
// try again with 3Gb
// */
