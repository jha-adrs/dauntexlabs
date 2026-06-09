/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fully static client-side site — emits ./out with one HTML file per route.
  output: 'export',
  // Each route becomes /route/index.html, which static hosts resolve cleanly.
  trailingSlash: true,
  // No image optimization server in a static export.
  images: { unoptimized: true },
}

export default nextConfig
