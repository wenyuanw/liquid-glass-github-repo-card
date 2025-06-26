import { jsxRenderer } from 'hono/jsx-renderer'
import { Link, ViteClient } from 'vite-ssr-components/hono'

declare module 'hono' {
  interface ContextRenderer {
    (
      content: string | Promise<string>,
      props?: { title?: string; ogImage?: string; ogUrl?: string; description?: string }
    ): Response
  }
}

export const renderer = jsxRenderer(({ children, title, ogImage, ogUrl, description }): any => {
  const pageTitle = title ? `${title} - GitHub 项目卡片生成器` : 'GitHub 项目卡片生成器'
  const pageDescription = description || "一个精美的 GitHub 项目卡片生成器，支持生成、下载和分享精美的项目展示卡片，让您的项目更加引人注目"
  const currentUrl = ogUrl || "https://card.wenyuan.news" // 替换为你的实际域名

  return (
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content="GitHub, 项目卡片, 卡片生成器, 项目展示, 开源项目, 代码仓库, 项目宣传" />
        <meta name="author" content="liquid-glass-github-repo-card" />

        {/* Open Graph 标签 */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={currentUrl} />
        {ogImage && <meta property="og:image" content={ogImage} />}
        {ogImage && <meta property="og:image:width" content="1200" />}
        {ogImage && <meta property="og:image:height" content="630" />}
        {ogImage && <meta property="og:image:type" content="image/svg+xml" />}

        {/* Twitter Card 标签 */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        {ogImage && <meta name="twitter:image" content={ogImage} />}

        {/* Favicon */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />

        <ViteClient />
        <Link href="/src/style.css" rel="stylesheet" />
      </head>
      <body>
        {/* SVG 滤镜用于液体玻璃效果 */}
        <svg style="display: none">
          <filter
            id="glass-distortion"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            filterUnits="objectBoundingBox"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.001 0.005"
              numOctaves="1"
              seed="17"
              result="turbulence"
            />
            {/* Liked Seeds: 5, 14, 17 */}

            <feComponentTransfer in="turbulence" result="mapped">
              <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
              <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
              <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
            </feComponentTransfer>

            <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />

            <feSpecularLighting
              in="softMap"
              surfaceScale="5"
              specularConstant="1"
              specularExponent="100"
              lighting-color="white"
              result="specLight"
            >
              <fePointLight x="-200" y="-200" z="300" />
            </feSpecularLighting>

            <feComposite
              in="specLight"
              operator="arithmetic"
              k1="0"
              k2="1"
              k3="1"
              k4="0"
              result="litImage"
            />

            <feDisplacementMap
              in="SourceGraphic"
              in2="softMap"
              scale="200"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </svg>
        {children}
      </body>
    </html>
  )
})
