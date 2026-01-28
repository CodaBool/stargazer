import db from "@/lib/db"
import { TITLE } from "@/lib/utils"
import { S3Client, DeleteObjectsCommand } from "@aws-sdk/client-s3"

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CF_ACCESS_ID,
    secretAccessKey: process.env.CF_ACCESS_SECRET,
  },
})

export async function GET(req) {
  try {
    const auth = req.headers.get("authorization")
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) throw "unauthorized"

    const now = new Date()
    const today0 = startOfUtcDay(now)
    const deleteBefore = addUtcDays(today0, -90)

    // Notice rules:
    // 30-day notice => deletion in 30 days => map age 60 days
    // 3-day notice  => deletion in 3 days  => map age 87 days
    //
    // We match maps whose createdAt falls within the UTC day window:
    // [dayStart, dayEnd)
    const notice30Start = addUtcDays(today0, -60)
    const notice30End = addUtcDays(today0, -59)

    const notice3Start = addUtcDays(today0, -87)
    const notice3End = addUtcDays(today0, -86)

    const select = {
      id: true,
      name: true,
      createdAt: true,
      lastUsed: true,
      updatedAt: true,
      locations: true,
      territories: true,
      guides: true,
      userId: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          premium: true,
        },
      },
    }

    const [notice30Maps, notice3Maps] = await Promise.all([
      db.map.findMany({
        where: {
          createdAt: { gte: notice30Start, lt: notice30End },
          user: { premium: false },
        },
        select,
      }),
      db.map.findMany({
        where: {
          createdAt: { gte: notice3Start, lt: notice3End },
          user: { premium: false },
        },
        select,
      }),
    ])

    const notice30ByUser = groupByUser(notice30Maps)
    const notice3ByUser = groupByUser(notice3Maps)

    console.log("notice30ByUser", notice30ByUser)
    console.log("notice3ByUser", notice3ByUser)

    // ---- Log "emails" (you'll replace with your worker) ----
    for (const u of notice30ByUser) {
      if (u.email !== "codabool@pm.me") continue
      // console.log(`[NOTICE 30D] Email to ${u.email} (${u.name ?? "no-name"})`)
      console.log(`Maps scheduled for deletion in 30 days:`, u.maps)
      const msg = buildDeletionNoticeMessage({ daysLeft: 30, maps: u.maps });
      email(`${TITLE} - Deletion Notice - 30 days`, u.email, msg, u.name)
    }

    for (const u of notice3ByUser) {
      if (u.email !== "codabool@pm.me") continue
      // console.log(`[NOTICE 3D] Email to ${u.email} (${u.name ?? "no-name"})`)
      console.log(`Maps scheduled for deletion in 3 days:`, u.maps)
      const msg = buildDeletionNoticeMessage({ daysLeft: 3, maps: u.maps });
      email(`${TITLE} - Deletion Notice - 3 days`, u.email, msg, u.name)
    }

    const expiredMaps = await db.map.findMany({
      where: {
        createdAt: { lt: deleteBefore },
        user: { premium: false },
      },
    })
    console.log("expired maps", expiredMaps)

    if (expiredMaps.length === 0) return Response.json({msg: "no expired maps"})

    const res = await s3.send(new DeleteObjectsCommand({
      Bucket: "maps",
      Delete: {
        Objects: expiredMaps.map(m => ({ Key: m.id })),
        Quiet: true,
      }
    }))

    if (res.Errors?.length) {
      console.log("[S3 DELETE] Some objects failed to delete:", res.Errors);
    } else {
      console.log(`[S3 DELETE] Deleted ${expiredMaps.length} objects.`);
    }

    const dbRes = await db.map.deleteMany({
      where: {
        id: { in: expiredMaps.map((m) => m.id) },
      },
    });

    console.log(
      `[DELETE] Deleted ${dbRes.count} expired maps (non-premium, >= 90d old).`,
    )

    return Response.json({ deleted: dbRes.count, day3Emails: notice3ByUser.length, day30Emails: notice30ByUser.length })
  } catch (error) {
    console.error(error)
    if (typeof error === "string") {
      return Response.json({ error }, { status: 400 })
    } else if (typeof error?.message === "string") {
      return Response.json({ error: error.message }, { status: 500 })
    } else {
      return Response.json(error, { status: 500 })
    }
  }
}

async function email(subject, toEmail, messageHtml, userName) {
  // ${starHTML ?? ""}
  const body = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;line-height:1.5;color:#eaeaea;background:#0b0b10;padding:16px;border-radius:12px;">
      <h1 style="margin:0 0 8px 0;">Deletion notice</h1>

      <p style="margin:12px 0 0 0;">
        Hi ${escapeHtml(userName || "there")},
      </p>

      ${messageHtml}

      <hr style="border:none;border-top:1px solid #333;margin:16px 0;" />

      <p style="margin:0 0 10px 0;">
        You can prevent deletion by purchasing Premium:
        <a style="color:#7dd3fc;" href="${process.env.NEXTAUTH_URL}/checkout">${process.env.NEXTAUTH_URL + '/checkout'}</a>
      </p>

      <p style="margin:0;">
        Open Stargazer:
        <a style="color:#7dd3fc;" href="${process.env.NEXTAUTH_URL}">${escapeHtml(process.env.NEXTAUTH_URL)}</a>
      </p>
    </div>
  `;

  const urlParams = new URLSearchParams({
    subject,
    to: toEmail,
    name: TITLE,
    from: TITLE,
    secret: process.env.EMAIL_SECRET,
    simpleBody: body,
  }).toString();

  const res = await fetch(`https://email.codabool.workers.dev/?${urlParams}`, { method: "POST" });

  if (!res.ok) {
    const error = await res.text();
    console.error(error);
    // throw new Error(error);
  }
}

function renderMapsTable(maps) {
  const rows = maps.map(m => {
    const created = new Date(m.createdAt).toISOString().slice(0, 10);
    const updated = m.updatedAt ? new Date(m.updatedAt).toISOString().slice(0, 10) : "";
    const lastUsed = m.lastUsed ? new Date(m.lastUsed).toISOString().slice(0, 10) : ""
    const loc = typeof m.locations === "number" ? m.locations : "";
    const terr = typeof m.territories === "number" ? m.territories : "";
    const guides = typeof m.guides === "number" ? m.guides : "";

    return `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #333;">${escapeHtml(m.name ?? "")}</td>
        <td style="padding:8px;border-bottom:1px solid #333;">${created}</td>
        <td style="padding:8px;border-bottom:1px solid #333;">${lastUsed}</td>
        <td style="padding:8px;border-bottom:1px solid #333;">${updated}</td>
        <td style="padding:8px;border-bottom:1px solid #333;text-align:right;">${loc}</td>
        <td style="padding:8px;border-bottom:1px solid #333;text-align:right;">${terr}</td>
        <td style="padding:8px;border-bottom:1px solid #333;text-align:right;">${guides}</td>
      </tr>
    `;
  }).join("");

  return `
    <table style="width:100%;border-collapse:collapse;border:1px solid #333;margin-top:12px;">
      <thead>
        <tr>
          <th style="text-align:left;padding:8px;border-bottom:1px solid #333;">Map</th>
          <th style="text-align:left;padding:8px;border-bottom:1px solid #333;">Created</th>
          <th style="text-align:left;padding:8px;border-bottom:1px solid #333;">Last used</th>
          <th style="text-align:left;padding:8px;border-bottom:1px solid #333;">Updated</th>
          <th style="text-align:right;padding:8px;border-bottom:1px solid #333;">Locations</th>
          <th style="text-align:right;padding:8px;border-bottom:1px solid #333;">Territories</th>
          <th style="text-align:right;padding:8px;border-bottom:1px solid #333;">Guides</th>
        </tr>
      </thead>
      <tbody>
        ${rows || `<tr><td colspan="7" style="padding:8px;">(No maps)</td></tr>`}
      </tbody>
    </table>
  `;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildDeletionNoticeMessage({ daysLeft, maps }) {
  return `
    <p style="margin:12px 0 0 0;">
      Your account is on the free plan. Free-plan maps are deleted after 90 days.
      The following map(s) are scheduled for deletion in <b>${daysLeft} day(s)</b>.
    </p>
    ${renderMapsTable(maps)}
  `;
}

function startOfUtcDay(d) {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0),
  )
}

function addUtcDays(d, days) {
  const copy = new Date(d.getTime())
  copy.setUTCDate(copy.getUTCDate() + days)
  return copy
}

function groupByUser(maps) {
  const grouped = {}

  for (const m of maps) {
    const email = m.user.email

    if (!grouped[email]) {
      grouped[email] = {
        email: email,
        name: m.user.name,
        maps: [],
      }
    }

    grouped[email].maps.push({
      id: m.id,
      name: m.name,
      createdAt: m.createdAt,
      lastUsed: m.lastUsed,
      updatedAt: m.updatedAt,
      locations: m.locations,
      territories: m.territories,
      guides: m.guides,
    })
  }

  return Object.values(grouped)
}
