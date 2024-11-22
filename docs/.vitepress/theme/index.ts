// https://github.com/T-miracle/vitepress-plugin-comment-with-giscus
import DefaultTheme from "vitepress/theme"
import giscusTalk from "vitepress-plugin-comment-with-giscus"
import { useData, useRoute } from "vitepress"
import { toRefs } from "vue"

// custom CSS
import "../style/print.css"

export default {
  ...DefaultTheme,
  enhanceApp(ctx) {
    DefaultTheme.enhanceApp(ctx)
    // ...
  },
  setup() {
    // Get frontmatter and route
    const { frontmatter } = toRefs(useData())
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
        lang: "en-US", // `zh-CN` | `en-US` | `ja-JP` | ...
        // i18n setting (Note: This configuration will override the default language set by lang)
        // Configured as an object with key-value pairs inside:
        // [your i18n configuration name]: [corresponds to the language pack name in Giscus]
        locales: {
          "zh-CN": "zh-CN",
          "en-US": "en",
          "ja-JP": "ja",
        },
        // Avoid mismatches due to GitHub's fuzzy searching method when there are multiple discussions with similar titles/pathname.
        strict: "1",
        homePageShowComment: false, // Whether to display the comment area on the homepage, the default is false
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
