## Flakes 简介

Flakes 实验特性是 Nix 项目的一项重大进展，它引入了一种管理 Nix 表达式之间的依赖关系的策略，提高了 Nix 生态系统中的可复现性、可组合性和可用性。
虽然 Flakes 仍然是一个试验性的功能，但已经被 Nix 社区广泛采用。[^1]

Flakes 特性是 Nix 项目中最有意义的变化之一。[^2]

## 注意事项

Flakes 带来的好处是显而易见的，整个 NixOS 社区都很喜欢它，目前超过半数的用户已经在大量使用 Flakes[^3]，因此我们基本可以确定 Flakes 绝对不会被废弃。

但是 Flakes 目前仍然存在许多问题，将它推向稳定的过程中，Nix 很可能会引入一些不兼容的改动，这个改动的大小目前还无法确定。

因此总的来说，我仍然推荐大家使用 Flakes，这本书本身也是围绕 NixOS 与 Flakes 编写的，但是也要做好准备——未来可能需要解决一些不兼容变更带来的问题。

## Flakes 与传统的 Nix

Nix 于 2020 年推出了 `nix-command` & `flakes` 两个新特性，它们提供了全新的命令行工具、标准的 Nix 包结构定义、类似 cargo/npm 的 `flake.lock` 版本锁文件等等。这两个特性极大地增强了 Nix 的能力，因此虽然至今（2023/5/5）它们仍然是实验性特性，但是已经被 Nix 社区广泛使用。

但由于 `nix-command` & `flakes` 仍然是实验性特性，官方文档基本不包含任何介绍它们的内容，同时社区关于 Flakes 的文档也相当分散且不完整。
但是从可复现、易于管理维护的角度讲，旧的 Nix 包结构与命令行工具已经不推荐使用了，因此本书也不会介绍旧的 Nix 包结构与命令行工具的使用方法，也建议新手直接忽略掉这些旧的内容，从 `nix-command` & `flakes` 学起。

这里列举下在 `nix-command` & `flakes` 中已经不需要用到的旧的 Nix 命令行工具与相关概念，在查找资料时，如果看到它们直接忽略掉就行：

1. `nix-channel`: 与 apt/yum/pacman 等其他 Linux 发行版的包管理工具类似，传统的 Nix 也以 stable/unstable/test 等 channel 的形式来管理软件包的版本，可通过此命令修改 Nix 的 channel 信息。
   1. Nix Flakes 在 `flake.nix` 中通过 `inputs` 声明依赖包的数据源，通过 `flake.lock` 锁定依赖版本，完全取代掉了 `nix-channel` 的功能。
2. `nix-env`: 用于管理用户环境的软件包，是传统 Nix 的核心命令行工具。它从 `nix-channel` 定义的数据源中安装软件包，所以安装的软件包版本受 channel 影响。
   1. 通过 `nix-env` 安装的包不会被自动记录到 Nix 的声明式配置中，是完全脱离掌控的，无法在其他主机上复现，因此不推荐使用。
   2. 在 Nix Flakes 中对应的命令为 `nix profile`，此命令也同样不推荐使用。
3. `nix-shell`: nix-shell 用于创建一个临时的 shell 环境
   1. 在 Nix Flakes 中它被 `nix develop` 与 `nix shell` 取代了。
4. `nix-build`: 用于构建 Nix 包，它会将构建结果放到 `/nix/store` 路径下，但是不会记录到 Nix 的声明式配置中。
   1. 在 Nix Flakes 中对应的命令为 `nix build`
5. ...

> 可能也就 `nix-env -qa` 这个命令偶尔还会有些用了，它返回当前系统下安装的所有软件包。

## Flakes 何时会成为稳定特性？ {#when-will-flakes-stablized}

我深入了解了下 Flakes 现状与未来计划相关的资料，大概有这些：

- [[RFC 0136] A plan to stabilize Flakes and the new CLI incrementally](https://github.com/NixOS/rfcs/pull/136): 一份渐进式地将 Flakes 与 new CLI 两个实验性特性推向稳定的 RFC，目前还在讨论中。
- [Why are flakes still experimental? - NixOS Discourse](https://discourse.nixos.org/t/why-are-flakes-still-experimental/29317): 最近的一次关于 Flakes 稳定性的讨论，可以看到大家的疑惑，以及社区对 Flakes 的态度。
- [Flakes are such an obviously good thing - Graham Christensen](https://grahamc.com/blog/flakes-are-an-obviously-good-thing/): NixOS 社区成员的文章，记录了他对 Flakes 的看法，以及对社区当初添加 Flakes 特性时的不当举措的懊悔。
- [Draft: 1 year roadmap - NixOS Foundation](https://nixos-foundation.notion.site/1-year-roadmap-0dc5c2ec265a477ea65c549cd5e568a9): NixOS Fundation 的一份 Roadmap，其中提到了 Flakes 的计划：`Stabilize flakes and release Nix 3.0. Flakes are widely used (there are more GitHub repos being created with a flake.nix than a default.nix) but they’re still marked as experimental, which is not a good situation. The same applies to the new nix CLI.`

读完上述内容后，个人猜测，**Flakes 可能会在未来一两年内成为稳定特性**。


[^1]: [Flakes - NixOS Wiki](https://nixos.wiki/index.php?title=Flakes)

[^2]: [Flakes are such an obviously good thing](https://grahamc.com/blog/flakes-are-an-obviously-good-thing/)

[^3]: [Draft: 1 year roadmap - NixOS Foundation](https://nixos-foundation.notion.site/1-year-roadmap-0dc5c2ec265a477ea65c549cd5e568a9)
