import config from "./docs/.vitepress/config"
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

/**
 * Reduce fence opener to plain ```lang (strip any {...}/attributes).
 * Also map shell/console → bash. If no lang, keep plain ``` only.
 */
function normalizeFenceOpeners(md: string): string {
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

      // Info-string form: ```lang{...} or ```lang
      const mm = info.match(/^([a-zA-Z0-9_-]+)(\{[^}]*\})?$/) // ignore tail
      if (!mm) {
        // unknown → leave as-is
        lines[0] = "```" + info
        return lines.join("\n")
      }

      let lang = mm[1]
      if (lang === "shell" || lang === "console") lang = "bash"

      lines[0] = "```" + (lang || "")
      return lines.join("\n")
    })
    .join("")
}

/** Add left-gutter line numbers as literal text (e.g., " 1 | …") inside fenced blocks. */
function addLineNumbersToFences(md: string): string {
  return md
    .split(/(```[\s\S]*?```)/g)
    .map((block) => {
      if (!block.startsWith("```")) return block

      const lines = block.split("\n")
      // find closing fence
      let closeIdx = lines.length - 1
      while (closeIdx > 0 && !lines[closeIdx].startsWith("```")) closeIdx--

      const opener = lines[0]
      const body = lines.slice(1, closeIdx)
      const width = Math.max(1, String(body.length).length)

      const numbered = body.map((l, i) => `${String(i + 1).padStart(width, " ")} | ${l}`)
      const tail = lines.slice(closeIdx) // includes closing fence
      return [opener, ...numbered, ...tail].join("\n")
    })
    .join("")
}

/** Apply XHTML + path fixes only outside fenced code blocks. */
function sanitizeOutsideCode(md: string): string {
  return md
    .split(/(```[\s\S]*?```)/g)
    .map((part) => {
      if (part.startsWith("```")) return part
      return part
        .replace(/<br\s*>/g, "<br />")
        .replace(/<img([^>]*?)(?<!\/)>/g, "<img$1 />")
        .replace(/!\[([^\]]*)\]\(\/([^)]*)\)/g, "![$1]($2)") // MD images /foo → foo
        .replace(/src="\/([^"]+)"/g, 'src="$1"') // HTML <img src="/foo"> → "foo"
    })
    .join("")
}

const EPUB_CSS = `
/* Fix Kindle extra spacing in Pandoc-highlighted code blocks */
code.sourceCode > span { display: inline !important; }          /* override inline-block */
pre > code.sourceCode > span { display: inline !important; }     /* extra safety */
pre { line-height: 1.2 !important; margin: 0 !important; }       /* tighten & remove gaps */
pre code { display: block; padding: 0; margin: 0; }
pre, code { font-variant-ligatures: none; }                      /* avoid odd ligature spacing */
pre > code.sourceCode { white-space: pre; }                      /* don’t pre-wrap lines */
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
  const sidebar: {
    text: string
    items?: { text: string; link: string }[]
  }[] = config.locales!.root.themeConfig!.sidebar as any

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
export function prepareTemp(lang: string): { fileList: string[]; tempDir: string } {
  const fileList = getFileList(lang)
  console.log("Files to include:", fileList)

  if (fs.existsSync(TEMP_DIR)) fs.rmSync(TEMP_DIR, { recursive: true, force: true })
  fs.mkdirSync(TEMP_DIR, { recursive: true })

  for (const relFile of fileList) {
    const srcPath = path.join("docs", relFile)
    const dstPath = path.join(TEMP_DIR, relFile)

    fs.mkdirSync(path.dirname(dstPath), { recursive: true })
    let content = fs.readFileSync(srcPath, "utf8")

    // 1) Strip attributes/ranges: end up with plain ```lang (alias shell→bash)
    content = normalizeFenceOpeners(content)
    // 2) XHTML + path fixes only outside code
    content = sanitizeOutsideCode(content)
    // 3) Inline line numbers (start at 1)
    content = addLineNumbersToFences(content)

    fs.writeFileSync(dstPath, content)
  }

  copyDir(path.join("docs", "public"), TEMP_DIR)
  fs.writeFileSync(path.join(TEMP_DIR, "epub-fixes.css"), EPUB_CSS)

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
