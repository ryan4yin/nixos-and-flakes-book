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
          {
            text: "NixOS with Flakes",
            items: [
              {
                text: "Get Started with NixOS",
                link: "/nixos-with-flakes/get-started-with-nixos.md",
              },
              {
                text: "Introduction to Flakes",
                link: "/nixos-with-flakes/introduction-to-flakes.md",
              },
              {
                text: "NixOS with Flakes enabled",
                link: "/nixos-with-flakes/get-started-with-flakes.md",
              },
              {
                text: "Started using Home Manager",
                link: "/nixos-with-flakes/start-using-home-manager.md",
              },
              {
                text: "Modularize the Configuration",
                link: "/nixos-with-flakes/modularize-the-configuration.md",
              },
              {
                text: "Update the System",
                link: "/nixos-with-flakes/update-the-system.md",
              },
              {
                text: "Upgrade or Downgrade Packages",
                link: "/nixos-with-flakes/upgrade-or-downgrade-packages.md",
              },
              {
                text: "Other useful Tips",
                link: "/nixos-with-flakes/other-useful-tips.md",
              },
            ],
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
            items: [
              { text: "快速入门", link: "/zh/the-nix-language/index.md" },
            ],
          },

          {
            text: "NixOS 与 Flakes",
            items: [
              {
                text: "开始使用 NixOS",
                link: "/zh/nixos-with-flakes/get-started-with-nixos.md",
              },
              {
                text: "Flakes 简介",
                link: "/zh/nixos-with-flakes/introduction-to-flakes.md",
              },
              {
                text: "使用 Flakes 管理 NixOS",
                link: "/zh/nixos-with-flakes/get-started-with-flakes.md",
              },
              {
                text: "开始使用 Home Manager",
                link: "/zh/nixos-with-flakes/start-using-home-manager.md",
              },
              {
                text: "模块化系统配置",
                link: "/zh/nixos-with-flakes/modularize-the-configuration.md",
              },
              {
                text: "更新系统",
                link: "/zh/nixos-with-flakes/update-the-system.md",
              },
              {
                text: "升级或降级软件包",
                link: "/zh/nixos-with-flakes/upgrade-or-downgrade-packages.md",
              },
              {
                text: "其他杂七杂八的内容",
                link: "/zh/nixos-with-flakes/other-useful-tips.md",
              },
            ],
          },
          {
            text: "Nixpkgs 高级用法",
            items: [{ text: "快速入门", link: "/zh/nixpkgs/index.md" }],
          },
          {
            text: "NixOS 最佳实践",
            items: [{ text: "快速入门", link: "/zh/best-practices/index.md" }],
          },
          {
            text: "Flakes 的其他玩法",
            items: [{ text: "快速入门", link: "/zh/nixpkgs/index.md" }],
          },
          {
            text: "其他进阶话题",
            items: [{ text: "快速入门", link: "/zh/nixpkgs/index.md" }],
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