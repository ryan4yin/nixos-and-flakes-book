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

      themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        nav: [
          { text: "Home", link: "/" },
          { text: "Get Started", link: "/introduction/index.md" },
          { text: "Best Pracetice", link: "/best-practices/index.md" },
        ],

        sidebar: [
          {
            text: "Get Started",
            items: [
              { text: "Introduction", link: "/introduction/index.md" },
              {
                text: "Advantages and Disadvantages",
                link: "/introduction/advantages-and-disadvantages.md",
              },
              {
                text: "Installation",
                link: "/introduction/installation.md",
              },
            ],
          },
          {
            text: "The Nix Language",
            items: [{ text: "Basics", link: "/the-nix-language/index.md" }],
          },
        ],

        socialLinks: [
          {
            icon: "github",
            link: "https://github.com/ryan4yin/nixos-and-flakes-book",
          },
        ],
      },
    },
    zh: {
      label: "简体中文",
      lang: "zh-CN",
      link: "/zh/",
      title: "NixOS 与 Flakes",
      description: "一份非官方的新手指南",

      themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        nav: [
          { text: "Home", link: "/zh/" },
          { text: "Get Started", link: "/zh/introduction/index.md" },
          { text: "Best Pracetice", link: "/zh/best-practices/index.md" },
        ],

        sidebar: [
          {
            text: "开始使用",
            items: [
              { text: "简介", link: "/zh/introduction/index.md" },
              {
                text: "优缺点",
                link: "/zh/introduction/advantages-and-disadvantages.md",
              },
              {
                text: "安装",
                link: "/zh/introduction/installation.md",
              },
            ],
          },
          {
            text: "Nix 语言",
            items: [{ text: "快速入门", link: "/zh/the-nix-language/index.md" }],
          },
        ],

        socialLinks: [
          {
            icon: "github",
            link: "https://github.com/ryan4yin/nixos-and-flakes-book",
          },
        ],
      },
    },
  },
});