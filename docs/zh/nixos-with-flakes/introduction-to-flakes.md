# Flakes 简介

Flakes 实验特性是 Nix 项目的一项重大进展，它引入了一种管理 Nix 表达式之间的依赖关系的策略，提高了 Nix 生态系统中的可复现性、可组合性和可用性。虽然 Flakes 仍然是一个试验性的功能，但已经被 Nix 社区广泛采用。[^1]

Flakes 特性是 Nix 项目中最有意义的变化之一。[^2]

简单的说，如果你写过点 JavaScript/Go/Rust/Python，那你应该对
`package.json`/`go.mod`/`Cargo.toml`/`pyproject.toml`
这些文件不陌生，在这些编程语言中，这些文件用来描述软件包之间的依赖关系，以及如何构建项目。同样的，这些编程语言的包管理器还通过
`package-lock.json`/`go.sum`/`Cargo.lock`/`poetry.lock`
这些文件来锁定依赖的版本，以保证项目的可复现性。

Flakes 就是从上述这类编程语言的包管理器中借鉴了这种描述依赖关系与锁定依赖版本的思路，以提高 Nix 生态系统中的可复现性、可组合性和可用性。

Flakes 提供了 `flake.nix`，它类似
`package.json`，用来描述 Nix 包之间的依赖关系，以及如何构建项目。同时它还提供了
`flake.lock`，这是一个类似 `package-lock.json`
的文件，用来锁定依赖的版本，以保证项目的可复现性。

另一方面，Flakes 实验特性并没有破坏 Nix 用户层面的原有设计，它新引入的
`flake.nix`/`flake.lock`
两个文件只是其他 Nix 配置的一个 Wrapper，在后面的章节的学习中我们将会看到，Flakes 特性是在 Nix 原有设计的基础上提供了一种新的、更方便的管理 Nix 表达式之间的依赖关系的方式。

## 注意事项 <Badge type="danger" text="caution" />

Flakes 带来的好处是显而易见的，整个 NixOS 社区都很喜欢它，目前超过半数的用户已经在大量使用 Flakes[^3]，因此我们可以相当确定 Flakes 不会被废弃。

:warning:但是 Flakes 目前仍然存在一些问题，因此在将它推向稳定的过程中，Nix 可能会引入一些不兼容的改动，这个改动的大小目前还无法确定。

总的来说，我仍然推荐大家使用 Flakes，毕竟这本书本身也是围绕 NixOS 与 Flakes 编写的，但是也要做好准备——未来可能需要解决一些不兼容变更带来的问题。

## Flakes 何时会成为稳定特性？ {#when-will-flakes-stabilized}

我深入了解了下 Flakes 现状与未来计划相关的资料，大概有这些：

- [[RFC 0136] A Plan to Stabilize Flakes and the New CLI Incrementally](https://github.com/NixOS/rfcs/pull/136): 一份渐进式地将 Flakes 与 new
  CLI 两个实验性特性推向稳定的 RFC，已 Merge.
- [CLI stabilization effort](https://github.com/NixOS/nix/issues/7701): 一份追踪 New
  CLI 稳定化工作进度的 Issue.
- [Why are flakes still experimental? - NixOS Discourse](https://discourse.nixos.org/t/why-are-flakes-still-experimental/29317): 最近的一次关于 Flakes 稳定性的讨论，可以看到大家的疑惑，以及社区对 Flakes 的态度。
- [Flakes are such an obviously good thing - Graham Christensen](https://grahamc.com/blog/flakes-are-an-obviously-good-thing/):
  NixOS 社区成员的文章，记录了他对 Flakes 的看法，以及对社区当初添加 Flakes 特性时的不当举措的懊悔。
- [ teaching Nix 3 CLI and Flakes #281 - nix.dev](https://github.com/NixOS/nix.dev/issues/281): 社区关于是否应该在 NixOS 官方文档中介绍 Flakes 的讨论，当前结论是官方文档不应该推广使用 unstable 功能。

读完上述内容后，个人猜测，**Flakes 有可能（仅是可能）会在未来两年内成为稳定特性**。

## Nix 的新 CLI 与旧的 CLI {#the-new-cli-and-the-classic-cli}

Nix 于 2020 年推出了 `nix-command` & `flakes`
两个实验特性，它们提供了全新的命令行工具（即 New
CLI）、标准的 Nix 包结构定义（即 Flakes 特性）、类似 cargo/npm 的 `flake.lock`
版本锁文件等等。这两个特性极大地增强了 Nix 的能力，因此虽然至今（2024/2/1）它们仍然是实验性特性，但是已经被 Nix 社区广泛使用。

当前 Nix 的 New CLI（即 `nix-command`
实验特性） 与 Flakes 实验特性是强绑定的关系，虽然现在已经有明确的拆分计划正在推进中了，但要用 Flakes 基本上就必须得用 New
CLI. 而本书作为一本 NixOS & Flakes 新手指南，就有必要介绍下 Flakes 实验特性所依赖的 New
CLI 与旧的 CLI 的区别。

这里列举下在启用了 New CLI 与 Flakes(`nix-command` &
`flakes`) 实验特性后，已经不需要用到的旧的 Nix 命令行工具与相关概念。在查找资料时，如果看到它们直接忽略掉就行（`nix-collect-garbage`
除外，该命令目前暂无替代）：

1. `nix-channel`: 与 apt/yum/pacman 等其他 Linux 发行版的包管理工具类似，`nix-channel`
   通过 stable/unstable channels（如 apt/yum/管理诸如 nixpkgs 等 `inputs`
   的版本。传统上，这为 Nix 语言提供了 `<nixpkgs>` 的引用来源。
   1. 在 Flakes 中，`nix-channel`
      的功能被 Flake 注册表（`nix registry`）取代，用于为交互式命令行（例如
      `nix run nixpkgs#hello`）提供「全局的默认 nixpkgs」。当使用 `flake.nix` 时，`inputs`
      的版本由 flake 自己管理。
   2. Flakes 通过 `flake.nix` 中的 `inputs` 部分管理每个 Flake 中 nixpkgs 及其他 `inputs`
      的版本，而非依赖全局状态。
2. `nix-env`: 用于管理用户环境的软件包，是传统 Nix 的核心命令行工具。它从 `nix-channel`
   定义的数据源中安装软件包，所以安装的软件包版本受 channel 影响。
   1. 通过 `nix-env`
      安装的包不会被自动记录到 Nix 的声明式配置中，是完全脱离掌控的，无法在其他主机上复现，且升级由
      `nix-env` 安装的包时可能因未保存属性名产生不可预测的结果，因此不推荐使用。
   2. New CLI 中对应的命令为 `nix profile`，我个人不太推荐初学者直接尝试它.
3. `nix-shell`: nix-shell 用于创建一个临时的 shell 环境
   1. 这玩意儿可能有点复杂了，因此在 New CLI 中它被拆分成了三个子命令 `nix develop`,
      `nix shell` 以及
      `nix run`，我们会在「[构建开发环境](../development/intro.md)」一章详细介绍这三个命令。
4. `nix-build`: 用于构建 Nix 包，它会将构建结果放到 `/nix/store`
   路径下，但是不会记录到 Nix 的声明式配置中。
   1. 在 New CLI 中对应的命令为 `nix build`
5. `nix-collect-garbage`: 垃圾回收指令，用于清理 `/nix/store` 中未被使用的 Store Objects.
   1. 在 New CLI 中有个相似的指令
      `nix store gc --debug`，但它不会清理 profile 生成的历史版本，因此此命令暂无替代。
6. 以及其他使用地较少的命令，就不一一列出了.
   1. 详细的命令对比列表可以看看
      [Try to explain nix commands](https://qiita-com.translate.goog/Sumi-Sumi/items/6de9ee7aab10bc0dbead?_x_tr_sl=auto&_x_tr_tl=en&_x_tr_hl=en)

[^1]: [Flakes - NixOS Wiki](https://wiki.nixos.org/wiki/Flakes)

[^2]:
    [Flakes are such an obviously good thing](https://grahamc.com/blog/flakes-are-an-obviously-good-thing/)

[^3]:
    [Draft: 1 year roadmap - NixOS Foundation](https://web.archive.org/web/20250317120825/https://nixos-foundation.notion.site/1-year-roadmap-0dc5c2ec265a477ea65c549cd5e568a9)
