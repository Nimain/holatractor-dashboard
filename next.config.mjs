/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  distDir: '.next',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
 images: {
  remotePatterns: [
    {
      protocol: "https",
      hostname: "holatractor.com",
    },
    {
      protocol: "https",
      hostname: "lh3.googleusercontent.com",
    },
    {
      protocol: "https",
      hostname: "encrypted-tbn0.gstatic.com",
    },
    {
      protocol: "https",
      hostname: "example.com",
    },
    {
      protocol: "https",
      hostname: "wallpapercave.com",
    },
    {
      protocol: "https",
      hostname: "holadashboard.s3.amazonaws.com",          // ✅ ADDED NOW
    },
    {
      protocol: "https",
      hostname: "holadashboard.s3.us-west-2.amazonaws.com", // ✅ KEEP
    },
    {
      protocol: "https",
      hostname: "holaimagesdata.s3.us-west-2.amazonaws.com",
    },
    {
      protocol: "https",
      hostname: "t3.ftcdn.net",
    },
    {
      protocol: "https",
      hostname: "github.com",
    },
    {
      protocol: "https",
      hostname: "media.istockphoto.com",
    },
  ],
},
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'holatractor.com',
            },
            {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
       
      },
      {
        protocol: "https",
        hostname: "encrypted-tbn0.gstatic.com",
       
      },
      // Add other domains you might need
      {
        protocol: "https",
        hostname: "example.com",
      
      },
            {
                protocol: 'https',
                hostname: 'wallpapercave.com',
            },
            {
                protocol: 'https',
                hostname: 'holadashboard.s3.amazonaws.com',
            },
            {
                protocol: 'https',
            hostname: "holadashboard.s3.us-west-2.amazonaws.com",
            },
            {
                protocol: 'https',
                hostname: 'holaimagesdata.s3.us-west-2.amazonaws.com',
            },
            {
                protocol: 'https',
                hostname: 't3.ftcdn.net',
            },
            {
                protocol: 'https',
                hostname: 'example.com',
            },
            {
                protocol: 'https',
                hostname: 'github.com',
            },
            {
                protocol: 'https',
                hostname: 'encrypted-tbn0.gstatic.com',
            },
            {
                protocol: 'https',
                hostname: 'media.istockphoto.com',
            },
        ],
    }
};

export default nextConfig;
