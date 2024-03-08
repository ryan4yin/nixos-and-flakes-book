# 使用 Flakes 来管理你的 NixOS

## 启用 NixOS 的 Flakes 支持 {#enable-nix-flakes}

与 NixOS 当前默认的配置方式相比，Flakes 提供了更好的可复现性，同时它清晰的包结构定义原生支持了以其他 Git 仓库为依赖，便于代码分享，因此本书更建议使用 Flakes 来管理系统配置。

目前 Flakes 作为一个实验特性，仍未被默认启用，我们需要手动修改 `/etc/nixos/configuration.nix` 文件，启用 Flakes 特性以及配套的船新 nix 命令行工具：

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
    curl
  ];
  # 将默认编辑器设置为 vim
  environment.variables.EDITOR = "vim";

  # ......
}
```

然后运行 `sudo nixos-rebuild switch` 应用修改后，即可使用 Flakes 特性来管理系统配置。

nix 的新命令行工具还提供了一些方便的功能，比如说你现在可以使用 `nix repl` 命令打开一个 nix 交互环境，有兴趣的话，可以使用它复习测试一遍前面学过的所有 Nix 语法。

## 将系统配置切换到 flake.nix {#switch-to-flake-nix}

在启用了 Flakes 特性后，`sudo nixos-rebuild switch` 命令会优先读取 `/etc/nixos/flake.nix` 文件，如果找不到再尝试使用 `/etc/nixos/configuration.nix`。

可以首先使用官方提供的模板来学习 flake 的编写，先查下有哪些模板：

```bash
nix flake show templates
```

其中有个 `templates#full` 模板展示了所有可能的用法，可以看看它的内容：

```bash
nix flake init -t templates#full
cat flake.nix
```

我们参照该模板创建文件 `/etc/nixos/flake.nix` 并编写好配置内容，后续系统的所有修改都将全部由 Nix Flakes 接管，示例内容如下：

```nix{16}
{
  description = "A simple NixOS flake";

  inputs = {
    # NixOS 官方软件源，这里使用 nixos-23.11 分支
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-23.11";
  };

  outputs = { self, nixpkgs, ... }@inputs: {
    # 因此请将下面的 my-nixos 替换成你的主机名称
    nixosConfigurations.my-nixos = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";
      modules = [
        # 这里导入之前我们使用的 configuration.nix，
        # 这样旧的配置文件仍然能生效
        ./configuration.nix
      ];
    };
  };
}
```

这里我们定义了一个名为 `my-nixos` 的系统，它的配置文件为 `/etc/nixos/` 文件夹下的 `./configuration.nix`，也就是说我们仍然沿用了旧的配置。

现在执行 `sudo nixos-rebuild switch` 应用配置，系统应该没有任何变化，因为我们仅仅是切换到了 Nix Flakes，配置内容与之前还是一致的。

切换完毕后，我们就可以通过 Flakes 特性来管理系统了。

目前我们的 flake 包含这几个文件：

- `/etc/nixos/flake.nix`: flake 的入口文件，执行 `sudo nixos-rebuild switch` 时会识别并部署它。
- `/etc/nixos/flake.lock`: 自动生成的版本锁文件，它记录了整个 flake 所有输入的数据源、hash 值、版本号，确保系统可复现。
- `/etc/nixos/configuration.nix`: 这是我们之前的配置文件，在 `flake.nix` 中被作为模块导入，目前所有系统配置都写在此文件中。
- `/etc/nixos/hardware-configuration.nix`: 这是系统硬件配置文件，由 NixOS 生成，描述了系统的硬件信息

到这里为止， `/etc/nixos/flake.nix` 仅仅是 `/etc/nixos/configuration.nix` 的一个 thin wrapper，它自身并没有提供任何新的功能，也没有引入任何破坏性的变更。
在本书后面的内容中，我们会逐渐看到这样一个 wrapper 带来了哪些好处。

> 注意：**本书描述的配置管理方式并非「Everything in a single file」，更推荐将配置内容分门别类地存放到不同的 nix 文件中**，然后在 `flake.nix` 的 `modules` 参数列表中引入这些配置文件，并通过 Git 管理它们。
> 这样做的好处是，可以更好地组织配置文件，提高配置的可维护性。后面的 [模块化 NixOS 配置](./modularize-the-configuration.md) 一节将会详细介绍如何模块化你的 NixOS 配置，[其他实用技巧 - 使用 Git 管理 NixOS 配置](./other-useful-tips.md) 将会介绍几种使用 Git 管理 NixOS 配置的最佳实践。

## `flake.nix` 配置详解 {#flake-nix-configuration-explained}

上面我们创建了一个 `flake.nix` 文件并通过它来管理系统配置，
但你对它的结构还是一头雾水，
下面我们来详细解释一下这个文件的内容。

### 1. flake inputs

首先看看其中的 `inputs` 属性，它是一个 attribute set，其中定义了这个 flake 的所有依赖项，这些依赖项会在被拉取后，作为参数传递给 `outputs` 函数：

```nix{2-5,7}
{
  inputs = {
    # NixOS 官方软件源，这里使用 nixos-23.11 分支
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-23.11";
  };

  outputs = { self, nixpkgs, ... }@inputs: {
    # 省略掉前面的配置......
  };
}
```

`inputs` 中的每一项依赖有许多类型与定义方式，可以是另一个 flake，也可以是一个普通的 Git 仓库，又或者一个本地路径。
[Flakes 的其他玩法 - Flake 的 inputs](../other-usage-of-flakes/inputs.md) 中详细介绍了常见的依赖项类型与定义方式。

这里我们只定义了 `nixpkgs` 这一个依赖项，使用的是 flake 中最常见的引用方式，即 `github:owner/name/reference`，这里的 `reference` 可以是分支名、commit-id 或 tag。

`nixpkgs` 在 `inputs` 中被定义后，就可以在后面的 `outputs` 函数的参数中使用此依赖项中的内容了，我们的示例中正是这么干的。

### 2. flake outputs

再来看看 `outputs`，它是一个以 `inputs` 中的依赖项为参数的函数，函数的返回值是一个 attribute set，这个返回的 attribute set 即为该 flake 的构建结果：

```nix{10-18}
{
  description = "A simple NixOS flake";

  inputs = {
    # NixOS 官方软件源，这里使用 nixos-23.11 分支
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-23.11";
  };

  # 这里的 `self` 是个特殊参数，它指向 `outputs` 函数返回的 attribute set 自身，即自引用
  outputs = { self, nixpkgs, ... }@inputs: {
    # hostname 为 my-nixos 的主机会使用这个配置
    nixosConfigurations.my-nixos = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";
      modules = [
        ./configuration.nix
      ];
    };
  };
}
```

flake 有很多的用途，也可以有很多不同类型的 outputs，[Flake 的 outputs](../other-usage-of-flakes/outputs.md) 一节有更详细的介绍。
这里我们只用到了 `nixosConfigurations` 这一类型的 outputs，它用于配置 NixOS 系统。

在我们运行 `sudo nixos-rebuild switch` 命令时，它会从 `/etc/nixos/flake.nix` 的 `outputs` 函数返回值中查找 `nixosConfigurations.my-nixos` （其中的 `my-nixos` 将会是你当前系统的 hostname）这一属性，并使用其中的定义来配置你的 NixOS 系统。

实际我们也可以自定义 flake 的位置与 NixOS 配置的名称，而不是使用默认值。
只需要在 `nixos-rebuild` 命令后面添加 `--flake` 参数即可，一个例子：

```nix
sudo nixos-rebuild switch --flake /path/to/your/flake#your-hostname
```

上述命令中的 `--flake /path/to/your/flake#your-hostname` 参数简要说明如下：

1. `/path/to/your/flake` 为目标 flake 的位置，默认会使用 `/etc/nixos/` 这个路径。
2. `#` 是一个分隔符，其后的 `your-hostname` 则是 NixOS 配置的名称。`nixos-rebuild` 默认会以你当前系统的 hostname 为配置名称进行查找。

你甚至能直接引用一个远程的 GitHub 仓库作为你的 flake 来源，示例如下：

```nix
sudo nixos-rebuild switch --flake github:owner/repo#your-hostname
```

### 3. `nixpkgs.lib.nixosSystem` 函数的简单介绍 {#simple-introduction-to-nixpkgs-lib-nixos-system}

默认情况下，flake 会在其每个依赖项的根目录下寻找 `flake.nix` 文件并执行它的 `outputs` 函数，并将该函数返回的 attribute set 作为参数传递给它自身的 `outputs` 函数，这样我们就能在 outputs 中使用各依赖项提供的内容了。

在我们这一节的例子中，[nixpkgs/flake.nix] 会在我们执行 `sudo nixos-rebuild swtich` 时被执行，我们能从其源码中看到它 outputs 的定义中有 `lib` 这个属性，我们的例子中就使用了 `lib` 属性中的 `nixosSystem` 这个函数：

```nix{8-13}
{
  inputs = {
    # NixOS 官方软件源，这里使用 nixos-23.11 分支
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-23.11";
  };

  outputs = { self, nixpkgs, ... }@inputs: {
    nixosConfigurations.my-nixos = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";
      modules = [
        ./configuration.nix
      ];
    };
  };
}
```

`nixpkgs.lib.nixosSystem` 后面跟的 attribute set 就是该函数的参数，我们这里只设置了两个参数：

1. `system`: 这个很好懂，就是系统架构参数。
2. `modules`: 此函数是一个 modules 的列表，NixOS 的实际系统配置都定义在这些 modules 中。

`/etc/nixos/configuration.nix` 这个配置文件本身就是一个 Nixpkgs Module，因此可以直接将其添加到 `modules` 列表中使用。

新手阶段了解这些就足够了，探究 `nixpkgs.lib.nixosSystem` 函数的具体实现需要对 Nixpkgs 的模块系统有一定的了解。
读者可以在学习了 [模块化 NixOS 配置](./modularize-the-configuration.md) 一节后，再回过头来从 [nixpkgs/flake.nix] 中找到 `nixpkgs.lib.nixosSystem` 的定义，跟踪它的源码，研究其实现方式。


## Nixpkgs Module 结构的简单介绍 {#simple-introduction-to-nixpkgs-module-structure}

> 在后面的 [模块化 NixOS 配置](./modularize-the-configuration.md) 一节中会详细介绍这套模块系统的工作方式，这里只介绍些基础知识。

为什么 `/etc/nixos/configuration.nix` 这个配置文件会符合 Nixpkgs Module 定义，从而能直接在 `flake.nix` 中引用它呢？
可能会有读者觉得这有点出乎意料。

这实际是因为 Nixpkgs 中包含了大量 NixOS 的实现源码，这些源码大都使用 Nix 语言编写。
为了编写维护如此多的 Nix 代码，并且使用户能灵活地自定义其 NixOS 系统的各项功能，就必须要有一套 Nix 代码的模块化系统。

这套 Nix 代码的模块系统的实现也同样在 Nixpkgs 仓库中，它主要被用于 NixOS 系统配置的模块化，但也有其他的应用，比如 nix-darwin 跟 home-manager 都大量使用了这套模块系统。

既然 NixOS 是基于这套模块系统构建的，那它的配置文件（包括 `/etc/nixos/configuration.nix`）是一个 Nixpkgs Module，也就显得非常自然了。

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
   - 入门阶段可以认为它的默认值为 `nixpkgs.legacyPackages."${system}"`，可通过 `nixpkgs.pkgs` 这个 option 来自定义 pkgs 的值
5. `modulesPath`: 一个只在 NixOS 中可用的参数，是一个 Path，指向 [nixpkgs/nixos/modules](https://github.com/NixOS/nixpkgs/tree/nixos-23.11/nixos/modules)
   - 它在 [nixpkgs/nixos/lib/eval-config-minimal.nix#L43](https://github.com/NixOS/nixpkgs/blob/nixos-23.11/nixos/lib/eval-config-minimal.nix#L43) 中被定义
   - 通常被用于导入一些额外的 NixOS 模块，NixOS 自动生成的 `hardware-configuration.nix` 中基本都能看到它

## 传递非默认参数到模块系统中 {#pass-non-default-parameters-to-submodules}

而如果你需要将其他非默认参数传递到子模块，就需要使用一些特殊手段手动指定这些非默认参数。

Nixpkgs 的模块系统提供了两种方式来传递非默认参数：

1. `nixpkgs.lib.nixosSystem` 函数的 `specialArgs` 参数
1. 在任一 Module 中使用 `_module.args` 这个 option 来传递参数

这两个参数的官方文档藏得很深，而且语焉不详、晦涩难懂。读者感兴趣的话我把链接放在这里：

1. `specialArgs`: NixOS Manual 跟 Nixpkgs Manual 中分别有与它有关的只言片语
   - Nixpkgs Manual: [Module System - Nixpkgs]
   - NixOS Manual: [nixpkgs/nixos-23.11/nixos/doc/manual/development/option-types.section.md#L237-L244]
1. `_module.args`: 它唯一的官方文档在如下这份源码中
   - [nixpkgs/nixos-23.11/lib/modules.nix - _module.args]

总之，`specialArgs` 与 `_module.args` 需要的值都是一个 attribute set，它们的功能也相同，都是将其 attribute set 中的所有参数传递到所有子模块中。
这两者的区别在于：

1. 在任何 Module 中都能使用 `_module.args` 这个 option，通过它互相传递参数，这要比只能在 `nixpkgs.lib.nixosSystem` 函数中使用的 `specialArgs` 更灵活。
1. `_module.args` 是在 Module 中声明使用的，因此必须在所有 Modules 都已经被求值后，才能使用它。这导致**如果你在 `imports = [ ... ];` 中使用 `_module.args` 传递的参数，会报错 `infinite recursion`，这种场景下你必须改用 `specialArgs` 才行**。

NixOS 社区比较推荐优先使用 `_module.args` 这个 options，仅在无法使用 `_module.args` 时才改用 `specialArgs`。

假设你想将某个依赖项传递到子模块中使用，可以使用 `specialArgs` 参数将 `inputs` 传递到所有子模块中：

```nix{13}
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-23.11";
    another-input.url = "github:username/repo-name/branch-name";
  };

  outputs = inputs@{ self, nixpkgs, another-input, ... }: {
    nixosConfigurations.my-nixos = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";

      # 将所有 inputs 参数设为所有子模块的特殊参数，
      # 这样就能直接在子模块中使用 inputs 中的所有依赖项了
      specialArgs = { inheirt inputs;};
      modules = [
        ./configuration.nix
      ];
    };
  };
}
```

或者使用 `_module.args` 这个 option 也能达成同样的效果：

```nix{15}
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-23.11";
    another-input.url = "github:username/repo-name/branch-name";
  };

  outputs = inputs@{ self, nixpkgs, another-input, ... }: {
    nixosConfigurations.my-nixos = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";
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

选择上述两种方式之一修改你的配置，然后在 `/etc/nixos/configuration.nix` 中就可以使用 `inputs` 这个参数了，模块系统会自动匹配到 `specialArgs` 中定义的 `inputs`，并将其注入到所有需要该参数的子模块中：

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

## 从其他 flake 来源安装系统软件 {#install-system-packages-from-other-flakes}

管系统最常见的需求就是装软件，我们在上一节已经见识过如何通过 `environment.systemPackages` 来安装 `pkgs` 中的包，这些包都来自官方的 nixpkgs 仓库。

现在我们学习下如何安装其他 flake 来源的软件包，这比直接从 nixpkgs 安装要灵活很多，最主要的用途是安装 Nixpkgs 中还未添加或未更新的某软件的最新版本。

以 [helix](https://github.com/helix-editor/helix) 编辑器为例，这里演示下如何直接编译安装 helix 的 master 分支。

首先在 `flake.nix` 中添加 helix 这个 inputs 数据源：

```nix{6,12,18}
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-23.11";

    # helix editor, use the master branch
    helix.url = "github:helix-editor/helix/master";
  };

  outputs = inputs@{ self, nixpkgs, ... }: {
    nixosConfigurations.my-nixos = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";
      specialArgs = { inheirt inputs;};
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
    curl
    # 这里从 helix 这个 inputs 数据源安装了 helix 程序
    inputs.helix.packages."${pkgs.system}".helix
  ];
  # 省略其他配置......
}
```

改好后再 `sudo nixos-rebuild switch` 部署，就能安装好 Helix 程序了。
这次部署用时会比以往长挺多，因为 Nix 会从源码编译整个 Helix 程序。

部署完毕后，可直接在终端使用 `hx` 命令测试验证。

> 如果你在部署配置时遇到了任何错误，都可以尝试在 `nixos-rebuild` 命令后面添加 `--show-trace -L` 参数来获取详细的错误信息。

另外，如果你只是想尝试一下 Helix 的最新版本，再决定要不要真正地将它安装到系统里，有更简单的办法，一行命令就行（但如前所述，源码编译会很费时间）：

```bash
nix run github:helix-editor/helix/master
```

我们会在后面的 [新一代 Nix 命令行工具的使用](../other-usage-of-flakes/the-new-cli.md) 中详细介绍 `nix run` 的用法。

## 使用其他 Flakes 包提供的功能

其实这才是 Flakes 最主要的功能，一个 Flake 可以依赖其他 Flakes，从而使用它们提供的功能——就如同我们在写 TypeScript/Go/Rust 等程序时使用其他 Library 提供的功能一样。

上面使用 Helix 的官方 Flake 中提供的最新版本就是一个例子，其他更多的用例会在后面提到，这里引用几个后面会讲的例子：

- [Getting Started with Home Manager](./start-using-home-manager.md): 这里引入了社区的 Home-Manager 作为依赖项，从而能直接使用该 Flake 提供的功能。
- [Downgrading or Upgrading Packages](./downgrade-or-upgrade-packages.md): 这里引入了不同版本的 Nixpkgs 作为依赖项，从而能很灵活地选用不同版本的 Nixpkgs 中的包。


[nixpkgs/flake.nix]: https://github.com/NixOS/nixpkgs/tree/nixos-23.11/flake.nix
[nixpkgs/nixos/lib/eval-config.nix]: https://github.com/NixOS/nixpkgs/tree/nixos-23.11/nixos/lib/eval-config.nix
[Module System - Nixpkgs]: https://github.com/NixOS/nixpkgs/blob/23.11/doc/module-system/module-system.chapter.md
[nixpkgs/nixos-23.11/lib/modules.nix - _module.args]: https://github.com/NixOS/nixpkgs/blob/nixos-23.11/lib/modules.nix#L122-L184
[nixpkgs/nixos-23.11/nixos/doc/manual/development/option-types.section.md#L237-L244]: https://github.com/NixOS/nixpkgs/blob/nixos-23.11/nixos/doc/manual/development/option-types.section.md?plain=1#L237-L244
