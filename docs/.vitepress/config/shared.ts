import fs from "fs"
import { createRequire } from "module"
import path from "path"
import { generateSitemap as sitemap } from "sitemap-ts"
import { fileURLToPath } from "url"
import { PageData, defineConfig } from "vitepress"

const require = createRequire(import.meta.url)

// `docs/`, the VitePress source directory (this file lives in docs/.vitepress/config).
const DOCS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")

/**
 * Fallback Open Graph / Twitter description for pages without a hand-written
 * `description` frontmatter: the first substantial prose paragraph, with the
 * Markdown stripped. Keeps every page's card meaningful without adding
 * frontmatter to all 90 Markdown files.
 */
function deriveDescription(pageData: PageData): string | undefined {
  let raw: string
  try {
    raw = fs.readFileSync(path.join(DOCS_DIR, pageData.filePath), "utf-8")
  } catch {
    return undefined
  }
  const body = raw
    .replace(/^---\n[\s\S]*?\n---\n?/, "") // frontmatter
    .replace(/```[\s\S]*?```/g, "") // fenced code blocks
  for (const block of body.split(/\n\s*\n/)) {
    const first = block.trim().split("\n")[0].trim()
    if (!first || /^(#|>|[-*+] |\d+\. |!\[|\||<)/.test(first)) continue
    const text = block
      .replace(/\[\^\d+\]/g, "")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/[`*_]/g, "")
      .replace(/\s+/g, " ")
      .trim()
    if (text.length < 20) continue
    return text.length > 160 ? `${text.slice(0, 157).trimEnd()}...` : text
  }
  return undefined
}

export const shared = defineConfig({
  // Whether to get the last updated timestamp for each page using Git.
  lastUpdated: true,
  // remove trailing `.html`
  // https://vitepress.dev/guide/routing#generating-clean-url
  cleanUrls: true,
  metaChunk: true,

  // SEO Improvement - sitemap.xml & robots.txt
  buildEnd: async ({ outDir }) => {
    sitemap({
      hostname: "https://nixos-and-flakes.thiscute.world/",
      outDir: outDir,
      generateRobotsTxt: true,
    })
  },

  // SEO Improvement - JSON-LD, per-page Open Graph/Twitter cards, canonical
  transformPageData(pageData) {
    const url = pageUrl(pageData)
    const title = pageData.title || SITE_TITLE
    const description =
      pageData.description ||
      deriveDescription(pageData) ||
      LOCALE_DESCRIPTIONS[localeOf(pageData)]
    return {
      frontmatter: {
        ...pageData.frontmatter,
        head: [
          ["link", { rel: "canonical", href: url }],
          ["meta", { property: "og:title", content: title }],
          ["meta", { property: "og:description", content: description }],
          ["meta", { property: "og:url", content: url }],
          ["meta", { name: "twitter:card", content: "summary_large_image" }],
          ["script", { type: "application/ld+json" }, getJSONLD(pageData, title)],
        ],
      },
    }
  },

  // markdown options
  markdown: {
    lineNumbers: true,

    config: (md) => {
      // add support for footnote
      md.use(require("markdown-it-footnote"))
      md.use(require("markdown-it-cjk-breaks"))
    },
  },

  head: [
    ["link", { rel: "icon", href: "/favicon-16x16.png", sizes: "16x16" }],
    ["link", { rel: "icon", href: "/favicon-32x32.png", sizes: "32x32" }],
    // Google Search and Android Chrome
    ["link", { rel: "icon", href: "/favicon-96x96.png", sizes: "96x96" }],
    ["link", { rel: "icon", href: "/web-app-manifest-192x192.png", sizes: "192x192" }],
    ["link", { rel: "icon", href: "/web-app-manifest-512x512.png", sizes: "512x512" }],
    // For Apple iPhone/iPad
    [
      "link",
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
    ],

    // site.manifest
    ["link", { rel: "manifest", href: "/site.webmanifest" }],

    ["meta", { name: "theme-color", content: "#5f67ee" }],
    ["meta", { name: "og:type", content: "website" }],
    ["meta", { name: "og:site_name", content: "NixOS & Flakes Book" }],
    [
      "meta",
      {
        name: "og:image",
        content: "https://nixos-and-flakes.thiscute.world/nixos-and-flakes-book.webp",
      },
    ],
    [
      "meta",
      {
        name: "twitter:image",
        content: "https://nixos-and-flakes.thiscute.world/nixos-and-flakes-book.webp",
      },
    ],

    [
      "script",
      {
        async: "",
        src: "https://www.googletagmanager.com/gtag/js?id=G-N90909Y4XL",
      },
    ],
    [
      "script",
      {},
      `window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-N90909Y4XL');`,
    ],
  ],

  themeConfig: {
    footer: {
      message:
        'Licensed under <a href="http://creativecommons.org/licenses/by-sa/4.0/?ref=chooser-v1" target="_blank">CC BY-SA 4.0</a>',
      copyright:
        'Copyright © 2023-present <a href="https://github.com/ryan4yin" target="_blank">Ryan Yin</a>',
    },

    search: {
      provider: "local",
      // for debugging
      // options: {
      //   /**
      //    * @param {string} src
      //    * @param {import('vitepress').MarkdownEnv} env
      //    * @param {import('markdown-it')} md
      //    */
      //   _render(src, env, md) {
      //     console.log("start...")
      //     console.log("src", src)
      //     let out = md.render(src, env)
      //     console.log("success...")
      //     return out
      //   },
      // },

      // provider: 'algolia',
      // options: {
      //   appId: '747LJ10EI7',
      //   apiKey: '658db5f2bf056f83458cacf5dd58ec80',
      //   indexName: 'nixos-and-flakes-book'
      // }
    },

    editLink: {
      pattern: "https://github.com/ryan4yin/nixos-and-flakes-book/edit/main/docs/:path",
    },

    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/ryan4yin/nixos-and-flakes-book",
      },
    ],
  },
})

const SITE_ORIGIN = "https://nixos-and-flakes.thiscute.world"
const SITE_TITLE = "NixOS & Flakes Book"
const LOCALE_DESCRIPTIONS: Record<string, string> = {
  en: "An unofficial and opinionated book for beginners",
  zh: "一份非官方的新手指南",
}

/** `en` is the root locale; only `zh` is prefixed. */
function localeOf(pageData: PageData): "en" | "zh" {
  return pageData.relativePath.startsWith("zh/") ? "zh" : "en"
}

/**
 * Canonical site URL for a page. `relativePath` already uses the built route
 * (the `en` locale is rewritten to the root), so only `.md` and the `index`
 * suffix need trimming. The previous regex escaped the `$` anchor
 * (`/\/index\$/`), so nested index pages kept a stray `/index` segment.
 */
function pageUrl(pageData: PageData): string {
  const pathSegment = pageData.relativePath
    .replace(/\.md$/, "")
    .replace(/\/index$/, "/")
    .replace(/^index$/, "")
  return `${SITE_ORIGIN}/${pathSegment}`
}

function getJSONLD(pageData: PageData, title: string): string {
  const url = pageUrl(pageData)
  const locale = localeOf(pageData)
  if (pageData.relativePath === "index.md" || pageData.relativePath === "zh/index.md") {
    return JSON.stringify({
      "@context": "http://schema.org",
      "@type": "WebSite",
      url,
      inLanguage: locale === "zh" ? "zh-CN" : "en",
      description: LOCALE_DESCRIPTIONS[locale],
      name: title,
    })
  }
  return JSON.stringify({
    "@context": "http://schema.org",
    "@type": "TechArticle",
    headline: `${title} | ${SITE_TITLE}`,
    inLanguage: locale === "zh" ? "zh-CN" : "en",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    keywords: "NixOS, Nix, Flakes, Linux, Tutorial",
    url,
  })
}
