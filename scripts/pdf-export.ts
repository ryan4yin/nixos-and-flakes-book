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
// - keep short code blocks and images on a single page, while long code blocks
//   may still break: Typst's `block(breakable: false)` overflows (and drops
//   lines) when the block does not fit on one page, so only apply it below a
//   threshold.
const PDF_HEADER = `#show raw: set text(font: ("Source Han Mono SC", "Inter"))

#show raw.where(block: true): it => {
  let lines = it.text.split("\\n").len()
  if lines <= 40 { block(breakable: false, it) } else { it }
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

const { fileList, tempDir } = prepareTemp(lang)
fs.writeFileSync(path.join(tempDir, "pdf-header.typ"), PDF_HEADER)
fs.writeFileSync(path.join(tempDir, "pdf-pagebreak.typ"), PDF_PAGEBREAK)

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
  "--metadata=title:NixOS and Flakes Book",
  "--metadata=author:Ryan Yin",
])

console.log(`✅ PDF generated: ${output}`)
