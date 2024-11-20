/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'holatractor.com',
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
        ],
    }
};

export default nextConfig;
