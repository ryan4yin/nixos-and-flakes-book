Nix 有多种安装方式：

1. 以包管理器的形式安装到 MacOS/Linux/WSL 三种系统上
2. 也可以直接安装 NixOS，这是 Nix 官方推出的一个 Linux 发行版，使用 Nix 包管理器来管理整个系统环境。

我选择了直接使用 NixOS 的 ISO 镜像安装 NixOS 系统，从而最大程度上通过 Nix 管理整个系统环境。

安装步骤很简单，这里不多介绍，仅列一下我觉得比较有用的参考资料：

1. 国内镜像源：<https://mirrors.bfsu.edu.cn/help/nix/>
1. [Nix 的官方安装方式](https://nixos.org/download.html): 使用 bash 脚本编写, 目前（2023-04-23）为止 `nix-command` & `flakes` 仍然是实验性特性，需要手动开启。
   1. 你需要参照 [Enable flakes - NixOS Wiki](https://nixos.wiki/wiki/Flakes) 的说明启用 `nix-command` & `flakes`
   2. 官方不提供任何卸载手段，要在 Linux/MacOS 上卸载 Nix，你需要手动删除所有相关的文件、用户以及用户组
2. [The Determinate Nix Installer](https://github.com/DeterminateSystems/nix-installer): 第三方使用 Rust 编写的 installer, 默认启用 `nix-command` & `flakes`，并且提供了卸载命令。
