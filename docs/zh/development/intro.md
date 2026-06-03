# 在 NixOS 上进行开发工作

由于 NixOS 自身可复现的特性，它非常适合用于搭建开发环境。但是如果你想直接将在其他发行版上的环境搭建经验用在 NixOS 上，可能会遇到许多问题，因为 NixOS 有自己的一套逻辑在，下面我们先对此稍作说明。

在本章中我们先学习一下 Nix
Flakes 开发环境的实现原理，后面的章节再按使用场景介绍一些更具体的内容。

## 通过 `nix shell` 创建开发环境

在 NixOS 上，最简单的创建开发环境的方法是使用
`nix shell`，它会创建一个含有指定 Nix 包的 shell 环境。

示例：

```shell
# hello 不存在
› hello
hello: command not found

# 进入到一个含有 hello 与 cowsay 的 shell 环境
# 可以指定多个包，用空格分隔
› nix shell nixpkgs#hello nixpkgs#cowsay

# hello 可以用了
› hello
Hello, world!

# cowsay 也可以用了
› cowsay "Hello, world!"
 _______
< hello >
 -------
        \   ^__^
         \  (oo)\_______
            (__)\       )\/\
                ||----w |
                ||     ||
```

`nix shell` 非常适合用于临时试用一些软件包或者快速创建一个干净的环境。

## 创建与使用开发环境

`nix shell` 用起来非常简单，但它并不够灵活，对于更复杂的开发环境管理，我们需要使用
`pkgs.mkShell` 与 `nix develop`。

在 Nix Flakes 中，我们可以通过 `pkgs.mkShell { ... }` 来定义一个项目环境，通过
`nix develop` 来打开一个该开发环境的交互式 Bash Shell.

为了更好的使用上述两个功能，我们先来看看它们的原理。

[`pkgs.mkShell`] 的源码如下：

```nix
{ lib, stdenv, buildEnv }:

# A special kind of derivation that is only meant to be consumed by the
# nix-shell.
{ name ? "nix-shell"
, # a list of packages to add to the shell environment
  packages ? [ ]
, # propagate all the inputs from the given derivations
  inputsFrom ? [ ]
, buildInputs ? [ ]
, nativeBuildInputs ? [ ]
, propagatedBuildInputs ? [ ]
, propagatedNativeBuildInputs ? [ ]
, ...
}@attrs:
let
  mergeInputs = name:
    (attrs.${name} or [ ]) ++
    (lib.subtractLists inputsFrom (lib.flatten (lib.catAttrs name inputsFrom)));

  rest = builtins.removeAttrs attrs [
    "name"
    "packages"
    "inputsFrom"
    "buildInputs"
    "nativeBuildInputs"
    "propagatedBuildInputs"
    "propagatedNativeBuildInputs"
    "shellHook"
  ];
in

stdenv.mkDerivation ({
  inherit name;

  buildInputs = mergeInputs "buildInputs";
  nativeBuildInputs = packages ++ (mergeInputs "nativeBuildInputs");
  propagatedBuildInputs = mergeInputs "propagatedBuildInputs";
  propagatedNativeBuildInputs = mergeInputs "propagatedNativeBuildInputs";

  shellHook = lib.concatStringsSep "\n" (lib.catAttrs "shellHook"
    (lib.reverseList inputsFrom ++ [ attrs ]));

  phases = [ "buildPhase" ];

  # ......

  # when distributed building is enabled, prefer to build locally
  preferLocalBuild = true;
} // rest)
```

可以看到 `pkgs.mkShell { ... }` 本质上就是一个特殊的 Derivation（Nix 包），它的 `name`
`buildInputs` 等参数都是可自定义的，而 `shellHook` 则是一个特殊的参数，它会在
`nix develop` 进入该环境时被执行。

如下是一份 `flake.nix` 文件，它定义了一个 nodejs 24 的开发环境：

```nix
{
  description = "A Nix-flake-based Node.js development environment";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-26.05";
  };

  outputs = { self , nixpkgs ,... }: let
    # system should match the system you are running on
    system = "x86_64-linux";
  in {
    devShells."${system}".default = let
      pkgs = import nixpkgs { inherit system; };
    in pkgs.mkShell {
      # create an environment with nodejs, pnpm, and yarn
      packages = with pkgs; [
        nodejs_24
        pnpm
        (yarn.override { nodejs = nodejs_24; })
      ];

      shellHook = ''
        echo "node `node --version`"
      '';
    };
  };
}
```

建个空文件夹，将上面的配置保存为 `flake.nix`，然后执行 `nix develop`（或者更精确点，可以用
`nix develop .#default`），首先会打印出当前 nodejs 的版本，之后 `node` `pnpm` `yarn`
等命令就都能正常使用了。

## 在开发环境中使用 zsh/fish 等其他 shell

`pkgs.mkShell` 默认使用 `bash`，但是你也可以通过在 `shellHook` 中添加 `exec <your-shell>`
来使用 `zsh` 或者 `fish` 等其他 shell。

示例如下：

```nix
{
  description = "A Nix-flake-based Node.js development environment";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-26.05";
  };

  outputs = { self , nixpkgs ,... }: let
    # system should match the system you are running on
    system = "x86_64-linux";
  in {
    devShells."${system}".default = let
      pkgs = import nixpkgs { inherit system; };
    in pkgs.mkShell {
      # create an environment with nodejs_24, pnpm, and yarn
      packages = with pkgs; [
        nodejs_24
        pnpm
        (yarn.override { nodejs = nodejs_24; })
        nushell
      ];

      shellHook = ''
        echo "node `node --version`"
        exec nu
      '';
    };
  };
}
```

使用上面的 `flake.nix` 配置，`nix develop` 将进入一个 nodejs 24 的开发环境，同时使用
`nushell` 作为交互式 shell.

## 通过 `pkgs.runCommand` 创建开发环境

`pkgs.mkShell` 创建的 derivation 不能直接使用，必须通过 `nix develop` 进入到该环境中。

实际上我们也可以通过 `pkgs.stdenv.mkDerivation` 来创建一个包含所需软件包的 shell
wrapper, 这样就能直接通过执行运行该 wrapper 来进入到该环境中。

直接使用 `mkDerivation`
略显繁琐，Nixpkgs 提供了一些更简单的函数来帮助我们创建这类 wrapper，比如
`pkgs.runCommand`.

示例：

```nix
{
  description = "A Nix-flake-based Node.js development environment";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-26.05";
  };

  outputs = { self , nixpkgs ,... }: let
    # system should match the system you are running on
    system = "x86_64-linux";
  in {
    packages."${system}".dev = let
      pkgs = import nixpkgs { inherit system; };
      packages = with pkgs; [
          nodejs_22
          pnpm
          nushell
      ];
    in pkgs.runCommand "dev-shell" {
      # Dependencies that should exist in the runtime environment
      buildInputs = packages;
      # Dependencies that should only exist in the build environment
      nativeBuildInputs = [ pkgs.makeWrapper ];
    } ''
      mkdir -p $out/bin/
      ln -s ${pkgs.nushell}/bin/nu $out/bin/dev-shell
      wrapProgram $out/bin/dev-shell --prefix PATH : ${pkgs.lib.makeBinPath packages}
    '';
  };
}
```

然后执行 `nix run .#dev` 或者 `nix shell .#dev --command 'dev-shell'`，就能进入一个nushell
session，可以在其中正常使用 `node` `pnpm` 命令.

这种方式生成的 wrapper 是一个可执行文件，它实际不依赖 `nix run`
命令，比如说我们可以直接通过 NixOS 的 `environment.systemPackages`
来安装这个 wrapper，然后直接执行它：

```nix
{pkgs, lib, ...}:{

  environment.systemPackages = [
    # 将 dev-shell 安装到系统环境中
    (let
      packages = with pkgs; [
          nodejs_22
          pnpm
          nushell
      ];
    in pkgs.runCommand "dev-shell" {
      # Dependencies that should exist in the runtime environment
      buildInputs = packages;
      # Dependencies that should only exist in the build environment
      nativeBuildInputs = [ pkgs.makeWrapper ];
    } ''
      mkdir -p $out/bin/
      ln -s ${pkgs.nushell}/bin/nu $out/bin/dev-shell
      wrapProgram $out/bin/dev-shell --prefix PATH : ${pkgs.lib.makeBinPath packages}
    '')
  ];
}
```

将上述配置添加到任一 NixOS Module 中，再通过 `sudo nixos-rebuild switch`
部署后，就能直接通过 `dev-shell` 命令进入到该开发环境，这就是 `pkgs.runCommand` 相比
`pkgs.mkShell` 的特别之处。

相关源代码：

- [pkgs/build-support/trivial-builders/default.nix - runCommand]
- [pkgs/build-support/setup-hooks/make-wrapper.sh]

## 进入任何 Nix 包的构建环境

现在再来看看 `nix develop`，先读下 `nix develop --help` 输出的帮助文档：

```
Name
    nix develop - run a bash shell that provides the build environment of a derivation

Synopsis
    nix develop [option...] installable
# ......
```

可以看到 `nix develop` 接受的参数是
`installable`，这说明我们可以通过它进入任何一个 installable 的 Nix 包的开发环境，而不仅仅是
`pkgs.mkShell` 创建的环境。

默认情况下，`nix develop` 命令会尝试 flake outputs 中的如下属性：

- `devShells.<system>.default`
- `packages.<system>.default`

而如果我们通过 `nix develop /path/to/flake#<name>` 来指定了 flake 包地址以及 flake output
name，那么 `nix develop` 命令会尝试 flake outputs 中的如下属性：

- `devShells.<system>.<name>`
- `packages.<system>.<name>`
- `legacyPackages.<system>.<name>`

现在来尝试一下，首先测试下，确认我当前环境中没有 `c++` `g++` 这这些编译相关的命令：

```shell
ryan in 🌐 aquamarine in ~
› c++
c++: command not found

ryan in 🌐 aquamarine in ~
› g++
g++: command not found
```

现在通过 `nix develop` 进入到 `hello` 的构建环境，然后再次测试下：

```shell
# login to the build environment of the package `hello`
ryan in 🌐 aquamarine in ~
› nix develop nixpkgs#hello

ryan in 🌐 aquamarine in ~ via ❄️  impure (hello-2.12.1-env)
› env | grep CXX
CXX=g++

ryan in 🌐 aquamarine in ~ via ❄️  impure (hello-2.12.1-env)
› c++ --version
g++ (GCC) 12.3.0
Copyright (C) 2022 Free Software Foundation, Inc.
This is free software; see the source for copying conditions.  There is NO
warranty; not even for MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

ryan in 🌐 aquamarine in ~ via ❄️  impure (hello-2.12.1-env)
› g++ --version
g++ (GCC) 12.3.0
Copyright (C) 2022 Free Software Foundation, Inc.
This is free software; see the source for copying conditions.  There is NO
warranty; not even for MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
```

可以看到 `CXX` `CXXCPP` 环境变量已经被设置好了，而且 `c++` `g++` 等命令也可以正常使用了。

此外我们还可以正常调用 `hello` 这个 Nix 包的各构建阶段命令：

> 提前说明下，一个 Nix 包的所有构建阶段及其默认的执行顺序为：`$prePhases unpackPhase patchPhase $preConfigurePhases configurePhase $preBuildPhases buildPhase checkPhase $preInstallPhases installPhase fixupPhase installCheckPhase $preDistPhases distPhase $postPhases`

```shell
# 解压源码包
ryan in 🌐 aquamarine in /tmp/xxx via ❄️  impure (hello-2.12.1-env)
› unpackPhase
unpacking source archive /nix/store/pa10z4ngm0g83kx9mssrqzz30s84vq7k-hello-2.12.1.tar.gz
source root is hello-2.12.1
setting SOURCE_DATE_EPOCH to timestamp 1653865426 of file hello-2.12.1/ChangeLog

ryan in 🌐 aquamarine in /tmp/xxx via ❄️  impure (hello-2.12.1-env)
› ls
hello-2.12.1

ryan in 🌐 aquamarine in /tmp/xxx via ❄️  impure (hello-2.12.1-env)
› cd hello-2.12.1/

# generate Makefile
ryan in 🌐 aquamarine in /tmp/xxx/hello-2.12.1 via ❄️  impure (hello-2.12.1-env)
› configurePhase
configure flags: --prefix=/tmp/xxx/outputs/out --prefix=/tmp/xxx/outputs/out
checking for a BSD-compatible install... /nix/store/02dr9ymdqpkb75vf0v1z2l91z2q3izy9-coreutils-9.3/bin/install -c
checking whether build environment is sane... yes
checking for a thread-safe mkdir -p... /nix/store/02dr9ymdqpkb75vf0v1z2l91z2q3izy9-coreutils-9.3/bin/mkdir -p
checking for gawk... gawk
checking whether make sets $(MAKE)... yes
checking whether make supports nested variables... yes
checking for gcc... gcc
# ......
checking that generated files are newer than configure... done
configure: creating ./config.status
config.status: creating Makefile
config.status: creating po/Makefile.in
config.status: creating config.h
config.status: config.h is unchanged
config.status: executing depfiles commands
config.status: executing po-directories commands
config.status: creating po/POTFILES
config.status: creating po/Makefile

# build the package
ryan in 🌐 aquamarine in /tmp/xxx/hello-2.12.1 via C v12.3.0-gcc via ❄️  impure (hello-2.12.1-env) took 2s
› buildPhase
build flags: SHELL=/run/current-system/sw/bin/bash
make  all-recursive
make[1]: Entering directory '/tmp/xxx/hello-2.12.1'
# ......
ranlib lib/libhello.a
gcc  -g -O2   -o hello src/hello.o  ./lib/libhello.a
make[2]: Leaving directory '/tmp/xxx/hello-2.12.1'
make[1]: Leaving directory '/tmp/xxx/hello-2.12.1'

# run the built program
ryan in 🌐 aquamarine in /tmp/xxx/hello-2.12.1 via C v12.3.0-gcc via ❄️  impure (hello-2.12.1-env)
› ./hello
Hello, world!
```

这种用法的主要应用场景是调试某个 Nix 包的构建过程，或者在某个 Nix 包的构建环境中执行一些命令。

## `nix build`

`nix build` 用于构建一个软件包，并在当前目录下创建一个名为 `result`
的符号链接，链接到该构建结果。

一个示例：

```bash
# 构建 `nixpkgs` flake 中的 `ponysay` 这个包
nix build "nixpkgs#ponysay"
# 使用构建出来的 ponysay 命令
› ./result/bin/ponysay 'hey buddy!'
 ____________
< hey buddy! >
 ------------
     \
      \
       \
       ▄▄  ▄▄ ▄ ▄
    ▀▄▄▄█▄▄▄▄▄█▄▄▄
   ▀▄███▄▄██▄██▄▄██
  ▄██▄███▄▄██▄▄▄█▄██
 █▄█▄██▄█████████▄██
  ▄▄█▄█▄▄▄▄▄████████
 ▀▀▀▄█▄█▄█▄▄▄▄▄█████         ▄   ▄
    ▀▄████▄▄▄█▄█▄▄██       ▄▄▄▄▄█▄▄▄
    █▄██▄▄▄▄███▄▄▄██    ▄▄▄▄▄▄▄▄▄█▄▄
    ▀▄▄██████▄▄▄████    █████████████
       ▀▀▀▀▀█████▄▄ ▄▄▄▄▄▄▄▄▄▄██▄█▄▄▀
            ██▄███▄▄▄▄█▄▄▀  ███▄█▄▄▄█▀
            █▄██▄▄▄▄▄████   ███████▄██
            █▄███▄▄█████    ▀███▄█████▄
            ██████▀▄▄▄█▄█    █▄██▄▄█▄█▄
           ███████ ███████   ▀████▄████
           ▀▀█▄▄▄▀ ▀▀█▄▄▄▀     ▀██▄▄██▀█
                                ▀  ▀▀█
```

## 使用 `nix profile` 分别管理日常娱乐环境跟开发环境

`nix profile`
是 NixOS 中用于管理用户环境的工具，它可以用于创建管理多个用户环境，并在需要时切换到不同的环境。

与 `nix develop` 不同，`nix profile`
管理的是用户级别的系统环境，而不是临时创建的一个 shell 环境，因此它对 Jetbrains IDE /
VSCode 等 IDE 的兼容性会好很多，不会出现无法在 IDE 内使用我们配置好的开发环境的情况。

TODO 未完待续

## 其他命令

其他还有些 `nix flake init` 之类的命令，请自行查阅 [New Nix Commands][New Nix Commands]
学习研究，这里就不详细介绍了。

## References

- [pkgs.mkShell - nixpkgs manual](https://nixos.org/manual/nixpkgs/stable/#sec-pkgs-mkShell)
- [A minimal nix-shell](https://fzakaria.com/2021/08/02/a-minimal-nix-shell.html)
- [Wrapping packages - NixOS Cookbook](https://wiki.nixos.org/wiki/Nix_Cookbook#Wrapping_packages)
- [One too many shell, Clearing up with nix' shells nix shell and nix-shell - Yannik Sander](https://blog.ysndr.de/posts/guides/2021-12-01-nix-shells/)
- [Shell Scripts - NixOS Wiki](https://wiki.nixos.org/wiki/Shell_Scripts)

[New Nix Commands]: https://nixos.org/manual/nix/stable/command-ref/new-cli/nix.html
[pkgs/build-support/trivial-builders/default.nix - runCommand]: https://github.com/NixOS/nixpkgs/blob/nixos-26.05/pkgs/build-support/trivial-builders/default.nix#L25-L54
[pkgs/build-support/setup-hooks/make-wrapper.sh]: https://github.com/NixOS/nixpkgs/blob/nixos-26.05/pkgs/build-support/setup-hooks/make-wrapper.sh
[`pkgs.mkShell`]: https://github.com/NixOS/nixpkgs/blob/nixos-26.05/pkgs/build-support/mkshell/default.nix
