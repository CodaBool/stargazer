const nextConfig = {
  async headers() {
    return [
      {
        source: "/api/v1/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ]
  },
  allowedDevOrigins: ['192.168.0.16', '127.0.0.1', 'localhost'],
  reactStrictMode: false,
  // experimental: {
  //   // outputFileTracingRoot: path.join(__dirname),
  //   outputFileTracingIncludes: {
  //     "/app/[map]": ["./app/[map]/topojson/*.json"],
  //     "/app/[map]/**": ["./app/[map]/topojson/*.json"],
  //     "/": ["./app/[map]/topojson/*.json"],
  //   }
  // }
};

export default nextConfig;
