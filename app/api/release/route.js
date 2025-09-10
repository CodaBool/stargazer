
export const revalidate = 60 * 60 * 2; // 2 hours

export async function GET(req) {
  try {

    const now = new Date();
    const release = new Date('2025-10-31');
    const diff = Math.ceil((release.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return new Response(
      `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Release Countdown</title>
            <style>
                body {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    font-family: monospace, sans-serif;
                    background-color: black;
                    color: white;
                    text-align: center;
                    font-size: 2em;
                    font
                }
            </style>
        </head>
        <body>
            <div>${diff} days until Stargazer release</div>
        </body>
        </html>
        `,
      {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-store',
        },
      }
    );
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
