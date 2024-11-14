import { defineConfig } from "vitepress"

export const en = defineConfig({
  lang: "en-US",
  title: "NixOS & Flakes Book",
  description: "An unofficial and opinionated book for beginners",

  themeConfig: {
    nav: [
      { text: "Home", link: "/" },
      { text: "Preface", link: "/preface.md" },
      { text: "Get Started", link: "/introduction/index.md" },
      { text: "Best Practices", link: "/best-practices/intro.md" },
    ],
    sidebar: [
      {
        text: "Preface",
        items: [{ text: "Preface", link: "/preface.md" }],
      },
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
            text: "NixOS with Flakes Enabled",
            link: "/nixos-with-flakes/nixos-with-flakes-enabled.md",
          },
          {
            text: "NixOS's flake.nix Explained",
            link: "/nixos-with-flakes/nixos-flake-configuration-explained.md",
          },
          {
            text: "The combination ability of Flakes and Nixpkgs module system",
            link: "/nixos-with-flakes/nixos-flake-and-module-system.md",
          },
          {
            text: "Getting Started with Home Manager",
            link: "/nixos-with-flakes/start-using-home-manager.md",
          },
          {
            text: "Modularize the Configuration",
            link: "/nixos-with-flakes/modularize-the-configuration.md",
          },
          {
            text: "Updating the System",
            link: "/nixos-with-flakes/update-the-system.md",
          },
          {
            text: "Downgrading or Upgrading Packages",
            link: "/nixos-with-flakes/downgrade-or-upgrade-packages.md",
          },
          {
            text: "Other useful Tips",
            link: "/nixos-with-flakes/other-useful-tips.md",
          },
        ],
      },
      {
        text: "Nixpkgs's Advanced Usage",
        items: [
          { text: "Introduction", link: "/nixpkgs/intro.md" },
          { text: "callPackage", link: "/nixpkgs/callpackage.md" },
          { text: "Overriding", link: "/nixpkgs/overriding.md" },
          { text: "Overlays", link: "/nixpkgs/overlays.md" },
          {
            text: "Multiple Nixpkgs Instances",
            link: "/nixpkgs/multiple-nixpkgs.md",
          },
        ],
      },
      {
        text: "Nix Store & Binary Cache",
        items: [
          { text: "Introduction", link: "/nix-store/intro.md" },
          {
            text: "Add Binary Cache Servers",
            link: "/nix-store/add-binary-cache-servers.md",
          },
          {
            text: "Host Your Own Binary Cache Server",
            link: "/nix-store/host-your-own-binary-cache-server.md",
          },
        ],
      },
      {
        text: "Best Practices",
        items: [
          { text: "Introduction", link: "/best-practices/intro.md" },
          {
            text: "Run downloaded binaries on NixOS",
            link: "/best-practices/run-downloaded-binaries-on-nixos.md",
          },
          {
            text: "Simplify NixOS-related Commands",
            link: "/best-practices/simplify-nixos-related-commands.md",
          },
          {
            text: "Accelerating Dotfiles Debugging",
            link: "/best-practices/accelerating-dotfiles-debugging.md",
          },
          {
            text: "Custom NIX_PATH and Flake Registry",
            link: "/best-practices/nix-path-and-flake-registry.md",
          },
          {
            text: "Remote Deployment",
            link: "/best-practices/remote-deployment.md",
          },
          {
            text: "Debugging Derivations and Nix Expressions",
            link: "/best-practices/debugging.md",
          },
        ],
      },

      {
        text: "Other Usage of Flakes",
        items: [
          { text: "Introduction", link: "/other-usage-of-flakes/intro.md" },
          {
            text: "Flake Inputs",
            link: "/other-usage-of-flakes/inputs.md",
          },
          {
            text: "Flake Outputs",
            link: "/other-usage-of-flakes/outputs.md",
          },
          {
            text: "The New CLI",
            link: "/other-usage-of-flakes/the-new-cli.md",
          },
          {
            text: "Module System & Custom Options",
            link: "/other-usage-of-flakes/module-system.md",
          },
          {
            text: "[WIP]Testing",
            link: "/other-usage-of-flakes/testing.md",
          },
        ],
      },
      {
        text: "Dev Environments on NixOS",
        items: [
          {
            text: "nix shell, nix develop & pkgs.runCommand",
            link: "/development/intro.md",
          },
          {
            text: "Dev Environments",
            link: "/development/dev-environments.md",
          },
          {
            text: "[WIP]Packaging 101",
            link: "/development/packaging-101.md",
          },
          {
            text: "Cross-platform Compilation",
            link: "/development/cross-platform-compilation.md",
          },
          {
            text: "Distributed Building",
            link: "/development/distributed-building.md",
          },
          {
            text: "[WIP]Kernel Development",
            link: "/development/kernel-development.md",
          },
        ],
      },
      {
        text: "Advanced Topics",
        items: [{ text: "Advanced Topics", link: "/advanced-topics/index.md" }],
      },
      {
        text: "Frequently Asked Questions",
        items: [{ text: "Frequently Asked Questions", link: "/faq/index.md" }],
      },
    ],
  },
})
