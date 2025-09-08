# Flakes 的组合能力与 Nixpkgs Module 系统

## Nixpkgs Module 结构的简单介绍 {#simple-introduction-to-nixpkgs-module-structure}

> 在后面的 [模块化 NixOS 配置](./modularize-the-configuration.md)
> 一节中会详细介绍这套模块系统的工作方式，这里只介绍些基础知识。

为什么 `/etc/nixos/configuration.nix` 这个配置文件会符合 Nixpkgs Module 定义，从而能直接在
`flake.nix` 中引用它呢？可能会有读者觉得这有点出乎意料。

要理解这一点，我们得先了解下 Nixpkgs 模块系统的由来以及它的用途。

NixOS 的所有实现代码都存放在
[Nixpkgs/nixos](https://github.com/NixOS/nixpkgs/tree/master/nixos)
目录中，这些源码大都使用 Nix 语言编写。为了编写维护如此多的 Nix 代码，并且使用户能灵活地自定义其 NixOS 系统的各项功能，就必须要有一套 Nix 代码的模块化系统。

这套 Nix 代码的模块系统的实现也同样存放在 Nixpkgs 仓库中，它主要被用于 NixOS 系统配置的模块化，但也有其他的应用，比如 nix-darwin 跟 home-manager 都大量使用了这套模块系统。

既然 NixOS 是基于这套模块系统构建的，那它的配置文件（包括
`/etc/nixos/configuration.nix`）是一个 Nixpkgs Module，也就显得非常自然了。

在学习后面的内容之前，我们需要先简单了解下这套模块系统的工作方式。

一个简化的 Nixpkgs Module 结构如下：

```nix
{lib, config, options, pkgs, ...}:
{
  # 导入其他 Modules
  imports = [
    # ......
    # ./xxx.nix
  ];

  for.bar.enable = true;
  # other options declarations
  # ...
}
```

可以看到它的定义实际是一个 Nix 函数，该函数有 5 个**由模块系统自动生成、自动注入、无需额外声明的参数**：

1. `lib`: **nixpkgs 自带的函数库，提供了许多操作 Nix 表达式的实用函数**
   - 详见 <https://nixos.org/manual/nixpkgs/stable/#id-1.4>
2. `config`: 包含了当前环境中所有 option 的值，在后面学习模块系统时会大量使用它
3. `options`: 当前环境中所有 Modules 中定义的所有 options 的集合
4. `pkgs`: **一个包含所有 nixpkgs 包的集合，它也提供了许多相关的工具函数**
   - 入门阶段可以认为它的默认值为 `nixpkgs.legacyPackages."${system}"`，可通过
     `nixpkgs.pkgs` 这个 option 来自定义 `pkgs` 的值
5. `modulesPath`: 一个只在 NixOS 中可用的参数，是一个 Path，指向
   [nixpkgs/nixos/modules](https://github.com/NixOS/nixpkgs/tree/nixos-25.05/nixos/modules)
   - 它在
     [nixpkgs/nixos/lib/eval-config-minimal.nix#L43](https://github.com/NixOS/nixpkgs/blob/nixos-25.05/nixos/lib/eval-config-minimal.nix#L43)
     中被定义
   - 通常被用于导入一些额外的 NixOS 模块，NixOS 自动生成的 `hardware-configuration.nix`
     中基本都能看到它

## 传递非默认参数到模块系统中 {#pass-non-default-parameters-to-submodules}

而如果你需要将其他非默认参数传递到子模块，就需要使用一些特殊手段手动指定这些非默认参数。

Nixpkgs 的模块系统提供了两种方式来传递非默认参数：

1. `nixpkgs.lib.nixosSystem` 函数的 `specialArgs` 参数
1. 在任一 Module 中使用 `_module.args` 这个 option 来传递参数

这两个参数的官方文档藏得很深，而且语焉不详、晦涩难懂。读者感兴趣的话我把链接放在这里：

1. `specialArgs`: NixOS Manual 跟 Nixpkgs Manual 中分别有与它有关的只言片语
   - Nixpkgs Manual: [Module System - Nixpkgs]
   - NixOS Manual:
     [nixpkgs/nixos-25.05/nixos/doc/manual/development/option-types.section.md#L268-L275]
1. `_module.args`:
   - NixOS Manual:
     [Appendix A. Configuration Options](https://nixos.org/manual/nixos/stable/options#opt-_module.args)
   - Source Code: [nixpkgs/nixos-25.05/lib/modules.nix - _module.args]

总之，`specialArgs` 与 `_module.args` 需要的值都是一个 attribute
set，它们的功能也相同，都是将其 attribute
set 中的所有参数传递到所有子模块中。这两者的区别在于：

1. 在任何 Module 中都能使用 `_module.args` 这个 option，通过它互相传递参数，这要比只能在
   `nixpkgs.lib.nixosSystem` 函数中使用的 `specialArgs` 更灵活。
1. `_module.args`
   是在 Module 中声明使用的，因此必须在所有 Modules 都已经被求值后，才能使用它。这导致**如果你在
   `imports = [ ... ];` 中使用 `_module.args` 传递的参数，会报错
   `infinite recursion`，这种场景下你必须改用 `specialArgs` 才行**。

我个人更喜欢 `specialArgs`，因为它更简单直接，用起来顺手些，另外 `_xxx`
这种命名风格就让人感觉它是个内部用的东西，不太适合用在用户配置文件中。

假设你想将某个依赖项传递到子模块中使用，可以使用 `specialArgs` 参数将 `inputs`
传递到所有子模块中：

```nix{11}
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.05";
    another-input.url = "github:username/repo-name/branch-name";
  };

  outputs = inputs@{ self, nixpkgs, another-input, ... }: {
    nixosConfigurations.my-nixos = nixpkgs.lib.nixosSystem {
      # 将所有 inputs 参数设为所有子模块的特殊参数，
      # 这样就能直接在子模块中使用 inputs 中的所有依赖项了
      specialArgs = { inherit inputs;};
      modules = [
        ./configuration.nix
      ];
    };
  };
}
```

或者使用 `_module.args` 这个 option 也能达成同样的效果：

```nix{14}
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.05";
    another-input.url = "github:username/repo-name/branch-name";
  };

  outputs = inputs@{ self, nixpkgs, another-input, ... }: {
    nixosConfigurations.my-nixos = nixpkgs.lib.nixosSystem {
      modules = [
        ./configuration.nix
        {
          # 将所有 inputs 参数设为所有子模块的特殊参数，
          # 这样就能直接在子模块中使用 inputs 中的所有依赖项了
          _module.args = { inherit inputs; };
        }
      ];
    };
  };
}
```

选择上述两种方式之一修改你的配置，然后在 `/etc/nixos/configuration.nix` 中就可以使用
`inputs` 这个参数了，模块系统会自动匹配到 `specialArgs` 中定义的
`inputs`，并将其注入到所有需要该参数的子模块中：

```nix{3}
# Nix 会通过名称匹配，
# 自动将 specialArgs/_module.args 中的 inputs 注入到此函数的第三个参数
{ config, pkgs, inputs, ... }:

# 然后我们就能在这下面使用 inputs 这个参数了
{
  # ......
}
```

下一节将演示如何使用 `specialArgs`/`_module.args` 来从其他 flake 来源安装系统软件。

## 从其他 flakes 安装系统软件 {#install-system-packages-from-other-flakes}

管系统最常见的需求就是装软件，我们在上一节已经见识过如何通过 `environment.systemPackages`
来安装 `pkgs` 中的包，这些包都来自官方的 nixpkgs 仓库。

现在我们学习下如何安装其他 flake 来源的软件包，这比直接从 nixpkgs 安装要灵活很多，最主要的用途是安装 Nixpkgs 中还未添加或未更新的某软件的最新版本。

以 [helix](https://github.com/helix-editor/helix)
编辑器为例，这里演示下如何直接编译安装 helix 的 master 分支。

首先在 `flake.nix` 中添加 helix 这个 inputs 数据源：

```nix{6,11,17}
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.05";

    # helix editor, use the master branch
    helix.url = "github:helix-editor/helix/master";
  };

  outputs = inputs@{ self, nixpkgs, ... }: {
    nixosConfigurations.my-nixos = nixpkgs.lib.nixosSystem {
      specialArgs = { inherit inputs;};
      modules = [
        ./configuration.nix

        # 如下 Module 与前面的 `specialArgs` 参数功能完全一致
        # 选择其中一种即可
        # { _module.args = { inherit inputs; };}
      ];

    };
  };
}
```

接下来在 `configuration.nix` 中就能引用这个 flake input 数据源了：

```nix{1,10}
{ config, pkgs, inputs, ... }:
{
  # 省略无关配置......
  environment.systemPackages = with pkgs; [
    git
    vim
    wget
    # 这里从 helix 这个 inputs 数据源安装了 helix 程序
    inputs.helix.packages."${pkgs.system}".helix
  ];
  # 省略其他配置......
}
```

改好后再 `sudo nixos-rebuild switch`
部署，就能安装好 Helix 程序了。这次部署用时会比以往长挺多，因为 Nix 会从源码编译整个 Helix 程序。

部署完毕后，可直接在终端使用 `hx` 命令测试验证。

另外，如果你只是想尝试一下 Helix 的最新版本，再决定要不要真正地将它安装到系统里，有更简单的办法，一行命令就行（但如前所述，源码编译会很费时间）：

```bash
nix run github:helix-editor/helix/master
```

我们会在后面的 [新一代 Nix 命令行工具的使用](../other-usage-of-flakes/the-new-cli.md)
中详细介绍 `nix run` 的用法。

## 使用其他 Flakes 包提供的功能

其实这才是 Flakes 最主要的功能，一个 Flake 可以依赖其他 Flakes，从而使用它们提供的功能——就如同我们在写 TypeScript/Go/Rust 等程序时使用其他 Library 提供的功能一样。

上面使用 Helix 的官方 Flake 中提供的最新版本就是一个例子，其他更多的用例会在后面提到，这里引用几个后面会讲的例子：

- [Getting Started with Home Manager](./start-using-home-manager.md): 这里引入了社区的 Home-Manager 作为依赖项，从而能直接使用该 Flake 提供的功能。
- [Downgrading or Upgrading Packages](./downgrade-or-upgrade-packages.md): 这里引入了不同版本的 Nixpkgs 作为依赖项，从而能很灵活地选用不同版本的 Nixpkgs 中的包。

## 其他 Flakes 学习资料

到此为止，我们已经学习了如何使用 Flakes 来配置 NixOS 系统。如果你对 Flakes 还有更多的疑问，或者想深入学习，请直接参考如下官方/半官方的文档。

- Nix Flakes 的官方文档：
  - [Nix flakes - Nix Manual](https://nixos.org/manual/nix/stable/command-ref/new-cli/nix3-flake)
  - [Flakes - nix.dev](https://nix.dev/concepts/flakes)
- Eelco Dolstra （Nix 的创造者）的一系列关于 Flakes 的文章：
  - [Nix Flakes, Part 1: An introduction and tutorial (Eelco Dolstra, 2020)](https://www.tweag.io/blog/2020-05-25-flakes/)
  - [Nix Flakes, Part 2: Evaluation caching (Eelco Dolstra, 2020)](https://www.tweag.io/blog/2020-06-25-eval-cache/)
  - [Nix Flakes, Part 3: Managing NixOS systems (Eelco Dolstra, 2020)](https://www.tweag.io/blog/2020-07-31-nixos-flakes/)
- 其他可能有用的文档：
  - [Practical Nix Flakes](https://serokell.io/blog/practical-nix-flakes)

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
