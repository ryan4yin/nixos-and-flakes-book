# 安装 NixOS

Nix 有多种安装方式：

1. 以包管理器的形式安装到 MacOS/Linux/WSL 三种系统上
2. 也可以直接安装 NixOS，这是 Nix 官方推出的一个 Linux 发行版，使用 Nix 包管理器来管理整个系统环境。

本书主要介绍 NixOS 与 Flakes 的使用，因此不展开讨论。

NixOS 的安装不难，与许多传统发行版类似，它提供了一个对新手非常友好的 GUI 安装程序。请移步
[NixOS-CN 的系统安装教程](https://nixos-cn.org/tutorials/installation/)
查看详细的安装步骤。

其他可能有用的参考资料：

1. [NixOS 官网](https://nixos.org/download.html)
1. [复用 flake 管理 NixOS WSL](https://zhuanlan.zhihu.com/p/627073511): 使用 WSL 的用户可以参考下这篇文章
1. [ryan4yin/nix-darwin-kickstarter](https://github.com/ryan4yin/nix-darwin-kickstart):
   macOS 用户可以通过这个模板仓库结合本书的内容来学习使用 Nix.
