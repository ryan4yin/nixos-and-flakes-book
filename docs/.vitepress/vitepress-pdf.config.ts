import { defineUserConfig } from "vitepress-export-pdf"
import config from "./config"

// convert `config.themeConfig?.sidebar` to a list of routes
let routeOrder = []
const sidebar = config.locales.root.themeConfig?.sidebar
if (sidebar) {
  sidebar.forEach((it) => {
    if (it.items) {
      it.items.forEach((subItem) => {
        routeOrder.push(subItem.link.replace(/\.md$/, ""))
      })
    }
  })
}

// print routeOrder in terminal
console.log("routeOrder: ", routeOrder)

const headerTemplate = `<div style="margin-top: -0.4cm; height: 70%; width: 100%; display: flex; justify-content: center; align-items: center; color: lightgray; border-bottom: solid lightgray 1px; font-size: 10px;">
  <span class="title"></span>
</div>`

const footerTemplate = `<div style="margin-bottom: -0.4cm; height: 70%; width: 100%; display: flex; justify-content: flex-start; align-items: center; color: lightgray; border-top: solid lightgray 1px; font-size: 10px;">
  <span style="margin-left: 15px;" class="url"></span>
</div>`

export default defineUserConfig({
  urlOrigin: "https://nixos-and-flakes.thiscute.world/",

  // When NO_SANDBOX is true, disable sandboxing
  ...(process.env.NO_SANDBOX === "true"
    ? {
        puppeteerLaunchOptions: {
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        },
      }
    : {}),
  pdfOptions: {
    format: "A4",
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate,
    footerTemplate,
    margin: {
      bottom: 60,
      left: 25,
      right: 25,
      top: 60,
    },
  },

  routePatterns: ["!/zh/**"], // exclude zh-CN pages
  sorter: (pageA, pageB) => {
    // console.log("pageA: ", pageA.path, "  pageB: ", pageB.path)

    // remove the locale prefix
    const pathA = pageA.path.replace("/en/", "/")
    const pathB = pageB.path.replace("/en/", "/")
    // compare
    const aIndex = routeOrder.findIndex((route) => route === pathA)
    const bIndex = routeOrder.findIndex((route) => route === pathB)
    return aIndex - bIndex
  },
})
