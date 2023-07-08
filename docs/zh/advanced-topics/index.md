# 进阶玩法 {#advanced-topics}

逐渐熟悉 Nix 这一套工具链后，可以进一步读一读 Nix 的三本手册以及其他社区文档，挖掘更多的玩法：

- [Nix Reference Manual](https://nixos.org/manual/nix/stable/package-management/profiles.html): Nix 包管理器使用手册，主要包含 Nix 包管理器的设计、命令行使用说明。
- [nixpkgs Manual](https://nixos.org/manual/nixpkgs/unstable/): 主要介绍 Nixpkgs 的参数、Nix 包的使用、修改、打包方法。
- [NixOS Manual](https://nixos.org/manual/nixos/unstable/): NixOS 系统使用手册，主要包含 Wayland/X11, GPU 等系统级别的配置说明。
- [nix-pills](https://nixos.org/guides/nix-pills): Nix Pills 对如何使用 Nix 构建软件包进行了深入的阐述，写得比官方文档清晰易懂，而且也足够深入，值得一读。
- [nixos-in-production](https://github.com/Gabriella439/nixos-in-production): 这是一本介绍如何在生产环境中使用 NixOS 的书籍，目前还在编写中，不过已经有了一些很棒的内容。

在对 Nix Flakes 熟悉到一定程度后，你可以尝试一些 Flakes 的进阶玩法，如下是一些比较流行的社区项目，可以试用：

- [flake-parts](https://github.com/hercules-ci/flake-parts): 通过 Module 模块系统简化配置的编写与维护。
- [flake-utils-plus](https://github.com/gytis-ivaskevicius/flake-utils-plus):同样是用于简化 Flake 配置的第三方包，不过貌似更强大些
- [digga][digga]: 一个大而全的 Flake 模板，揉合了各种实用 Nix 工具包的功能，不过结构比较复杂，需要一定经验才能玩得转。
- ......

以及其他许多实用的社区项目可探索，我比较关注的有这几个：

- [nixpak](https://github.com/nixpak/nixpak): 一个使用沙箱运行任何 Nix 应用程序的工具（包括 GUI 应用程序），提升系统安全性
- [nix-output-monitor](https://github.com/maralorn/nix-output-monitor): 美化 `nix build` 命令的输出日志，同时打印出更详细的日志信息，以及构建计时器等额外信息，强烈推荐使用！
- [agenix](https://github.com/ryantm/agenix): secrets 管理工具
- [nixos-generator](https://github.com/nix-community/nixos-generators): 镜像生成工具，从 nixos 配置生成 iso/qcow2 等格式的镜像
- [lanzaboote](https://github.com/nix-community/lanzaboote): 启用 secure boot
- [impermanence](https://github.com/nix-community/impermanence): 用于配置无状态系统。可用它持久化你指定的文件或文件夹，同时再将 /home 目录挂载为 tmpfs 或者每次启动时用工具擦除一遍。这样所有不受 impermanence 管理的数据都将成为临时数据，如果它们导致了任何问题，重启下系统这些数据就全部还原到初始状态了！
- [colmena](https://github.com/zhaofengli/colmena): NixOS 主机部署工具
- ...

想了解更多内容，可以看看 [awesome-nix](https://github.com/nix-community/).

[digga]: https://github.com/divnix/digga
