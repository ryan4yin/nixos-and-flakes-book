
前面介绍的 override 函数都会生成新的 Derivation，不影响 pkgs 中原有的 Derivation，只适合作为局部参数使用。
但如果你需要覆写的 Derivation 还被其他 Nix 包所依赖，那其他 Nix 包使用的仍然会是原有的 Derivation.

为了解决这个问题，Nix 提供了 overlays 能力。简单的说，Overlays 可以全局修改 pkgs 中的 Derivation。

在旧的 Nix 环境中，Nix 默认会自动应用 `~/.config/nixpkgs/overlays.nix` `~/.config/nixpkgs/overlays/*.nix` 这类路径下的所有 overlays 配置。

但是在 Flakes 中，为了确保系统的可复现性，它不能依赖任何 Git 仓库之外的配置，所以这种旧的方法就不能用了。

在使用 Nix Flakes 编写 NixOS 配置时，Home Manager 与 NixOS 都提供了 `nixpkgs.overlays` 这个 option 来引入 overlays, 相关文档：

- [home-manager docs - `nixpkgs.overlays`](https://nix-community.github.io/home-manager/options.html#opt-nixpkgs.overlays)
- [nixpkgs source code - `nixpkgs.overlays`](https://github.com/NixOS/nixpkgs/blob/30d7dd7e7f2cba9c105a6906ae2c9ed419e02f17/nixos/modules/misc/nixpkgs.nix#L169)

举个例子，如下内容就是一个加载 Overlays 的 Module，它既可以用做 Home Manager Module，也可以用做 NixOS Module，因为这俩定义完全是一致的：

> 不过我使用发现，Home Manager 毕竟是个外部组件，而且现在全都用的 unstable 分支，这导致 Home Manager Module 有时候会有点小毛病，因此更建议以 NixOS Module 的形式引入 overlays

```nix
{ config, pkgs, lib, ... }:

{
  nixpkgs.overlays = [
    # overlayer1 - 参数名用 self 与 super，表达继承关系
    (self: super: {
     google-chrome = super.google-chrome.override {
       commandLineArgs =
         "--proxy-server='https=127.0.0.1:3128;http=127.0.0.1:3128'";
     };
    })

    # overlayer2 - 还可以使用 extend 来继承其他 overlay
    # 这里改用 final 与 prev，表达新旧关系
    (final: prev: {
      steam = prev.steam.override {
        extraPkgs = pkgs:
          with pkgs; [
            keyutils
            libkrb5
            libpng
            libpulseaudio
            libvorbis
            stdenv.cc.cc.lib
            xorg.libXcursor
            xorg.libXi
            xorg.libXinerama
            xorg.libXScrnSaver
          ];
        extraProfile = "export GDK_SCALE=2";
      };
    })

    # overlay3 - 也可以将 overlay 定义在其他文件中
    # 这里 overlay3.nix 中的内容格式与上面的一致，都是 `final: prev: { xxx = prev.xxx.override { ... }; }`
    (import ./overlays/overlay3.nix)
  ];
}
```

这里只是个示例配置，参照此格式编写你自己的 overlays 配置，将该配置作为 NixOS Module 或者 Home Manager Module 引入，然后部署就可以看到效果了。

## 模块化 overlays 配置

上面的例子说明了如何编写 overlays，但是所有 overlays 都一股脑儿写在一起，就有点难以维护了，写得多了自然就希望模块化管理这些 overlays.

这里介绍下我找到的一个 overlays 模块化管理的最佳实践。

首先在 Git 仓库中创建 `overlays` 文件夹用于存放所有 overlays 配置，然后创建 `overlays/default.nix`，其内容如下：

```nix
args:
  # import 当前文件夹下所有的 nix 文件，并以 args 为参数执行它们
  # 返回值是一个所有执行结果的列表，也就是 overlays 的列表
  builtins.map
  (f: (import (./. + "/${f}") args))  # map 的第一个参数，是一个 import 并执行 nix 文件的函数
  (builtins.filter          # map 的第二个参数，它返回一个当前文件夹下除 default.nix 外所有 nix 文件的列表
    (f: f != "default.nix")
    (builtins.attrNames (builtins.readDir ./.)))
```

后续所有 overlays 配置都添加到 `overlays` 文件夹中，一个示例配置 `overlays/fcitx5/default.nix` 内容如下：

```nix
# 为了不使用默认的 rime-data，改用我自定义的小鹤音形数据，这里需要 override
# 参考 https://github.com/NixOS/nixpkgs/blob/e4246ae1e7f78b7087dce9c9da10d28d3725025f/pkgs/tools/inputmethods/fcitx5/fcitx5-rime.nix
{pkgs, config, lib, ...}:

(self: super: {
  # 小鹤音形配置，配置来自 flypy.com 官方网盘的鼠须管配置压缩包「小鹤音形“鼠须管”for macOS.zip」
  rime-data = ./rime-data-flypy;
  fcitx5-rime = super.fcitx5-rime.override { rimeDataPkgs = [ ./rime-data-flypy ]; };
})
```

我通过上面这个 overlays 修改了 fcitx5-rime 输入法的默认数据，加载了我自定义的小鹤音形输入法。

最后，还需要通过 `nixpkgs.overlays` 这个 option 加载 `overlays/default.nix` 返回的所有 overlays 配置，在任一 NixOS Module 中添加如下参数即可：

```nix
{ config, pkgs, lib, ... } @ args:

{
  # ......

  # 添加此参数
  nixpkgs.overlays = import /path/to/overlays/dir;

  # ......
}
```

比如说直接写 `flake.nix` 里：

```nix
{
  description = "NixOS configuration of Ryan Yin";

  # ......

  inputs = {
    # ......
  };

  outputs = inputs@{ self, nixpkgs, ... }: {
    nixosConfigurations = {
      nixos-test = nixpkgs.lib.nixosSystem {
        system = "x86_64-linux";
        specialArgs = inputs;
        modules = [
          ./hosts/nixos-test

          # 添加如下内嵌 module 定义
          #   这里将 modules 的所有参数 args 都传递到了 overlays 中
          (args: { nixpkgs.overlays = import ./overlays args; })

          # ......
        ];
      };
    };
  };
}
```

按照上述方法进行配置，就可以很方便地模块化管理所有 overlays 配置了，以我的配置为例，overlays 文件夹的结构大致如下：

```nix
.
├── flake.lock
├── flake.nix
├── home
├── hosts
├── modules
├── ......
├── overlays
│   ├── default.nix         # 它返回一个所有 overlays 的列表
│   └── fcitx5              # fcitx5 overlay
│       ├── default.nix
│       ├── README.md
│       └── rime-data-flypy  # 自定义的 rime-data，需要遵循它的文件夹格式
│           └── share
│               └── rime-data
│                   ├── ......  # rime-data 文件
└── README.md
```

你可以在我的配置仓库 [ryan4yin/nix-config/v0.0.4](https://github.com/ryan4yin/nix-config/tree/v0.0.4) 查看更详细的内容，获取些灵感。


## 参考

- [Chapter 3. Overlays - nixpkgs Manual](https://nixos.org/manual/nixpkgs/stable/#chap-overlays)