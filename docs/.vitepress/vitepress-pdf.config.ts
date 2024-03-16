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
    const aIndex = routeOrder.findIndex((route) => route === pageA.path)
    const bIndex = routeOrder.findIndex((route) => route === pageB.path)
    const index = aIndex - bIndex
    // console.log(`sorter: ${pageA.path} vs ${pageB.path} = ${index}`);
    return index
  },
  urlOrigin: "https://nixos-and-flakes.thiscute.world/",
})
