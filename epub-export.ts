import config from "./docs/.vitepress/config"
import fs from "fs"
import path from "path"
import { exec } from "child_process"

const sidebar: {
  text: string
  items?: { text: string; link: string }[]
}[] = config.locales!.root.themeConfig!.sidebar as any

// -------- helpers --------

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

      let info = m[1].trim()

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

// -------- setup .temp --------

const tempDir = ".temp"
if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true })
fs.mkdirSync(tempDir, { recursive: true })

// --- Generate file list ---
let fileList: string[] = []

for (const category of sidebar) {
  if (category.items) {
    for (const item of category.items) {
      if (item.link && item.link.endsWith(".md")) {
        const filePath = path.join("en", item.link).replace(/\\/g, "/")
        fileList.push(filePath)
      }
    }
  }
}

console.log("Files to include:", fileList)

// --- Copy and patch Markdown files into .temp ---
for (const relFile of fileList) {
  const srcPath = path.join("docs", relFile)
  const dstPath = path.join(tempDir, relFile)

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

// --- Write Kindle CSS fix ---
const css = `
/* Fix Kindle extra spacing in Pandoc-highlighted code blocks */
code.sourceCode > span { display: inline !important; }          /* override inline-block */
pre > code.sourceCode > span { display: inline !important; }     /* extra safety */
pre { line-height: 1.2 !important; margin: 0 !important; }       /* tighten & remove gaps */
pre code { display: block; padding: 0; margin: 0; }
pre, code { font-variant-ligatures: none; }                      /* avoid odd ligature spacing */
pre > code.sourceCode { white-space: pre; }                      /* don’t pre-wrap lines */
`
fs.writeFileSync(path.join(tempDir, "epub-fixes.css"), css)

// --- Run Pandoc ---
const outputFileName = "../nixos-and-flakes-book.epub"
const pandocCommand = `pandoc ${fileList.join(" ")} \
  -o ${outputFileName} \
  --from=markdown+gfm_auto_identifiers+pipe_tables+raw_html+tex_math_dollars+fenced_code_blocks+fenced_code_attributes \
  --to=epub3 \
  --standalone \
  --toc --toc-depth=2 \
  --number-sections \
  --embed-resources \
  --highlight-style=tango \
  --css=epub-fixes.css \
  --metadata=title:"NixOS and Flakes Book" \
  --metadata=author:"Ryan Yin" \
  --resource-path=.:../docs/public:en`

console.log("🚀 Executing pandoc:", pandocCommand)

exec(pandocCommand, { cwd: tempDir }, (error, stdout, stderr) => {
  if (error) {
    console.error(`❌ Pandoc failed: ${error}`)
    return
  }
  if (stdout) console.log(stdout)
  if (stderr) console.error(stderr)
  console.log("✅ EPUB generated:", outputFileName)
})
