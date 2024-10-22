/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/',
        headers: [
          {
            key: 'x-hello',
            value: 'there',
          },
        ],
      },
    ]
  },

};

export default nextConfig;
