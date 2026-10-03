import { commonPandocArgs, prepareTemp, resolveLang, runPandoc } from "./book-export"

// Usage: tsx epub-export.ts --lang en
// You can also set LANG env var (e.g., LANG=zh). Defaults to 'en'.

const lang = resolveLang()
// Map for metadata (Pandoc expects BCP 47). For Simplified Chinese use zh-Hans.
const metaLang = lang === "zh" ? "zh-Hans" : lang

const { fileList } = prepareTemp(lang)
const output = `../nixos-and-flakes-book.${lang}.epub`

runPandoc([
  ...commonPandocArgs(fileList, lang),
  "-o",
  output,
  "--to=epub3",
  "--standalone",
  "--embed-resources",
  "--css=epub-fixes.css",
  "--metadata=title:NixOS and Flakes Book",
  "--metadata=author:Ryan Yin",
  `--metadata=lang:${metaLang}`,
])

console.log(`✅ EPUB generated: ${output}`)
