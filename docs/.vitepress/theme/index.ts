// .vitepress/theme/index.ts
import DefaultTheme from "vitepress/theme"
import giscusTalk from "vitepress-plugin-comment-with-giscus"
import { useData, useRoute } from "vitepress"

// custom CSS
import "../style/print.css"

export default {
  // Extending the Default Theme
  ...DefaultTheme,
  enhanceApp(ctx) {
    DefaultTheme.enhanceApp(ctx)
    // ...
  },
  setup() {
    // Get frontmatter and route
    const { frontmatter } = useData()
    const route = useRoute()

    // Obtain configuration from: https://giscus.app/
    giscusTalk(
      {
        repo: "ryan4yin/nixos-and-flakes-book",
        repoId: "R_kgDOJzAhDA",
        category: "Announcements", // default: `General`
        categoryId: "DIC_kwDOJzAhDM4CXtJ8",
        mapping: "pathname", // default: `pathname`
        inputPosition: "top", // default: `top`
        lang: "en", // default: `zh-CN`
        loading: "lazy",
        lightTheme: "light", // default: `light`
        darkTheme: "transparent_dark", // default: `transparent_dark`
        // ...
      },
      {
        frontmatter,
        route,
      },
      // Whether to activate the comment area on all pages.
      // The default is true, which means enabled, this parameter can be ignored;
      // If it is false, it means it is not enabled.
      // You can use `comment: true` preface to enable it separately on the page.
      true
    )
  },
}
