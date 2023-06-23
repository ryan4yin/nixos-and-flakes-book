import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  locales: {
    root: {
      label: "English",
      lang: "en",
      link: "/",
      title: "NixOS & Flakes Book",
      description: "An unofficial book for beginners",
    },
    zh: {
      label: "简体中文",
      lang: "zh-CN",
      link: "/zh/",
      title: "NixOS 与 Flakes",
      description: "一份非官方的新手指南",
    },
  },

  // shared properties and other top-level stuff...
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Home", link: "/" },
      { text: "Get Started", link: "/get-started.md" },
    ],

    sidebar: [
      {
        text: "NixOS & Flakes",
        items: [{ text: "Get Started", link: "/get-started.md" }],
      },
    ],

    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/ryan4yin/nixos-and-flakes-book",
      },
    ],
  },
});