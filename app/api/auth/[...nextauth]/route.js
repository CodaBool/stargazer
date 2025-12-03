import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import DiscordProvider from "next-auth/providers/discord";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";

// import { withAuth } from "next-auth/middleware"
import db from "@/lib/db";
import { TITLE } from "@/lib/utils";

async function sendVerificationRequest({ identifier: email, url }) {
  const urlParams = new URLSearchParams({
    subject: "Sign into " + TITLE,
    to: email,
    name: "contributor",
    from: TITLE || "anon",
    secret: process.env.EMAIL_SECRET,
    simpleBody: `<h1>Welcome to ${TITLE}</h1>
    ${starHTML}
    <br/>
    <a href="${url}">Please click here to login</a><p>This link is only valid for 24 hours</p>`,
  }).toString();
  // just keep email contents in a param for now
  const res = await fetch(`https://email.codabool.workers.dev/?${urlParams}`, {
    method: "POST",
  });

  if (!res.ok) {
    const error = await res.text();
    console.error(error);
    throw new Error(error);
  }
}

export const authOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
    maxAge: 31556952, // in seconds (31,556,952 = 1 year)
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    {
      id: "http-email",
      name: "Email",
      type: "email",
      maxAge: 60 * 60 * 24, // Email link will expire in 24 hours
      sendVerificationRequest,
    },
    DiscordProvider({
      clientId: process.env.DISCORD_APP_ID,
      clientSecret: process.env.DISCORD_SECRET,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  ],
  theme: {
    colorScheme: "dark",
  },
};

const starHTML = `<img src="data:image/webp;base64,UklGRpwQAABXRUJQVlA4IJAQAAAwbQCdASpxAjgBPpFIn0ylpCKiILHo2LASCWlu4XaxGjO/fjBftaPuu+L/pfUR5f/QF8xnng+hj/zb5b/JfUA86b1bP8lk1fkfvi/sH+A7h/zL+E/LD5Xbm9pfz8/M+Xv4p+QPyL1AvX3+o3m3aPMF9d/rX/E/v/s1fFeZ/1d9gD9Wf8dxg3kn6gfAB/Lv6j/r/Tu/4f9R6APz//Ef97/RfAn/NP63/vP8P7Yvso9Dr9gv/+FWZTygeWnlA8tPKB5aeUDy08oHlp5QNMJwxvjeUrlPKB5aeUDy08oHlp5QPLPQiy4n22eswHkcHtzYv7su8eUxni3m8oHlp5QPLTygeWnhPo+INvJwBSdKEObY4XvpdvT6aBhduwuYLfppbrKcsFZTkShah6EZTygeWnlA8tNyw7U7NH3QCBgAUWCG+HNq+Aw8FMwklp/vg/oXKbp4B8QOlfsViZTygeWnlA8tPC9CCAJASDyYtW4HoRhilFHsH1FvxM5XP4wMXaLR5MUc7+UDy08oHlp5QPLTygeWm2AOOoBl/mAxZGV1b/U5BQerQkgPQjKeUDy08oHlp5QPLTygi2JmkelKUun1qiuU8oHlp5QPLTygeWnlA8tPCsXJBrR10YpVsd7d89/KB5abWFkX4Pnlmjy0ch5aeUDy08oHncOdq7LaEjk51IGddlRTWPH745oD4PoZ5+MDEKL9T8927r3bmfW/iYmXlEE2kysNklyUSFIfh+hlAY7JztRfIveLze/rWU4tPxGU8oHlp5LQqwB8hCJlphT2ACx8r9DX0I5YAsTc6MFRXkPQjKeUDy08oGly0LIkWc+hGU8n6zYhrIofO/lA8tPKB5aeT9q0+LlGiLcp5QPKeMnWlFAehGU8oHlp5QPKfBKdVxQ/EZTygaX71dUp5QPLTygeWnlA8CUtQJHlA8tPCvpaFUeSB0ZTygeWnlA8tPJaAshMixtzR42kbAFOX9cqCws3lA8C0IqQyAoxc3KeUDy08oHlptORckGoLhgKm16DgJbenYiEqrmeCk762Ty4w2NNo3VwLbC1JptzzwdZ5lghEWZbYTtI9+nGCjVpx5D0IynlA8tPKB5aqVJ+UpPLKG+5lv0V6v5vymUSXNZPN5QPLTygeWnlA8tPKB5aeY55aeUDy08oHlp5QPLTygeWnlA8pgAA/v/HOgApXdOJygOewXaVnBepB/nTEU38DoGh+cCQzuD/WmXS3kGKid+vX5dyAtFeNJHxc4cfzrv3qk8+8YThwFgl/uez6mNI8l/Klyk/P2DUmM/mEcZKHdFousS1PvaEh5/Ih8JhDMa8lW9PxiDrg+xm8gKY9txW88q4mKR7p++QfvcgbUbqgGDhmKSFD/FeOSeYKHnpO8U4rXOXf91kCvPgQuHYFPQgjK3t+pmDRhiFRMwY+IR9EDCpBjG52q6X0OKl/Z6fD152L4bsUCtFTVeN/vOV+YfyC9eWQuegtuvo0lAvm2Bq/IbxEPgmUw1Bt7wlJahZswA3NfMYqgVqSJ7kijBuoduOe7I78uCfYqXFpe0dpAQAe+2v9m6ATSr3zb39jqiqxBCMIvbbqgGwh6Gj8vOvPErfvsZdnON8He5qVLSflBHFm35F88e9wSfmB3IOJlr9eACf6bubRPWN73zZ0kHgvOwe3li8TsxxvF46ra5+8zmPOiIKQzU9qspNGuPlXk5hlPRrCrLNv1PJgkH+v43/aMryhta/fFYnW/Kje9FzYY+QVCyJnNbCDILEiffLjdp9Mf5JtXdEK7M3CnhEZrhcYV2QMZSwbroBWfacCyDcODebMHWpkUfKnhtx9rmj0zZKE4cv3DmZE+AU7GIV7Jg8drfGco2tmW1D9uiruwmLYlU4XO2fekAWwyFTBpYI0t1ESVDbcjlyELIeepG2JMNRE1D85EC8mnwyFZUsg6OdnGSLMTp3oaDvdyRiUDKZH22VNaOCWWUtO5bOA6FQw+sJr70vAPaSzW8DrOvtHPWpJNmv+3ONKcpF1uH0i4gtIxk5NN6gRYs2daFwVf5iw/ZbJu9Dz7Rl2LsJmeovKTozQotICv9SIFn7rwbbug7+/3PnjRrjC4p8wQRRf/5L+eekXTNTRnfQW5eFt11sfiT5JeEC/tm+X3jn6iwA4dqVVW89jsvWvS285lkFukUlqdvSOEN4JMntl0jm6IkzUIEOaFRlvuY9260OeNvy1EGpxYhQ0LLbAIEC5Y8kUR6o/k0AE1gyYSq0lf+xk89AO6AQIynbeFmcrmXb8I2dg2R/1MOyy3PnSwoW/vxB3xc3CRgBHBkrXkBLJPVoSYiTYVoH6aVyeUqnnQG7F3Ol0AUOMOPH7Xc/KOXopQyrANUrECfqKuTN4IXi3KwJpxeiUWtlqbaH25P5imhjgYdon2ufEz5WljoKU9b3fFm8rBhh0HW9wAkToLpzwDeFA1SPgitzY/ThMGqVfapvqWd4SOx53Txrg8qOPJcD6DYZuumRGLUlf28gvK09qSOwlq1DxL7xwterMBEwtZKRvV+gv+ZONBS92d7WVdPmQbeU5w348XR8d/282fS/Kkr0qNk+ehIdyJewyvl7l0PF2V5iMwqvh/HXZHQa5vKZOWokttZaz7fmR0/LOAZLjvIJSyHPXigv3nzQAKeqiR5J4u4xfbC77WrT0V+OeOV1iHC1NJPQBvXu0PfkpWVHBffpurThWG7lN6E84AkgAzegW2/GICbHqYXMLuOvvNnRaQcrJ+BW8Kaepz4OGIMTzg5qzqHbZy7/1xDHlI+p/maDKt+acP/Mcp9KVxGz6ZMP28nO8aJK6SbRJTgjWrs0kYhD80HudQzs8zT8plWb4GVafs71D7k2dYdI5GMO1xQRExB6NH1cZAmBsgB7rFdRclzY9GxVO+xvh2LjDQpeONc9KFtSyuiqo0Cd0TRzIT69PgC+3xzoYJKQONWqO61khtjkiOAbpqS+1we3g/ujwpRnUd3Y+Uyi52K7SIZNlwEuh6wgIdbP7AxhhB93sbQb8qY2WrXi7FfM0Fa0TexVlbS4SWghJhQXUf3nq6Bq5JRxxAWWZtb2zKgMHjkuqKfgrJEgXs62l+OlvKsUMPk7SvS39f4RqZA51YzNfbJ/hC4kwC0V785lm+JJ97am1ru+izjFmmdeXv5FukNsdSdbQtQvYR6Mp9I/OIf6AlOl5P5s2R19mMSkrAQIxXUTcovptszJxPSi7jEGaGDFXS0gZtRoSPDcBW3xhjwHciqkgHZc2XwiJPC6rypOn9+4SplWL0mjpZ3iQyzN1BP9eWgwSb3QBqajxRxFjZxxYL4c9BeYltyns7q9MPZ2rmC4XGmwnin//N2qr/F9rX616IdIHKlX38itA1ZPJKRovxLNhvgcySfyjHx5irlS028h3ZRIk9vPZpQ4nU9zbmh1TAStLHDhknxll6j24cbju1VhGL3Tr7Z6btoAPS6c7AbshxzbuxgIk/WEGtSi0wSKL61/0xSekliByBRSHeHCg35eivYlq6K4JELjvmw5y1dFIE8BIuNUsRrt0lpR6/SadSiWtxx7WStOSRUh19bnPrJvC5NnE7ewnJ+ng5Hvedf0E7EIL4lDRtRL58qUyuZt3YhZ+ix7GM1oYkn+t4Nc0deLHFgZRhDCs4NoGGhv2P72cynXag001bhOAiVwc0HpOk5hNwKd/CCAj3DAgXtXPBy9w68c49L3mRC/L4N6cWnesbeNP9HRYTw7zRHyfDBYNRCfDyE1ksbQafqk4eSDhbucXIC2NLvNbExpfHSpgWVz5wXuF5rjkfk7GA2jEhM1YdRJ0C0Oy/OWofzKT71P/zIV24IjTiGHN8/bf13lJL7/0K/dLJdzBCbNVUtzuau8knwbiZBcQIzUj6JY+OxphZtJ0dTz43azfaoLx18KWZ+KoKV8iobf5cmgYjkZ8mKB/lNKykrP0pQlxLTKW8XINE5uuJIVtSkWATDywH/pDuptU3L/ZqqVwzPk0bl2RZXlSYPYed9JkfQPr+uP51Bx2mvr0WdX+p/H7rUd7OTXxNx+mlqqPTbZIYm8vNMzjcInMwjpo4P1A0C2GYSbrcOPeEoY6eNMRjh8hfmONwgC4tGO4GJFp1vy1p7d6PD9qLPahPHm4Dse0DvgkBW2LhGIdzqOswD/QJ01R8bKUTQLIu1shqIx8j8DfNQkljcaaY9C268Et7Cnm15PUwxAhAmPPVNEwZaAs7EG0qnka82uBQqmUuWq5lInkm89vdti3YT/H/IEDhvy1geimTT+7RxPxkauEfM87qynAd/mHQIoJFDFBQPfsSQG0BNCBtXXKkyHYc0Yp5jEe2HfEGI3yQ7Fj/2lesU+IA8nlDH1Do/mGLc3YfjxhOwsjbMy5Pm+cVmscm/TmdQ+4x3FYjvjoW0YzKANjYnzByGYMe71PcGZjizdddbnz2JcaVVmKyb2xPvf0oiOCAfyfcYnXXRgGfT3K/ckOl3SSREtvi4WpWdEYL1Lf/Yg3u1anbvbIIrd1r2Mm6I/rwsHZyYhQf9Q8g3vM9Vc4kQ4zQW9j2s8b+X/OVHQw3xlqLbi8mik1xnFofaiTQLW8lvLBE/cK9MIBtdefBNhXftfaH+8Xyc4wHu2dv+e14+SXNUjuZaQe6kHwY51r1I+bFlqRZvpMgxro6nBb0d46+e5C2IbdnOX+WgKrf4m9HzN1F+LGrGwPo507KFp5fc+EzE55AYK6UNY4cPXsj5BgaUZQXxRumIzHOeibw1db9YZ1ueUaIl9/BcBcYd9BqJbLDP6FEQdRR2AclJzxh24ER/212r1WKzLKpMMwHz0M9mcZ+fVcPdPGU+EzOjrAAv+YLTnvBAD93n+c0SUwtlghy7AyNN5VvamhMRPy831lu9m/MfSXbtlag88653zNyObSTNlnZ11Qy58AvPTMzoSWvXWPOcaccRiwERzrsz+Zf28SuRAZcLybXzBOIQvpsY/Z1q7zfn73fyXUd7MEniZwAam1kYCZ3z2wbMVgh3YQnDyrNTWoHKInst4zKFYHgTCAe9YwOxR4U8ej1qCd2e7HmgOTQ3N9Oj1D9GxUh31bjDdqSlC75nwZSaowM7ZUkLxtUjNEYjODz4KYGmgSI9m5hEb3Kimosg4Pc+hPpGxFBv/hlj8GfsaD5dqTK+Z6RBbNY2NN+tQ9J63wnQvL6LT/2PMLJuC4O7fr9/NaxbRjKt4xQGioTJO0EYNNJ/GCi5O+dXMpCGJIFNVAmJrjU4tQaSBZyiKqC6c6UOqZfnr53dPvyWm+4N5g+h4FHqsQ8OizZht/U79iBwU6ZmYAmcDGAk/6YwmNQ6xFJolSstiCWAiqXC0rkRVEyRc7yvoAmz3ZqWAFi7NAij9SxIDrC+A0PDru3PYKCPBunnt1Unson2ielWJmmnwt8VX5POSNjg50Yw+qYwFBSQWNf5fopT07oucBFDzHF9XwXzEzQkZUPp2GeUg97G3SpJRe5O99ZFctk23l1k0DNSS7Jq3mPBPLs9NSzhOTo/gKYQ+5DAgM4AAAQQjkA/9cTBo0bfjyzovx9LjyrQcNSBcgWOOgYPDEmAh+xXMVo4wjGNLB79hCsd1iYasHra9LIyZyJjf/AKuNjUOxT1oX8PXK3WiRKQxsRCFmcS9gSJ2zhyQrvo2IS4OzqP6iE4GCqonLkLAYhAAAAAA" width="200px" height="100px" >`;

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
