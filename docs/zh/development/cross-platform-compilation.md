# 跨平台编译

首先在任何 Linux 平台上，都有两种方法进行跨平台构建。以在 x86_64 架构上构建 aarch64 架构程序为例，两种构建方法说明如下：

1. 使用 QEMU 模拟 aarch64 架构，然后在模拟器中编译程序
   1. 缺点是指令集模拟，性能低下
   2. 优点是能利用上 NixOS 的 binary cache，不需要自己编译所有内容
2. 使用交叉编译器编译 aarch64 架构的程序
   1. 缺点是无法利用 NixOS 的 binary
      cache，需要自己编译所有内容（交叉编译也有 cache，但是里面基本没啥东西）
   2. 优点是不需要指令集模拟，性能高

如果使用方法一，则需要在构建机的 NixOS 配置中启用 aarch64 架构的 binfmt_misc

如果使用方法二，就不需要启用 binfmt_misc 了，但是需要通过交叉编译工具链来执行编译。

## 交叉编译

nixpkgs 包含了一系列预定义好的交叉编译工具链，其名为 `pkgsCross`，我们先通过 `nix repl`
来看看有哪些工具链：

```shell
› nix repl '<nixpkgs>'
warning: future versions of Nix will require using `--file` to load a file
Welcome to Nix 2.13.3. Type :? for help.

Loading installable ''...
Added 19273 variables.
nix-repl> pkgsCross.<TAB>
pkgsCross.aarch64-android             pkgsCross.msp430
pkgsCross.aarch64-android-prebuilt    pkgsCross.musl-power
pkgsCross.aarch64-darwin              pkgsCross.musl32
pkgsCross.aarch64-embedded            pkgsCross.musl64
pkgsCross.aarch64-multiplatform       pkgsCross.muslpi
pkgsCross.aarch64-multiplatform-musl  pkgsCross.or1k
pkgsCross.aarch64be-embedded          pkgsCross.pogoplug4
pkgsCross.arm-embedded                pkgsCross.powernv
pkgsCross.armhf-embedded              pkgsCross.ppc-embedded
pkgsCross.armv7a-android-prebuilt     pkgsCross.ppc64
pkgsCross.armv7l-hf-multiplatform     pkgsCross.ppc64-musl
pkgsCross.avr                         pkgsCross.ppcle-embedded
pkgsCross.ben-nanonote                pkgsCross.raspberryPi
pkgsCross.fuloongminipc               pkgsCross.remarkable1
pkgsCross.ghcjs                       pkgsCross.remarkable2
pkgsCross.gnu32                       pkgsCross.riscv32
pkgsCross.gnu64                       pkgsCross.riscv32-embedded
pkgsCross.i686-embedded               pkgsCross.riscv64
pkgsCross.iphone32                    pkgsCross.riscv64-embedded
pkgsCross.iphone32-simulator          pkgsCross.rx-embedded
pkgsCross.iphone64                    pkgsCross.s390
pkgsCross.iphone64-simulator          pkgsCross.s390x
pkgsCross.loongarch64-linux           pkgsCross.sheevaplug
pkgsCross.m68k                        pkgsCross.vc4
pkgsCross.mingw32                     pkgsCross.wasi32
pkgsCross.mingwW64                    pkgsCross.x86_64-darwin
pkgsCross.mips-linux-gnu              pkgsCross.x86_64-embedded
pkgsCross.mips64-linux-gnuabi64       pkgsCross.x86_64-freebsd
pkgsCross.mips64-linux-gnuabin32      pkgsCross.x86_64-netbsd
pkgsCross.mips64el-linux-gnuabi64     pkgsCross.x86_64-netbsd-llvm
pkgsCross.mips64el-linux-gnuabin32    pkgsCross.x86_64-unknown-redox
pkgsCross.mipsel-linux-gnu
pkgsCross.mmix
```

如果想将一个 flake 全局的 `pkgs` 设置为交叉编译工具链，只需要在 `flake.nix`
中添加一个Module，示例如下：

```nix{14-20}
{
  description = "NixOS running on LicheePi 4A";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-25.05";
  };

  outputs = inputs@{ self, nixpkgs, ... }: {
    nixosConfigurations.lp4a = nixpkgs.lib.nixosSystem {
      # native platform
      system = "x86_64-linux";
      modules = [

        # add this module, to enable cross-compilation.
        {
          nixpkgs.crossSystem = {
            # target platform
            system = "riscv64-linux";
          };
        }

        # ...... other modules
      ];
    };
  };
}
```

模块中的 `nixpkgs.crossSystem` 参数用于将 `pkgs`
设置为交叉编译工具链，这样构建出的内容全都会是 `riscv64-linux` 架构的。

## 通过模拟系统进行跨平台编译

第二种方法是通过模拟系统进行跨平台编译，这种方法不需要交叉编译工具链。

要使用这种方法，首先你的构建机需要在配置中启用 binfmt_misc 模块，如果你的构建机是 NixOS，将如下配置添加到你的 NixOS
Module 即可启用 `aarch64-linux` 与 `riscv64-linux` 两种架构的模拟构建系统：

```nix{6}
{ ... }:
{
  # ......

  # Enable binfmt emulation.
  boot.binfmt.emulatedSystems = [ "aarch64-linux" "riscv64-linux" ];

  # ......
}
```

至于 `flake.nix`，它的设置方法非常简单，比前面交叉编译的设置还要简单，示例如下：

```nix{11}
{
  description = "NixOS running on LicheePi 4A";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-25.05";
  };

  outputs = inputs@{ self, nixpkgs, ... }: {
    nixosConfigurations.lp4a = nixpkgs.lib.nixosSystem {
      # native platform
      system = "riscv64-linux";
      modules = [
        # ...... other modules
      ];
    };
  };
}
```

可以看到我们未添加任何额外的模块，仅仅是指定了 `system` 为 `riscv64-linux`.
Nix 在构建时会自动检测当前系统是否为
`riscv64-linux`，如果不是，它会自动通过 QEMU 模拟系统进行构建，对用户而言这些底层操作完全是透明的。

## Linux binfmt_misc

前面只说了怎么用，如果你想了解更底层的细节，这里也简单介绍一下。

binfmt_misc 是 Linux 内核的一项功能，全称是混杂二进制格式的内核支持（Kernel Support for
miscellaneous Binary
Formats），它能够使 Linux 支持运行几乎任何 CPU 架构的程序，包括 X86_64、ARM64、RISCV64 等。

为了能够让 binfmt_misc 运行任意格式的程序，至少需要做到两点：特定格式二进制程序的识别方式，以及其对应的解释器位置。虽然 binfmt_misc 听上去很强大，其实现的方式却意外地很容易理解，类似于 bash 解释器通过脚本文件的第一行（如#!/usr/bin/python3）得知该文件需要通过什么解释器运行，binfmt_misc 也预设了一系列的规则，如读取二进制文件头部特定位置的魔数，或者根据文件扩展名（如.exe、.py）以判断可执行文件的格式，随后调用对应的解释器去运行该程序。Linux 默认的可执行文件格式是 elf，而 binfmt_misc 的出现拓宽了 Linux 的执行限制，将一点展开成一个面，使得各种各样的二进制文件都能选择它们对应的解释器执行。

注册一种格式的二进制程序需要将一行有 `:name:type:offset:magic:mask:interpreter:flags`
格式的字符串写入 `/proc/sys/fs/binfmt_misc/register` 中，格式的详细解释这里就略过了。

由于人工写入上述 binfmt_misc 的注册信息比较麻烦，社区提供了一个容器来帮助我们自动注册，这个容器就是 binfmt，运行一下该容器就能安装各种格式的 binfmt_misc 模拟器了，举个例子：

```shell
# 注册所有架构
podman run --privileged --rm tonistiigi/binfmt:latest --install all

# 仅注册常见的 arm/riscv 架构
docker run --privileged --rm tonistiigi/binfmt --install arm64,riscv64,arm
```

binfmt_misc 模块自 Linux 2.6.12-rc2 版本中引入，先后经历了几次功能上的略微改动。Linux
4.8 中新增“F”（fix
binary，固定二进制）标志位，使 mount 命名空间变更和 chroot 后的环境中依然能够正常调用解释器执行二进制程序。由于我们需要构建多架构容器，必须使用“F”标志位才能 binfmt_misc 在容器中正常工作，因此内核版本需要在 4.8 以上才可以。

总的来说，比起一般情况显式调用解释器去执行非原生架构程序，binfmt_misc 产生的一个重要意义在于透明性。有了 binfmt_misc 后，用户在执行程序时不需要再关心要用什么解释器去执行，好像任何架构的程序都能够直接执行一样，而可配置的“F”标志位更是锦上添花，使解释器程序在安装时立即就被加载进内存，后续的环境改变也不会影响执行过程。

## 自定义构建工具链

有时候我们会需要使用自定义的工具链进行构建，比如使用自己编译的 gcc，或者使用自己编译的 musl
libc 等等，这种修改可以通过 overlays 来实现。

举个例子，我们来尝试下使用使用不同的 gcc 版本，通过 `nix repl` 来测试下：

```shell
› nix repl -f '<nixpkgs>'
Welcome to Nix 2.13.3. Type :? for help.

Loading installable ''...
Added 17755 variables.

# 通过 overlays 替换掉 gcc
nix-repl> a = import <nixpkgs> { crossSystem = { config = "riscv64-unknown-linux-gnu"; }; overlays = [ (self: super: { gcc = self.gcc12; }) ]; }

# 查看下 gcc 版本，确实改成 12.2 了
nix-repl> a.pkgsCross.riscv64.stdenv.cc
«derivation /nix/store/jjvvwnf3hzk71p65x1n8bah3hrs08bpf-riscv64-unknown-linux-gnu-stage-final-gcc-wrapper-12.2.0.drv»

# 再看下未修改的 gcc 版本，还是 11.3
nix-repl> pkgs.pkgsCross.riscv64.stdenv.cc
«derivation /nix/store/pq3g0wq3yfc4hqrikr03ixmhqxbh35q7-riscv64-unknown-linux-gnu-stage-final-gcc-wrapper-11.3.0.drv»
```

那么如何在 Flakes 中使用这种方法呢？示例 `flake.nix` 内容如下:

```nix{13-20}
{
  description = "NixOS running on LicheePi 4A";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-25.05-small";
  };

  outputs = { self, nixpkgs, ... }:
  {
    nixosConfigurations.lp4a = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";
      modules = [
        {
          nixpkgs.crossSystem = {
            config = "riscv64-unknown-linux-gnu";
          };

          # 改用 gcc12
          nixpkgs.overlays = [ (self: super: { gcc = self.gcc12; }) ];
        }

        # other modules ......
      ];
    };
  };
}
```

上面的方法会替换掉全局的
`pkgs.gcc`，很可能会导致大量的缓存失效，从而需要在本地本地构建非常多的 Nix 包。

为了避免这个问题，更好的办法是创建一个新的 `pkgs`
实例，仅在构建我们想修改的包时才使用这个实例，`flake.nix` 示例如下：

```nix{10-19,34-37}
{
  description = "NixOS running on LicheePi 4A";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-25.05-small";
  };

  outputs = { self, nixpkgs, ... }: let
    # 自定义一个新的 pkgs 实例，使用 gcc12
    pkgs-gcc12 = import nixpkgs {
      localSystem = "x86_64-linux";
      crossSystem = {
        config = "riscv64-unknown-linux-gnu";
      };

      overlays = [
        (self: super: { gcc = self.gcc12; })
      ];
    };
  in {
    nixosConfigurations.lp4a = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";
      specialArgs = {
        # pass the new pkgs instance to the module
        inherit pkgs-gcc12;
      };
      modules = [
        {
          nixpkgs.crossSystem = {
            config = "riscv64-unknown-linux-gnu";
          };
        }

        ({pkgs-gcc12, ...}: {
          # 使用 pkgs-gcc12 实例
          environment.systemPackages = [ pkgs-gcc12.hello ];
        })

        # other modules ......
      ];
    };
  };
}
```

通过上述方法，我们可以很方便地自定义部分软件包的构建工具链，而不影响其他软件包的构建。

## References

- [Cross compilation - nix.dev](https://nix.dev/tutorials/cross-compilation)
- [容器镜像多架构支持介绍](https://www.cnblogs.com/frankming/p/16870285.html)
