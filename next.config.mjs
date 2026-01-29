/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    GCLOUD_PROJECT: process.env.GCLOUD_PROJECT,
    GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    FIREBASE_AUTH_EMULATOR_HOST: process.env.FIREBASE_AUTH_EMULATOR_HOST,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.drz.lazcdn.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'static-01.daraz.com.bd',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media-cdn.storex.dev', // এই হোস্টনেমটি যোগ করা হয়েছে
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'shopbasebd.com', // এই হোস্টনেমটি যোগ করা হয়েছে
        port: '',
        pathname: '/**',
      },,
      {
        protocol: 'https',
        hostname: 'i.imgur.com', // এই হোস্টনেমটি যোগ করা হয়েছে
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
