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

export default defineUserConfig({
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
  urlOrigin: "https://nixos-and-flakes.thiscute.world/",
})
