# `flake.nix` 配置详解 {#flake-nix-configuration-explained}

上面我们创建了一个 `flake.nix`
文件并通过它来管理系统配置，但你对它的结构还是一头雾水，下面我们来详细解释一下这个文件的内容。

### 1. flake inputs

首先看看其中的 `inputs` 属性，它是一个 attribute
set，其中定义了这个 flake 的所有依赖项，这些依赖项会在被拉取后，作为参数传递给 `outputs`
函数：

```nix{2-5,7}
{
  inputs = {
    # NixOS 官方软件源，这里使用 nixos-25.05 分支
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.05";
  };

  outputs = { self, nixpkgs, ... }@inputs: {
    # 省略掉前面的配置......
  };
}
```

`inputs`
中的每一项依赖有许多类型与定义方式，可以是另一个 flake，也可以是一个普通的 Git 仓库，又或者一个本地路径。
[Flakes 的其他玩法 - Flake 的 inputs](../other-usage-of-flakes/inputs.md)
中详细介绍了常见的依赖项类型与定义方式。

这里我们只定义了 `nixpkgs` 这一个依赖项，使用的是 flake 中最常见的引用方式，即
`github:owner/name/reference`，这里的 `reference` 可以是分支名、commit-id 或 tag。

`nixpkgs` 在 `inputs` 中被定义后，就可以在后面的 `outputs`
函数的参数中使用此依赖项中的内容了，我们的示例中正是这么干的。

### 2. flake outputs

再来看看 `outputs`，它是一个以 `inputs`
中的依赖项为参数的函数，函数的返回值是一个 attribute set，这个返回的 attribute
set 即为该 flake 的构建结果：

```nix{9-16}
{
  description = "A simple NixOS flake";

  inputs = {
    # NixOS 官方软件源，这里使用 nixos-25.05 分支
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.05";
  };

  outputs = { self, nixpkgs, ... }@inputs: {
    # hostname 为 my-nixos 的主机会使用这个配置
    nixosConfigurations.my-nixos = nixpkgs.lib.nixosSystem {
      modules = [
        ./configuration.nix
      ];
    };
  };
}
```

flake 有很多的用途，也可以有很多不同类型的 outputs，[Flake 的 outputs](../other-usage-of-flakes/outputs.md)
一节有更详细的介绍。这里我们只用到了 `nixosConfigurations`
这一类型的 outputs，它用于配置 NixOS 系统。

在我们运行 `sudo nixos-rebuild switch` 命令时，它会从 `/etc/nixos/flake.nix` 的 `outputs`
函数返回值中查找 `nixosConfigurations.my-nixos` （其中的 `my-nixos`
将会是你当前系统的 hostname）这一属性，并使用其中的定义来配置你的 NixOS 系统。

实际我们也可以自定义 flake 的位置与 NixOS 配置的名称，而不是使用默认值。只需要在
`nixos-rebuild` 命令后面添加 `--flake` 参数即可，一个例子：

```nix
sudo nixos-rebuild switch --flake /path/to/your/flake#your-hostname
```

上述命令中的 `--flake /path/to/your/flake#your-hostname` 参数简要说明如下：

1. `/path/to/your/flake` 为目标 flake 的位置，默认会使用 `/etc/nixos/` 这个路径。
2. `#` 是一个分隔符，其后的 `your-hostname` 则是 NixOS 配置的名称。`nixos-rebuild`
   默认会以你当前系统的 hostname 为配置名称进行查找。

你甚至能直接引用一个远程的 GitHub 仓库作为你的 flake 来源，示例如下：

```nix
sudo nixos-rebuild switch --flake github:owner/repo#your-hostname
```

### 3. `outputs` 函数的特殊参数 `self` {#special-parameter-self-of-outputs-function}

虽然我们前面并未提到，但是前面的所有示例代码中，`outputs` 函数都还有一个特殊的参数
`self`，这里我们简单介绍一下它的作用。

[nix flake - Nix Manual] 对其的描述是：

> The special input named `self` refers to the outputs and source tree of this flake.

所以说 `self` 是当前 flake 的 `outputs`
函数的返回值，同时也是当前 flake 源码的文件夹路径（source tree）。

这里我们并未使用到 `self`
这个参数，在后面一些更复杂的例子（或者你网上搜到的一些配置）中，我们会看到 `self` 的用法。

> 注意：你可能会在一些代码中看到，有人会使用 `self.outputs`
> 来引用当前 flake 的输出，这确实是可行的，但 Nix
> Manual 并未对其做任何说明，属于是 flake 的内部实现细节，不建议在你自己的代码中使用！

### 4. `nixpkgs.lib.nixosSystem` 函数的简单介绍 {#simple-introduction-to-nixpkgs-lib-nixos-system}

**一个 Flake 可以依赖其他 Flakes，从而使用它们提供的功能**。

默认情况下，一个 flake 会在其每个依赖项（即 `inputs` 中的每一项）的根目录下寻找
`flake.nix` 文件并**懒惰求值**（lazy evaluation）它们的 `outputs`
函数，接着将这些函数返回的 attribute sets 作为参数传递给它自身的 `outputs`
函数，这样我们就能在当前 flake 中使用它所依赖的其他 flakes 提供的功能了。

更精确地说，对每个依赖项的 `outputs` 函数的求值都是懒惰（lazy）的，也就是说，一个 flake 的
`outputs` 函数只有在被真正使用到的时候才会被求值，这样就能避免不必要的计算，从而提高效率。

上面的描述可能有点绕，我们还是结合本节中使用的 `flake.nix` 示例来看看这个过程。我们的
`flake.nix` 声明了 `inputs.nixpkgs` 这个依赖项，因此 [nixpkgs/flake.nix] 会在我们执行
`sudo nixos-rebuild switch` 这个命令时被求值。从 Nixpkgs 仓库的源码中能看到它的 flake
outputs 定义中有返回 `lib` 这个属性，我们的例子中就使用了 `lib` 属性中的 `nixosSystem`
这个函数来配置我们的 NixOS 系统：

```nix{8-12}
{
  inputs = {
    # NixOS 官方软件源，这里使用 nixos-25.05 分支
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.05";
  };

  outputs = { self, nixpkgs, ... }@inputs: {
    nixosConfigurations.my-nixos = nixpkgs.lib.nixosSystem {
      modules = [
        ./configuration.nix
      ];
    };
  };
}
```

`nixpkgs.lib.nixosSystem` 后面跟的 attribute
set 就是该函数的参数，我们这里只设置了两个参数：

1. `system`: 这个很好懂，就是系统架构参数。
2. `modules`: 它是一个 modules 的列表，NixOS 的实际系统配置都定义在这些 modules 中。

`/etc/nixos/configuration.nix` 这个配置文件本身就是一个 Nixpkgs
Module，因此可以直接将其添加到 `modules` 列表中使用。

新手阶段了解这些就足够了，探究 `nixpkgs.lib.nixosSystem`
函数的具体实现需要对 Nixpkgs 的模块系统有一定的了解。读者可以在学习了
[模块化 NixOS 配置](./modularize-the-configuration.md) 一节后，再回过头来从
[nixpkgs/flake.nix] 中找到 `nixpkgs.lib.nixosSystem`
的定义，跟踪它的源码，研究其实现方式。

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
