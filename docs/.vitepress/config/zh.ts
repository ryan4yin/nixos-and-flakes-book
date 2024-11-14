import { defineConfig } from "vitepress"

export const zh = defineConfig({
  lang: "zh-CN",
  description: "一份非官方的新手指南",

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "首页", link: "/zh/" },
      { text: "前言", link: "/zh/preface.md" },
      { text: "开始使用", link: "/zh/introduction/index.md" },
      { text: "最佳实践", link: "/zh/best-practices/intro.md" },
    ],

    sidebar: [
      {
        text: "前言",
        items: [{ text: "前言", link: "/zh/preface.md" }],
      },
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
            link: "/zh/nixos-with-flakes/nixos-with-flakes-enabled.md",
          },
          {
            text: "NixOS 的 flake.nix 内容详解",
            link: "/zh/nixos-with-flakes/nixos-flake-configuration-explained.md",
          },
          {
            text: "Flakes 的组合能力与 Nixpkgs 模块系统",
            link: "/zh/nixos-with-flakes/nixos-flake-and-module-system.md",
          },
          {
            text: "安装使用 Home Manager",
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
            text: "降级或升级软件包",
            link: "/zh/nixos-with-flakes/downgrade-or-upgrade-packages.md",
          },
          {
            text: "其他杂七杂八的内容",
            link: "/zh/nixos-with-flakes/other-useful-tips.md",
          },
        ],
      },
      {
        text: "Nixpkgs 高级用法",
        items: [
          { text: "简介", link: "/zh/nixpkgs/intro.md" },
          { text: "callPackage", link: "/zh/nixpkgs/callpackage.md" },
          { text: "Overriding", link: "/zh/nixpkgs/overriding.md" },
          { text: "Overlays", link: "/zh/nixpkgs/overlays.md" },
          {
            text: "多 Nixpkgs 实例的妙用",
            link: "/zh/nixpkgs/multiple-nixpkgs.md",
          },
        ],
      },
      {
        text: "Nix Store 与二进制缓存",
        items: [
          { text: "简介", link: "/zh/nix-store/intro.md" },
          {
            text: "添加二进制缓存服务器",
            link: "/zh/nix-store/add-binary-cache-servers.md",
          },
          {
            text: "搭建你自己的缓存服务器",
            link: "/zh/nix-store/host-your-own-binary-cache-server.md",
          },
        ],
      },
      {
        text: "NixOS 最佳实践",
        items: [
          { text: "简介", link: "/zh/best-practices/intro.md" },
          {
            text: "运行非 NixOS 的二进制文件",
            link: "/zh/best-practices/run-downloaded-binaries-on-nixos.md",
          },
          {
            text: "简化常用的 NixOS 相关命令",
            link: "/zh/best-practices/simplify-nixos-related-commands.md",
          },
          {
            text: "加速 Dotfiles 的调试",
            link: "/zh/best-practices/accelerating-dotfiles-debugging.md",
          },
          {
            text: "自定义 NIX_PATH 与 Flake Registry",
            link: "/zh/best-practices/nix-path-and-flake-registry.md",
          },
          {
            text: "远程部署 NixOS 配置",
            link: "/zh/best-practices/remote-deployment.md",
          },
          {
            text: "调试 Nix 软件包与 Nix 表达式",
            link: "/zh/best-practices/debugging.md",
          },
        ],
      },
      {
        text: "Flakes 的其他玩法",
        items: [
          { text: "简介", link: "/zh/other-usage-of-flakes/intro.md" },
          {
            text: "Flake Inputs",
            link: "/zh/other-usage-of-flakes/inputs.md",
          },
          {
            text: "Flake Outputs",
            link: "/zh/other-usage-of-flakes/outputs.md",
          },
          {
            text: "新一代 Nix 命令行工具的使用",
            link: "/zh/other-usage-of-flakes/the-new-cli.md",
          },
          {
            text: "模块系统与自定义 options",
            link: "/zh/other-usage-of-flakes/module-system.md",
          },
          {
            text: "[WIP]Testing",
            link: "/zh/other-usage-of-flakes/testing.md",
          },
        ],
      },
      {
        text: "在 NixOS 上进行开发工作",
        items: [
          {
            text: "nix shell, nix develop & pkgs.runCommand",
            link: "/zh/development/intro.md",
          },
          {
            text: "各语言的开发环境",
            link: "/zh/development/dev-environments.md",
          },
          {
            text: "[WIP]软件打包",
            link: "/zh/development/packaging-101.md",
          },
          {
            text: "跨平台编译",
            link: "/zh/development/cross-platform-compilation.md",
          },
          {
            text: "分布式构建",
            link: "/zh/development/distributed-building.md",
          },
          {
            text: "[WIP]内核开发",
            link: "/zh/development/kernel-development.md",
          },
        ],
      },
      {
        text: "其他进阶话题",
        items: [{ text: "其他进阶话题", link: "/zh/advanced-topics/index.md" }],
      },
      {
        text: "常见问题 FAQ",
        items: [{ text: "常见问题 FAQ", link: "/zh/faq/index.md" }],
      },
    ],
  },
})
