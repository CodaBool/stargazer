import sharp from "sharp";

const CONFIG = {
  baseUrl: "https://forgotten-map.github.io/ForgottenMaps-Tiles/tiles/swordcoast",
  zoom: 6,
  tileSize: 256,

  // ---- TILE RANGE (edit if needed) ----
  // Based on your bottom-left: z6/0/24, assuming you want full width at z6 (0..63)
  xMin: 0,
  xMax: 63,
  yMin: 0,
  yMax: 24,

  // ---- RATE LIMITING ----
  // Concurrency: how many fetches can be in-flight at once
  concurrency: 4,

  // Delay before each request (ms). This is applied per worker, so effective global RPS
  // is roughly concurrency / delayMs. Example: 4 workers + 250ms delay ~ 16 req/sec max.
  delayMs: 250,

  // Retries for non-404 failures
  retries: 3,

  // Extra politeness: a small random jitter so you don't look like a metronome
  jitterMs: 100,

  // Request timeout (ms)
  timeoutMs: 15000,

  output: "output-z6.png",
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function jitter(max) {
  return max ? Math.floor(Math.random() * max) : 0;
}

async function fetchWithTimeout(url, timeoutMs) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function fetchTileBuffer(url, { retries, timeoutMs }) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithTimeout(url, timeoutMs);
      if (res.status === 404) return null; // tile doesn't exist, skip
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const ab = await res.arrayBuffer();
      return Buffer.from(ab);
    } catch (e) {
      lastErr = e;
      // backoff: 0.5s, 1s, 2s...
      const backoff = 500 * Math.pow(2, attempt);
      await sleep(backoff);
    }
  }
  throw lastErr;
}

async function main() {
  const {
    baseUrl,
    zoom,
    tileSize,
    xMin,
    xMax,
    yMin,
    yMax,
    concurrency,
    delayMs,
    retries,
    jitterMs,
    timeoutMs,
    output,
  } = CONFIG;

  const tiles = [];
  for (let x = xMin; x <= xMax; x++) {
    for (let y = yMin; y <= yMax; y++) {
      tiles.push({ x, y });
    }
  }

  const totalX = xMax - xMin + 1;
  const totalY = yMax - yMin + 1;
  const width = totalX * tileSize;
  const height = totalY * tileSize;

  console.log(`Zoom: ${zoom}`);
  console.log(`Tiles: ${tiles.length} (${totalX} x ${totalY})`);
  console.log(`Output image: ${width} x ${height}`);
  console.log(
    `Rate limit: concurrency=${concurrency}, delayMs=${delayMs} (+ jitter up to ${jitterMs}ms)`
  );

  const compositeOps = [];
  let done = 0;
  let okCount = 0;
  let missingCount = 0;
  let failCount = 0;

  // simple shared queue
  let idx = 0;

  const worker = async (workerId) => {
    while (true) {
      const i = idx++;
      if (i >= tiles.length) return;

      const { x, y } = tiles[i];
      const url = `${baseUrl}/${zoom}/${x}/${y}.png`;

      // pacing
      await sleep(delayMs + jitter(jitterMs));

      try {
        const buf = await fetchTileBuffer(url, { retries, timeoutMs });
        if (buf) {
          compositeOps.push({
            input: buf,
            left: (x - xMin) * tileSize,
            top: (y - yMin) * tileSize,
          });
          okCount++;
        } else {
          missingCount++;
        }
      } catch (e) {
        failCount++;
        console.warn(`[worker ${workerId}] failed ${x}/${y}: ${e?.message || e}`);
      } finally {
        done++;
        if (done % 50 === 0 || done === tiles.length) {
          console.log(
            `Progress ${done}/${tiles.length} | ok=${okCount} missing=${missingCount} fail=${failCount}`
          );
        }
      }
    }
  };

  await Promise.all(Array.from({ length: concurrency }, (_, n) => worker(n + 1)));

  console.log("Compositing...");
  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(compositeOps)
    .png()
    .toFile(output);

  console.log(`Saved: ${output}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
