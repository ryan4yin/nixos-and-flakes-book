# Overlays

前面介绍的 `pkgs.xxx.override { ... }` 跟
`pkgs.xxx.overrideAttrs (finalAttrs: previousAttrs: { ... });`
都不会修改 pkgs 实例中原有的 Derivation，而是返回一个新的 Derivation，因此它们只适合作为局部参数使用。但如果你需要覆写的 Derivation 还被其他 Nix 包所依赖，那其他 Nix 包使用的仍然会是未被修改的 Derivation.

为了解决这个问题，Nix 提供了 overlays 这个功能。简单的说，Overlays 可以全局修改 pkgs 中的 Derivation.

在传统的 Nix 环境中，Nix 默认会自动使用 `~/.config/nixpkgs/overlays.nix`
`~/.config/nixpkgs/overlays/*.nix` 这类路径下的所有 overlays 配置。

但是在使用了 Flakes 特性后，为了确保系统的可复现性，Flake 不能依赖任何 Git 仓库之外的配置，所以这种旧的配置方式就不再适用了。

在使用 `flake.nix` 配置你的 NixOS 时，Home Manager 与 NixOS 都提供了 `nixpkgs.overlays`
这个 option 来引入 overlays, 相关文档：

- [home-manager docs - `nixpkgs.overlays`](https://nix-community.github.io/home-manager/options.xhtml#opt-nixpkgs.overlays)
- [nixpkgs source code - `nixpkgs.overlays`](https://github.com/NixOS/nixpkgs/blob/30d7dd7e7f2cba9c105a6906ae2c9ed419e02f17/nixos/modules/misc/nixpkgs.nix#L169)

举个例子，如下内容就是一个加载 Overlays 的 Module，它既可以用做 Home Manager
Module，也可以用做 NixOS Module，因为这俩定义完全是一致的：

> 不过我使用发现，Home
> Manager 毕竟是个外部组件，而且现在全都用的 unstable 分支，这导致 Home Manager
> Module 有时候会有点小毛病，因此更建议以 NixOS Module 的形式引入 overlays

```nix
# ./overlays/default.nix
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
    # 这里 ./overlays/overlay3/default.nix 中的内容格式与上面的一致
    # 都是 `final: prev: { xxx = prev.xxx.override { ... }; }`
    (import ./overlay3)
  ];
}
```

上面的例子中，我们定义了三个 overlays:

1. Overlay 1 修改了 `google-chrome` 的 Derivation，增加了一个代理服务器的命令行参数。
2. Overlay 2 修改了 `steam` 的 Derivation，增加了额外的包和环境变量。
3. Overlay 3 被定义在一个单独的文件 `./overlays/overlay3/default.nix` 中。

一个将上述配置作为 NixOS Module 引入的 `flake.nix` 示例如下：

```nix
# ./flake.nix
{
  inputs = {
    # ...
  };

  outputs = inputs@{ nixpkgs ... }: {
    nixosConfigurations = {
      my-nixos = nixpkgs.lib.nixosSystem {
        system = "x86_64-linux";
        modules = [
          ./configuration.nix

          # 引入定义了 overlays 的 Module
          (import ./overlays)
        ];
      };
    };
  };
}
```

这里只是个示例配置，实际使用时，请根据你自己的需求来编写 overlays 配置。

## 多个使用不同 overlays 的 Nixpkgs 实例

上面介绍的 `nixpkgs.overlays = [...];`
是直接修改全局的默认 nixpkgs 实例，如果你的 overlays 改了比较底层的包，可能会影响到其他模块。坏处之一是会导致大量的本地编译（因为二进制缓存失效了），二是被影响的包功能可能也会出问题。

如果你只是想在某个地方使用 overlays，而不想影响到全局的 nixpkgs 实例，可以通过实例化多个 nixpkgs 实例来实现。下一节
[多 nixpkgs 实例的妙用](./multiple-nixpkgs.md) 将会介绍如何做到这一点。

## 参考

- [Chapter 3. Overlays - nixpkgs Manual](https://nixos.org/manual/nixpkgs/stable/#chap-overlays)
