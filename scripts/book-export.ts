import config from "../docs/.vitepress/config"
import fs from "fs"
import path from "path"
import { spawnSync } from "child_process"

// Shared helpers for the EPUB and PDF exports.
//
// Both exports run Pandoc over a patched copy of the selected language's
// Markdown (see `prepareTemp`), so the same `.temp` tree and reader options are
// reused; only the Pandoc writer/output differs.

const TEMP_DIR = ".temp"

// Usage: tsx <export script>.ts --lang en
// You can also set LANG env var (e.g., LANG=zh). Defaults to 'en'.
export function resolveLang(argv: string[] = process.argv): string {
  const argLang = argv.find((a) => a.startsWith("--lang="))?.split("=")[1]
  const envLang = process.env.LANG?.split(".")[0] // LANG like en_US.UTF-8
  let lang =
    argLang || (envLang && /^[a-zA-Z]{2}$/.test(envLang) ? envLang : undefined) || "en"
  lang = lang.toLowerCase()
  if (!fs.existsSync(path.join("docs", lang))) {
    console.error(`❌ Language directory not found: docs/${lang}`)
    process.exit(1)
  }
  console.log(`🌐 Using language: ${lang}`)
  return lang
}

// Sentinel first line carrying VitePress line-highlight ranges (`nix{7-27}`)
// to the PDF header, which strips it and fills those lines. Kept in sync with
// `PDF_HEADER` in `pdf-export.ts`.
const HL_SENTINEL = "@@book-hl:"

/**
 * Reduce fence opener to plain ```lang (strip any {...}/attributes).
 * Also map shell/console → bash. If no lang, keep plain ``` only.
 *
 * When `highlight` is set, a VitePress highlight range (`nix{7-27}`) is kept as
 * a sentinel first line instead of being dropped; the PDF header turns it into
 * per-line highlights. The EPUB has no such handling, so it must not get it.
 */
function normalizeFenceOpeners(md: string, highlight = false): string {
  return md
    .split(/(```[\s\S]*?```)/g)
    .map((block) => {
      if (!block.startsWith("```")) return block

      const lines = block.split("\n")
      const opener = lines[0]
      const m = opener.match(/^```([^\n]*)$/)
      if (!m) return block

      const info = m[1].trim()

      // Attribute form: ```{.nix ...} → extract first class as lang
      if (info.startsWith("{")) {
        const mm = info.match(/\.([a-zA-Z0-9_-]+)/)
        const lang = mm ? mm[1] : ""
        const mapped = lang === "shell" || lang === "console" ? "bash" : lang
        lines[0] = "```" + (mapped || "")
        return lines.join("\n")
      }

      // Info-string form: ```lang{ranges} → lang + optional highlight ranges
      const mm = info.match(/^([a-zA-Z0-9_-]+)\{([^}]*)\}$/)
      if (mm) {
        let lang = mm[1]
        if (lang === "shell" || lang === "console") lang = "bash"
        lines[0] = "```" + lang
        const spec = mm[2].trim()
        if (highlight && spec) lines.splice(1, 0, `${HL_SENTINEL}${spec}@@`)
        return lines.join("\n")
      }

      // Info-string form: ```lang
      const mm2 = info.match(/^([a-zA-Z0-9_-]+)$/)
      if (!mm2) {
        // unknown → leave as-is
        lines[0] = "```" + info
        return lines.join("\n")
      }

      let lang = mm2[1]
      if (lang === "shell" || lang === "console") lang = "bash"

      lines[0] = "```" + (lang || "")
      return lines.join("\n")
    })
    .join("")
}

/** Apply `fn` to the parts of `md` outside fenced code blocks. */
function mapOutsideCode(md: string, fn: (part: string) => string): string {
  return md
    .split(/(```[\s\S]*?```)/g)
    .map((part) => (part.startsWith("```") ? part : fn(part)))
    .join("")
}

/**
 * Scope footnote ids to the chapter that defines them. `preface.md` and
 * `introduction-to-flakes.md` both define `[^1]`/`[^2]`/`[^3]`; because Pandoc
 * parses the whole book in one run, the later definition wins and the preface's
 * notes end up pointing at the wrong URLs. Prefixing every footnote id
 * (reference and definition alike) with the file's chapter id keeps each
 * chapter's notes self-contained.
 */
function namespaceFootnotes(md: string, prefix: string): string {
  return mapOutsideCode(md, (part) =>
    part.replace(/\[\^([^\[\]]+)\]/g, (_whole, id: string) => `[^${prefix}${id}]`)
  )
}

/** Apply XHTML + path + component fixes only outside fenced code blocks. */
function sanitizeOutsideCode(md: string): string {
  return mapOutsideCode(md, (part) =>
    part
      .replace(/<br\s*>/g, "<br />")
      .replace(/<img([^>]*?)(?<!\/)>/g, "<img$1 />")
      .replace(/!\[([^\]]*)\]\(\/([^)]*)\)/g, "![$1]($2)") // MD images /foo → foo
      .replace(/src="\/([^"]+)"/g, 'src="$1"') // HTML <img src="/foo"> → "foo"
      // VitePress <Badge> components are not valid XHTML; keep their text.
      .replace(/<Badge\b[^>]*\btext="([^"]*)"[^>]*\/?>/g, "**$1**")
      .replace(/<Badge\b[^>]*\/?>/g, "")
      // `align` is obsolete in EPUB3; use the equivalent inline style.
      .replace(/\balign="(center|left|right|justify)"/g, 'style="text-align: $1"')
      // A raw `#` inside the URL fragment is invalid; percent-encode it.
      .replace(/matrix\.to\/#\/#/g, "matrix.to/#/%23")
  )
}

/**
 * Stable anchor id for a Markdown file. Derived from its path so it does not
 * depend on Pandoc's slug rules (which differ from VitePress's for edge cases).
 */
function idFor(rel: string): string {
  return "ch-" + rel.replace(/\.md$/, "").replace(/\//g, "-")
}

/**
 * Rewrite internal page links to in-document anchors so both the EPUB and the
 * PDF resolve them. Handles `.md` links plus extension-less route links
 * (`./other`, `../a/b#anchor`, `/faq/`). Non-page targets (assets, external
 * URLs) are left untouched.
 */
function rewriteInternalLinks(
  md: string,
  currentRel: string,
  anchors: Map<string, string>
): string {
  return mapOutsideCode(md, (part) =>
    part.replace(
      /\]\(([^)\s#]*)(#[^)\s]+)?\)/g,
      (whole, target: string, anchor?: string) => {
        if (!target || target.includes("://")) return whole
        let rel = target.startsWith("/")
          ? target.slice(1)
          : path.posix.normalize(path.posix.join(path.posix.dirname(currentRel), target))
        rel = rel.replace(/\/+$/, "")

        const id = rel.endsWith(".md")
          ? anchors.get(rel)
          : (anchors.get(`${rel}.md`) ?? anchors.get(`${rel}/index.md`))
        if (!id) {
          if (rel.endsWith(".md")) {
            console.warn(
              `⚠️  internal target not exported: ${target} (from ${currentRel})`
            )
          }
          return whole
        }
        return anchor ? `](#${anchor.slice(1)})` : `](#${id})`
      }
    )
  )
}

/** Anchor id already declared on the file's leading heading, if any. */
function firstHeadingId(md: string): string | undefined {
  for (const line of md.split("\n")) {
    if (line.startsWith("```")) return undefined
    if (!/^#\s+\S/.test(line)) continue
    return line.match(/\{#([^}\s]+)/)?.[1]
  }
  return undefined
}

/** Give the file's leading heading a stable id that cross-file links target. */
function injectHeadingId(md: string, id: string): string {
  const lines = md.split("\n")
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("```")) break
    if (!/^#\s+\S/.test(lines[i])) continue
    if (/\{#[^}]+\}/.test(lines[i])) return md // already has an explicit id

    lines[i] = lines[i].replace(/\{([^}]*)\}\s*$/, (_, attrs) => {
      const rest = attrs.trim()
      return `{#${id}${rest ? " " + rest : ""}}`
    })
    if (!lines[i].includes(`{#${id}`))
      lines[i] = `${lines[i].replace(/\s*$/, "")} {#${id}}`
    break
  }
  return lines.join("\n")
}

const EPUB_CSS = `
/* Fix Kindle extra spacing in Pandoc-highlighted code blocks */
code.sourceCode > span { display: inline !important; }          /* override inline-block */
pre > code.sourceCode > span { display: inline !important; }     /* extra safety */
pre { line-height: 1.2 !important; }                             /* tighten */
pre code { display: block; padding: 0; margin: 0; }
pre, code { font-variant-ligatures: none; }                      /* avoid odd ligature spacing */
pre > code.sourceCode { white-space: pre; }                      /* don't pre-wrap lines */

/* Box code blocks, matching the PDF export. */
pre.sourceCode {
  border: 1px solid #dddddd;
  border-radius: 4px;
  background: #f8f8f8;
  padding: 6px 8px;
  margin: 1em 0;
}
`

function copyDir(src: string, dst: string): void {
  fs.mkdirSync(dst, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name)
    const to = path.join(dst, entry.name)
    if (entry.isDirectory()) copyDir(from, to)
    else fs.copyFileSync(from, to)
  }
}

function getFileList(lang: string): string[] {
  // The `en` locale lives under `root`; other languages use their own key.
  const localeKey = lang === "en" ? "root" : lang
  const sidebar: {
    text: string
    items?: { text: string; link: string }[]
  }[] = (config.locales as any)[localeKey]?.themeConfig?.sidebar ?? []

  const fileList: string[] = []
  for (const category of sidebar) {
    if (!category.items) continue
    for (const item of category.items) {
      if (item.link && item.link.endsWith(".md")) {
        fileList.push(path.join(lang, item.link).replace(/\\/g, "/"))
      }
    }
  }
  return fileList
}

/**
 * Build a patched copy of the selected language under `.temp` and return the
 * ordered list of Markdown files (relative to `.temp`).
 *
 * The `docs/public` assets are copied to `.temp` as well: Pandoc resolves them
 * via `--resource-path`, but the Typst PDF engine only looks relative to the
 * working directory, so the assets have to be reachable from `.temp`.
 */
export function prepareTemp(
  lang: string,
  highlight = false
): { fileList: string[]; tempDir: string } {
  const fileList = getFileList(lang)
  console.log("Files to include:", fileList)

  if (fs.existsSync(TEMP_DIR)) fs.rmSync(TEMP_DIR, { recursive: true, force: true })
  fs.mkdirSync(TEMP_DIR, { recursive: true })

  const prefix = `${lang}/`
  const anchors = new Map<string, string>()
  for (const relFile of fileList) {
    const rel = relFile.replace(prefix, "")
    const text = fs.readFileSync(path.join("docs", relFile), "utf8")
    // Prefer an anchor already present on the leading heading (VitePress custom
    // anchor); otherwise inject a stable, path-derived one.
    anchors.set(rel, firstHeadingId(text) ?? idFor(rel))
  }
  for (const relFile of fileList) {
    const srcPath = path.join("docs", relFile)
    const dstPath = path.join(TEMP_DIR, relFile)
    const rel = relFile.replace(prefix, "")

    fs.mkdirSync(path.dirname(dstPath), { recursive: true })
    let content = fs.readFileSync(srcPath, "utf8")

    // 1) Strip attributes; keep `{ranges}` as a sentinel line for the PDF.
    content = normalizeFenceOpeners(content, highlight)
    // 2) Scope footnote ids per chapter (they collide across concatenated files)
    content = namespaceFootnotes(content, `${anchors.get(rel)!}-`)
    // 3) XHTML + path fixes only outside code
    content = sanitizeOutsideCode(content)
    // 4) Internal page links → in-document anchors
    content = rewriteInternalLinks(content, rel, anchors)
    // 5) Stable id on the leading heading (target of cross-file links)
    content = injectHeadingId(content, anchors.get(rel)!)

    fs.writeFileSync(dstPath, content)
  }

  copyDir(path.join("docs", "public"), TEMP_DIR)
  // Injected with `--include-in-header` (not `--css`): passing `--css` makes
  // Pandoc drop its own syntax-highlighting stylesheet, leaving code black and
  // white. A `<style>` header coexists with it.
  fs.writeFileSync(
    path.join(TEMP_DIR, "epub-fixes.html"),
    `<style>\n${EPUB_CSS}\n</style>\n`
  )

  return { fileList, tempDir: TEMP_DIR }
}

// `-citations` matters: the books mention accounts like `@NickCao`, which the
// default `markdown` reader would parse as Pandoc citations. That silently
// renders fine in EPUB but makes the Typst engine fail without a bibliography.
export const PANDOC_READER =
  "markdown-citations+gfm_auto_identifiers+pipe_tables+raw_html+tex_math_dollars+fenced_code_blocks+fenced_code_attributes"

export function commonPandocArgs(fileList: string[], lang: string): string[] {
  return [
    ...fileList,
    `--from=${PANDOC_READER}`,
    "--toc",
    "--toc-depth=2",
    "--number-sections",
    "--highlight-style=tango",
    `--resource-path=.:../docs/public:${lang}`,
  ]
}

/** Run Pandoc from `.temp` and abort the script if it fails. */
export function runPandoc(args: string[], cwd: string = TEMP_DIR): void {
  console.log("🚀 Executing pandoc:", ["pandoc", ...args].join(" "))
  const result = spawnSync("pandoc", args, { cwd, stdio: "inherit" })
  if (result.error) {
    console.error(`❌ Failed to run pandoc: ${result.error.message}`)
    process.exit(1)
  }
  if (result.status !== 0) {
    console.error(`❌ Pandoc failed with exit code ${result.status}`)
    process.exit(result.status ?? 1)
  }
}
