# 进阶玩法 {#advanced-topics}

## 社区

- [Nix 社区官方页](https://nixos.org/community/): 包含官方社区、论坛、RFCs、官方团队的架构以及沟通贡献渠道等信息。
- [Nix Channel Status](https://status.nixos.org/): Nix 各 Channels 的当前的构建状态。
- [nix-community/NUR](https://github.com/nix-community/NUR):
  Nixpkgs 虽然包含了大量的软件包，但是因为审核速度、许可协议等原因，总有些包并未被及时收录。NUR 则是一个去中心化的 Nix 包 仓库，任何人都可以创建自己的私人仓库并将其加入到 NUR 中以便其他人使用。如果你想要使用 Nixpkgs 中没有的包，可以尝试在这里寻找。如果你希望将自己打的 Nix 包分享给别人，可以根据 NUR 的 README 创建并分享你自己的私人 Nix 仓库。

中文社区：

- [NixOS 中文社区](https://nixos-cn.org/): NixOS 中文社区的官方网站，有一些很不错的内容。

也可以加入中文社区的 NixOS 群组参与讨论:

- Telegram: <https://t.me/nixos_zhcn>
- Matrix: <https://matrix.to/#/#nixos_zhcn:matrix.org>

## 文档与视频

逐渐熟悉 Nix 这一套工具链后，可以进一步读一读 Nix 的三本手册以及其他社区文档，挖掘更多的玩法：

- [Eelco Dolstra - The Purely Functional Software Deployment Model - 2006](https://edolstra.github.io/pubs/phd-thesis.pdf):
  Eelco Dolstra 开创性的博士论文，介绍了 Nix 包管理器的设计思想。
- [Nix Reference Manual](https://nixos.org/manual/nix/stable/package-management/profiles.html):
  Nix 包管理器使用手册，主要包含 Nix 包管理器的设计、命令行使用说明。
- [nixpkgs Manual](https://nixos.org/manual/nixpkgs/unstable/): 主要介绍 Nixpkgs 的参数、Nix 包的使用、修改、打包方法。
- [NixOS Manual](https://nixos.org/manual/nixos/unstable/):
  NixOS 系统使用手册，主要包含 Wayland/X11, GPU 等系统级别的配置说明。
- [nix-pills](https://nixos.org/guides/nix-pills): Nix
  Pills 对如何使用 Nix 构建软件包进行了深入的阐述，写得比官方文档清晰易懂，而且也足够深入，值得一读。
- [nixos-in-production](https://github.com/Gabriella439/nixos-in-production): 这是一本介绍如何在生产环境中使用 NixOS 的书籍，目前还在编写中，不过已经有了一些很棒的内容。

另外 Youtube 上的 [NixOS Foundation](https://www.youtube.com/@NixOS-Foundation) 跟
[NixCon](https://www.youtube.com/@NixCon)
两个频道上也有很多官方视频，干货满满。如下几个视频强烈推荐一阅：

- [Summer of Nix 2022 — Public Lecture Series](https://www.youtube.com/playlist?list=PLt4-_lkyRrOMWyp5G-m_d1wtTcbBaOxZk):
  NixOS Foundation 举办的一系列公开讲座，由 Eelco Dolstra、Armijn
  Hemel 等 Nix 社区核心成员主讲，内容涵盖了 Nix 的发展历程、NixOS 的历史、Nix 的未来等多个方面，干货满满。
- [Summer of Nix 2023 — Nix Developer Dialogues](https://www.youtube.com/playlist?list=PLt4-_lkyRrOPcBuz_tjm6ZQb-6rJjU3cf):
  2023 年的 Summer of
  Nix，一系列 Nix 社区核心成员的对话，内容包含 Nixpkgs 的演进与架构方面的挑战，探索 Nix 的模块系统，讨论 Nix 生态，Nixpkgs 中的 AI 应用，Nix 在商业领域的应用与开源经济学。

另外 @NickCao 在 2021 年做的一个深入介绍 Nix 包管理器的演讲也很值得一阅：

- [金枪鱼之夜：Nix - 从构建系统到配置管理](https://www.bilibili.com/video/BV13Y411p7DS/)

## 进阶技术与社区项目

在对 Nix
Flakes 熟悉到一定程度后，你可以尝试一些 Flakes 的进阶玩法，如下是一些比较流行的社区项目，可以试用：

- [flake-parts](https://github.com/hercules-ci/flake-parts): 通过 Module 模块系统简化配置的编写与维护。
- [flake-utils-plus](https://github.com/gytis-ivaskevicius/flake-utils-plus):同样是用于简化 Flake 配置的第三方包，不过貌似更强大些
- ......

以及其他许多实用的社区项目可探索：

- [nix-output-monitor](https://github.com/maralorn/nix-output-monitor): 美化 `nix build`
  命令的输出日志，同时打印出更详细的日志信息，以及构建计时器等额外信息，强烈推荐使用！
- [agenix](https://github.com/ryantm/agenix): secrets 管理工具
- [nixos-generator](https://github.com/nix-community/nixos-generators): 镜像生成工具，从 nixos 配置生成 iso/qcow2 等格式的镜像
- [lanzaboote](https://github.com/nix-community/lanzaboote): 启用 secure boot
- [impermanence](https://github.com/nix-community/impermanence): 用于配置无状态系统。可用它持久化你指定的文件或文件夹，同时再将 /home 目录挂载为 tmpfs 或者每次启动时用工具擦除一遍。这样所有不受 impermanence 管理的数据都将成为临时数据，如果它们导致了任何问题，重启下系统这些数据就全部还原到初始状态了！
- [colmena](https://github.com/zhaofengli/colmena): NixOS 主机部署工具
- [devbox](https://github.com/jetpack-io/devbox): 一个基于 Nix 的轻量级开发环境管理工具，类似 earthly，目标是统一开发环境与部署环境，使得开发环境与部署环境一致
- [nixpak](https://github.com/nixpak/nixpak): 一个使用沙箱运行任何 Nix 应用程序的工具（包括 GUI 应用程序），提升系统安全性
- [nixpacks](https://github.com/railwayapp/nixpacks): 一个将任何代码自动打包为 OCI 容器镜像的工具，类似 buildpacks
- ...

想了解更多内容，可以看看 [awesome-nix](https://github.com/nix-community/awesome-nix).
