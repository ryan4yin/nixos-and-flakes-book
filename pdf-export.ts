import path from "path"
import { commonPandocArgs, prepareTemp, resolveLang, runPandoc } from "./book-export"

// Usage: tsx pdf-export.ts --lang en
// You can also set LANG env var (e.g., LANG=zh). Defaults to 'en'.
//
// The PDF is produced by Pandoc with the Typst engine, reusing the same
// patched Markdown as the EPUB export. The dev shell provides `typst` and the
// CJK fonts, and exports `BOOK_PDF_FONT_PATHS` (colon-separated font dirs).

const lang = resolveLang()

const mainfont = process.env.BOOK_PDF_MAINFONT ?? "Inter"
const fontPaths = (process.env.BOOK_PDF_FONT_PATHS ?? process.env.TYPST_FONT_PATHS ?? "")
  .split(path.delimiter)
  .filter(Boolean)

const { fileList } = prepareTemp(lang)
const output = `../nixos-and-flakes-book.${lang}.pdf`

runPandoc([
  ...commonPandocArgs(fileList, lang),
  "-o",
  output,
  "--pdf-engine=typst",
  ...fontPaths.map((dir) => `--pdf-engine-opt=--font-path=${dir}`),
  "-V",
  `mainfont=${mainfont}`,
  "-V",
  "papersize=a4",
  "--metadata=title:NixOS and Flakes Book",
  "--metadata=author:Ryan Yin",
])

console.log(`✅ PDF generated: ${output}`)
