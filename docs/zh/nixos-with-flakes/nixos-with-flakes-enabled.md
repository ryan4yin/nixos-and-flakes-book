# 使用 Flakes 来管理你的 NixOS

与 NixOS 当前默认的配置方式相比，Flakes 提供了更好的可复现性，同时它清晰的包结构定义原生支持了以其他 Git 仓库为依赖，便于代码分享，因此本书更建议使用 Flakes 来管理系统配置。

本节我们介绍如何使用 Flakes 来管理 NixOS 系统配置，**阅读本节内容不需要提前对 Flakes 有任何了解**。

## 启用 NixOS 的 Flakes 支持 {#enable-nix-flakes}

目前 Flakes 作为一个实验特性，仍未被默认启用，因此我们需要先手动修改
`/etc/nixos/configuration.nix` 文件，启用 Flakes 特性以及配套的船新 nix 命令行工具：

```nix{12,15}
{ config, pkgs, ... }:

{
  imports =
    [ # Include the results of the hardware scan.
      ./hardware-configuration.nix
    ];

  # ......

  # 启用 Flakes 特性以及配套的船新 nix 命令行工具
  nix.settings.experimental-features = [ "nix-command" "flakes" ];
  environment.systemPackages = with pkgs; [
    # Flakes 通过 git 命令拉取其依赖项，所以必须先安装好 git
    git
    vim
    wget
  ];
  # 将默认编辑器设置为 vim
  environment.variables.EDITOR = "vim";

  # ......
}
```

然后运行 `sudo nixos-rebuild switch` 应用修改后，即可使用 Flakes 特性来管理系统配置。

nix 的新命令行工具还提供了一些方便的功能，比如说你现在可以使用 `nix repl`
命令打开一个 nix 交互环境，有兴趣的话，可以使用它复习测试一遍前面学过的所有 Nix 语法。

## 将系统配置切换到 flake.nix {#switch-to-flake-nix}

在启用了 Flakes 特性后，`sudo nixos-rebuild switch` 命令会优先读取 `/etc/nixos/flake.nix`
文件，如果找不到再尝试使用 `/etc/nixos/configuration.nix`。

可以首先使用官方提供的模板来学习 flake 的编写，先查下有哪些模板：

```bash
nix flake show templates
```

其中有个 `templates#full` 模板展示了所有可能的用法，可以看看它的内容：

```bash
nix flake init -t templates#full
cat flake.nix
```

我们参照该模板创建文件 `/etc/nixos/flake.nix`
并编写好配置内容，后续系统的所有修改都将全部由 Nix Flakes 接管，示例内容如下：

```nix{15}
{
  description = "A simple NixOS flake";

  inputs = {
    # NixOS 官方软件源，这里使用 nixos-25.05 分支
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.05";
  };

  outputs = { self, nixpkgs, ... }@inputs: {
    # TODO 请将下面的 my-nixos 替换成你的 hostname
    nixosConfigurations.my-nixos = nixpkgs.lib.nixosSystem {
      modules = [
        # 这里导入之前我们使用的 configuration.nix，
        # 这样旧的配置文件仍然能生效
        ./configuration.nix
      ];
    };
  };
}
```

这里我们定义了一个名为 `my-nixos` 的系统，它的配置文件为 `/etc/nixos/` 文件夹下的
`./configuration.nix`，也就是说我们仍然沿用了旧的配置。

现在执行 `sudo nixos-rebuild switch`
应用配置，系统应该没有任何变化，因为我们仅仅是切换到了 Nix
Flakes，配置内容与之前还是一致的。

> 如果你的系统 Hostname 不是 `my-nixos`，你需要在 `flake.nix` 中修改 `nixosConfigurations`
> 的名称，或者使用 `--flake /etc/nixos#my-nixos` 来指定配置名称。

切换完毕后，我们就可以通过 Flakes 特性来管理系统了。

目前我们的 flake 包含这几个文件：

- `/etc/nixos/flake.nix`: flake 的入口文件，执行 `sudo nixos-rebuild switch`
  时会识别并部署它。
- `/etc/nixos/flake.lock`: 自动生成的版本锁文件，它记录了整个 flake 所有输入的数据源、hash 值、版本号，确保系统可复现。
- `/etc/nixos/configuration.nix`: 这是我们之前的配置文件，在 `flake.nix`
  中被作为模块导入，目前所有系统配置都写在此文件中。
- `/etc/nixos/hardware-configuration.nix`: 这是系统硬件配置文件，由 NixOS 生成，描述了系统的硬件信息

## 总结 {#conclusion}

本节中我们添加了一个非常简单的配置文件 `/etc/nixos/flake.nix`，它仅仅是
`/etc/nixos/configuration.nix` 的一个 thin
wrapper，它自身并没有提供任何新的功能，也没有引入任何破坏性的变更。

在本书后面的内容中，我们会学习了解 `flake.nix`
的结构与功能，并逐渐看到这样一个 wrapper 能为我们带来哪些好处。

> 注意：**本书描述的配置管理方式并非「Everything in a single
> file」，更推荐将配置内容分门别类地存放到不同的 nix 文件中**，然后在 `flake.nix` 的
> `modules`
> 参数列表中引入这些配置文件，并通过 Git 管理它们。这样做的好处是，可以更好地组织配置文件，提高配置的可维护性。后面的
> [模块化 NixOS 配置](./modularize-the-configuration.md)
> 一节将会详细介绍如何模块化你的 NixOS 配置，[其他实用技巧 - 使用 Git 管理 NixOS 配置](./other-useful-tips.md)
> 将会介绍几种使用 Git 管理 NixOS 配置的最佳实践。

[nix flake - Nix Manual]:
  https://nixos.org/manual/nix/stable/command-ref/new-cli/nix3-flake#flake-inputs
[nixpkgs/flake.nix]: https://github.com/NixOS/nixpkgs/tree/nixos-25.05/flake.nix
[nixpkgs/nixos/lib/eval-config.nix]:
  https://github.com/NixOS/nixpkgs/tree/nixos-25.05/nixos/lib/eval-config.nix
[Module System - Nixpkgs]:
  https://github.com/NixOS/nixpkgs/blob/nixos-25.05/doc/module-system/module-system.chapter.md
[nixpkgs/nixos-25.05/lib/modules.nix - _module.args]:
  https://github.com/NixOS/nixpkgs/blob/nixos-25.05/lib/modules.nix#L122-L184
[nixpkgs/nixos-25.05/nixos/doc/manual/development/option-types.section.md#L268-L275]:
  https://github.com/NixOS/nixpkgs/blob/nixos-25.05/nixos/doc/manual/development/option-types.section.md?plain=1#L268-L275
