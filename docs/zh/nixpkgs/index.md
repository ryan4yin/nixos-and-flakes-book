
## 八、Nixpkgs 的高级用法 {#nixpkgs-advanced-usage}

callPackage、Overriding 与 Overlays 是在使用 Nix 时偶尔会用到的技术，它们都是用来自定义 Nix 包的构建方法的。

我们知道许多程序都有大量构建参数需要配置，不同的用户会希望使用不同的构建参数，这时候就需要 Overriding 与 Overlays 来实现。我举几个我遇到过的例子：

1. [fcitx5-rime.nix](https://github.com/NixOS/nixpkgs/blob/e4246ae1e7f78b7087dce9c9da10d28d3725025f/pkgs/tools/inputmethods/fcitx5/fcitx5-rime.nix): fcitx5-rime 的 `rimeDataPkgs` 默认使用 `rime-data` 包，但是也可以通过 override 来自定义该参数的值，以加载自定义的 rime 配置（比如加载小鹤音形输入法配置）。
2. [vscode/with-extensions.nix](https://github.com/NixOS/nixpkgs/blob/master/pkgs/applications/editors/vscode/with-extensions.nix): vscode 的这个包也可以通过 override 来自定义 `vscodeExtensions` 参数的值来安装自定义插件。
   1. [nix-vscode-extensions](https://github.com/nix-community/nix-vscode-extensions): 就是利用该参数实现的 vscode 插件管理
3. [firefox/common.nix](https://github.com/NixOS/nixpkgs/blob/416ffcd08f1f16211130cd9571f74322e98ecef6/pkgs/applications/networking/browsers/firefox/common.nix): firefox 同样有许多可自定义的参数
4. 等等

总之如果需要自定义上述这类 Nix 包的构建参数，或者实施某些比较底层的修改，我们就得用到 Overriding 跟 Overlays。

### 1. pkgs.callPackage {#callpackage}

> [Chapter 13. Callpackage Design Pattern - Nix Pills](https://nixos.org/guides/nix-pills/callpackage-design-pattern.html)

前面我们介绍并大量使用了 `import xxx.nix` 来导入 Nix 文件，这种语法只是单纯地返回该文件的执行结果，不会对该结果进行进一步处理。
比如说 `xxx.nix` 的内容是形如 `{...}: {...}`，那么 `import xxx.nix` 的结果就是该文件中定义的这个函数。

`pkgs.callPackage` 也是用来导入 Nix 文件的，它的语法是 `pkgs.callPackage xxx.nix { ... }`. 但跟 `import` 不同的是，它导入的 nix 文件内容必须是一个 Derivation 或者返回 Derivation 的函数，它的执行结果一定是一个 Derivation，也就是一个软件包。

那可以作为 `pkgs.callPackge` 参数的 nix 文件具体长啥样呢，可以去看看我们前面举例过的 `hello.nix` `fcitx5-rime.nix` `vscode/with-extensions.nix` `firefox/common.nix`，它们都可以被 `pkgs.callPackage` 导入。

当 `pkgs.callPackge xxx.nix {...}` 中的 `xxx.nix`，其内容为一个函数时（绝大多数 nix 包都是如此），执行流程如下：

1. `pkgs.callPackge xxx.nix {...}` 会先 `import xxx.nix`，得到其中定义的函数，该函数的参数通常会有 `lib`, `stdenv`, `fetchurl` 等参数，以及一些自定义参数，自定义参数通常都有默认值。
2. 接着 `pkgs.callPackge` 会首先从当前环境中查找名称匹配的值，作为将要传递给前述函数的参数。像 `lib` `stdenv` `fetchurl` 这些都是 nixpkgs 中的函数，在这一步就会查找到它们。
3. 接着 `pkgs.callPackge` 会将其第二个参数 `{...}` 与前一步得到的参数集（attribute set）进行合并，得到一个新的参数列表，然后将其传递给该函数并执行。
4. 函数执行结果是一个 Derivation，也就是一个软件包。

这个函数比较常见的用途是用来导入一些自定义的 Nix 包，比如说我们自己写了一个 `hello.nix`，然后就可以在任意 Nix Module 中使用 `pkgs.callPackage ./hello.nix {}` 来导入并使用它。

### 2. Overriding {#overriding}

> [Chapter 4. Overriding - nixpkgs Manual](https://nixos.org/manual/nixpkgs/stable/#chap-overrides)

简单的说，所有 nixpkgs 中的 Nix 包都可以通过 `<pkg>.override {}` 来自定义某些构建参数，它返回一个使用了自定义参数的新 Derivation. 举个例子：

```nix
pkgs.fcitx5-rime.override {rimeDataPkgs = [
    ./rime-data-flypy
];}
```

上面这个 Nix 表达式的执行结果就是一个新的 Derivation，它的 `rimeDataPkgs` 参数被覆盖为 `[./rime-data-flypy]`，而其他参数则沿用原来的值。

如何知道 `fcitx5-rime` 这个包有哪些参数可以覆写呢？有几种方法：

1. 直接在 GitHub 的 nixpkgs 源码中找：[fcitx5-rime.nix](https://github.com/NixOS/nixpkgs/blob/e4246ae1e7f78b7087dce9c9da10d28d3725025f/pkgs/tools/inputmethods/fcitx5/fcitx5-rime.nix)
   1. 注意要选择正确的分支，加入你用的是 nixos-unstable 分支，那就要在 nixos-unstable 分支中找。
2. 通过 `nix repl` 交互式查看：`nix repl '<nixpkgs>'`，然后输入 `:e pkgs.fcitx5-rime`，会通过编辑器打开这个包的源码，然后就可以看到这个包的所有参数了。

通过上述两种方法，都可以看到 `fcitx5-rime` 这个包拥有如下输入参数，它们都是可以通过 `override` 修改的：

```nix
{ lib, stdenv
, fetchFromGitHub
, pkg-config
, cmake
, extra-cmake-modules
, gettext
, fcitx5
, librime
, rime-data
, symlinkJoin
, rimeDataPkgs ? [ rime-data ]
}:

stdenv.mkDerivation rec {
  ...
}
```

除了覆写参数，还可以通过 `overrideAttrs` 来覆写使用 `stdenv.mkDerivation` 构建的 Derivation 的属性。
以 `pkgs.hello` 为例，首先通过前述方法查看这个包的源码：

```nix
# https://github.com/NixOS/nixpkgs/blob/nixos-unstable/pkgs/applications/misc/hello/default.nix
{ callPackage
, lib
, stdenv
, fetchurl
, nixos
, testers
, hello
}:

stdenv.mkDerivation (finalAttrs: {
  pname = "hello";
  version = "2.12.1";

  src = fetchurl {
    url = "mirror://gnu/hello/hello-${finalAttrs.version}.tar.gz";
    sha256 = "sha256-jZkUKv2SV28wsM18tCqNxoCZmLxdYH2Idh9RLibH2yA=";
  };

  doCheck = true;

  # ......
})
```

其中 `pname` `version` `src` `doCheck` 等属性都是可以通过 `overrideAttrs` 来覆写的，比如：

```nix
helloWithDebug = pkgs.hello.overrideAttrs (finalAttrs: previousAttrs: {
  doCheck = false;
});
```

上面这个例子中，`doCheck` 就是一个新的 Derivation，它的 `doCheck` 参数被改写为 `false`，而其他参数则沿用原来的值。

除了包源码中自定义的参数值外，我们也可以通过 `overrideAttrs` 直接改写 `stdenv.mkDerivation` 内部的默认参数，比如：

```nix
helloWithDebug = pkgs.hello.overrideAttrs (finalAttrs: previousAttrs: {
  separateDebugInfo = true;
});
```

具体的内部参数可以通过 `nix repl '<nixpkgs>'` 然后输入 `:e stdenv.mkDerivation` 来查看其源码。

### 3. Overlays {#overlays}

> [Chapter 3. Overlays - nixpkgs Manual](https://nixos.org/manual/nixpkgs/stable/#chap-overlays)

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

#### 模块化 overlays 配置

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
