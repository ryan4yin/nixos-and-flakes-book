import fs from "fs"
import path from "path"
import { commonPandocArgs, prepareTemp, resolveLang, runPandoc } from "./book-export"

// Usage: tsx pdf-export.ts --lang en
// You can also set LANG env var (e.g., LANG=zh). Defaults to 'en'.
//
// The PDF is produced by Pandoc with the Typst engine, reusing the same
// patched Markdown as the EPUB export. The dev shell provides `typst` and the
// CJK fonts, and exports `BOOK_PDF_FONT_PATHS` (colon-separated font dirs).

// Typst tweaks injected into the Pandoc-generated document:
// - a monospace font for code blocks (CJK falls back to the Source Han fonts)
// - a border + background so code blocks stand out from the body text
// - per-line highlights from VitePress `nix{7-27}` ranges: the range travels in
//   a sentinel first line (`@@book-hl:...@@`, injected by `normalizeFenceOpeners`)
//   that is hidden here and turned into `raw.line` background fills
// - keep a code block on one page when it fits on a page, and let only taller
//   blocks break: Typst's `block(breakable: false)` overflows (and drops lines)
//   when the block does not fit on one page, so decide by measuring the block
//   at its actual wrapped height instead of counting source lines.
const PDF_HEADER = `#show raw: set text(font: ("Source Han Mono SC", "Inter"))

// Start every chapter (Pandoc level-1 heading = one Markdown file) on a new
// page. The weak flag keeps it from adding a blank page when the heading
// already lands at the top of a page.
#show heading.where(level: 1): it => {
  pagebreak(weak: true)
  it
}

// Parse a VitePress highlight range, e.g. "7-27,42-46" -> (7,..,27,42,..,46).
#let parse-hl(spec) = {
  let out = ()
  for part in spec.split(",") {
    let m = part.trim().split("-")
    if m.len() == 2 {
      out += range(int(m.at(0)), int(m.at(1)) + 1)
    } else if m.at(0) != "" {
      out.push(int(m.at(0)))
    }
  }
  out
}

#show raw.where(block: true): it => {
  let lines = it.text.split("\\n")
  let hl = ()
  let drop = 0
  if lines.len() > 0 and lines.first().starts-with("@@book-hl:") {
    let s = lines.first()
    hl = parse-hl(s.slice(10, s.len() - 2))
    drop = 1
  }
  let hlset = hl.map(n => n + drop)

  let code = block(
    width: 100%,
    inset: 8pt,
    radius: 3pt,
    fill: luma(248),
    stroke: 0.5pt + luma(205),
    // Long unbreakable runs (terminal tables, hash rulers) have no line
    // break opportunity and would spill past the border; clip them instead.
    clip: true,
  )[
    #show raw.line: line => {
      if drop == 1 and line.number == 1 { none }
      else if hlset.contains(line.number) {
        // outset extends the fill over the line leading so consecutive
        // highlighted lines have no gap between them.
        box(width: 100%, fill: rgb("#eef4ff"), outset: (y: 0.35em), line.body)
      } else {
        line.body
      }
    }
    #it
  ]

  layout(size => {
    if measure(code, width: size.width).height <= size.height {
      block(breakable: false, code)
    } else {
      code
    }
  })
}

#show figure.where(kind: image): set block(breakable: false)
`

// Force the table of contents (and body) onto a new page so the Pandoc title
// block becomes a standalone cover page.
const PDF_PAGEBREAK = `#pagebreak()
`

const lang = resolveLang()

const mainfont = process.env.BOOK_PDF_MAINFONT ?? "Inter"
const fontPaths = (process.env.BOOK_PDF_FONT_PATHS ?? process.env.TYPST_FONT_PATHS ?? "")
  .split(path.delimiter)
  .filter(Boolean)

const { fileList, tempDir } = prepareTemp(lang, true)
fs.writeFileSync(path.join(tempDir, "pdf-header.typ"), PDF_HEADER)
fs.writeFileSync(path.join(tempDir, "pdf-pagebreak.typ"), PDF_PAGEBREAK)
// Replaces Pandoc's built-in `conf` (see the file header): no justification
// and a Simplified Chinese font fallback. Kept next to the Pandoc-generated
// `.typ` (which lives in `.temp`) so the relative import resolves.
fs.copyFileSync(
  path.join("scripts", "typst-conf.typ"),
  path.join(tempDir, "typst-conf.typ")
)

const output = `../nixos-and-flakes-book.${lang}.pdf`

runPandoc([
  ...commonPandocArgs(fileList, lang),
  "-o",
  output,
  "--pdf-engine=typst",
  ...fontPaths.map((dir) => `--pdf-engine-opt=--font-path=${dir}`),
  "--include-in-header=pdf-header.typ",
  "--include-before-body=pdf-pagebreak.typ",
  "-V",
  `mainfont=${mainfont}`,
  "-V",
  "papersize=a4",
  // Use our `conf` instead of Pandoc's built-in one.
  "-V",
  "template=typst-conf.typ",
  // Language for Typst's CJK line-breaking rules (2/3-letter code only).
  "-V",
  `lang=${lang === "zh" ? "zh" : "en"}`,
  "--metadata=title:NixOS and Flakes Book",
  "--metadata=author:Ryan Yin",
])

console.log(`✅ PDF generated: ${output}`)
