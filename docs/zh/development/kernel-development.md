# Kernel Development

> WIP 本文还有待完善

一个我 licheepi4a 官方内核开发调试环境的 `flake.nix` 如下

```nix
{
  description = "NixOS running on LicheePi 4A";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-25.05-small";

    # custom kernel's source
    thead-kernel = {
      url = "github:revyos/thead-kernel/lpi4a";
      flake = false;
    };
  };

  outputs = inputs@{
    self
    ,nixpkgs
    ,thead-kernel
    ,... }:
  let
    pkgsKernel = import nixpkgs {
      localSystem = "x86_64-linux";
      crossSystem = {
        config = "riscv64-unknown-linux-gnu";
      };

      overlays = [
        (self: super: {
          # use gcc 13 to compile this custom kernel
          linuxPackages_thead = super.linuxPackagesFor (super.callPackage ./pkgs/kernel {
            src = thead-kernel;
            stdenv = super.gcc13Stdenv;
            kernelPatches = with super.kernelPatches; [
              bridge_stp_helper
              request_key_helper
            ];
          });
        })
      ];
    };
  in
  {
    nixosConfigurations.lp4a = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";

      specialArgs = {
        inherit nixpkgs pkgsKernel;
      };
      modules = [
        {
          # cross-compile this flake.
          nixpkgs.crossSystem = {
            system = "riscv64-linux";
          };
        }

        ./modules/licheepi4a.nix
        ./modules/sd-image-lp4a.nix
      ];
    };

    # use `nix develop .#kernel` to enter the environment with the custom kernel build environment available.
    # and then use `unpackPhase` to unpack the kernel source code and cd into it.
    # then you can use `make menuconfig` to configure the kernel.
    #
    # problem
    #   - using `make menuconfig` - Unable to find the ncurses package.
    devShells.x86_64-linux.kernel = pkgsKernel.linuxPackages_thead.kernel.dev;

    # use `nix develop .#fhs` to enter the fhs test environment defined here.
    devShells.x86_64-linux.fhs = let
      pkgs = import nixpkgs {
        system = "x86_64-linux";
      };
    in
      # the code here is mainly copied from:
      #   https://wiki.nixos.org/wiki/Linux_kernel#Embedded_Linux_Cross-compile_xconfig_and_menuconfig
      (pkgs.buildFHSUserEnv {
        name = "kernel-build-env";
        targetPkgs = pkgs_: (with pkgs_;
          [
            # we need theses packages to run `make menuconfig` successfully.
            pkgconfig
            ncurses

            pkgsKernel.gcc13Stdenv.cc
            gcc
          ]
          ++ pkgs.linux.nativeBuildInputs);
        runScript = pkgs.writeScript "init.sh" ''
          # set the cross-compilation environment variables.
          export CROSS_COMPILE=riscv64-unknown-linux-gnu-
          export ARCH=riscv
          export PKG_CONFIG_PATH="${pkgs.ncurses.dev}/lib/pkgconfig:"
          exec bash
        '';
      }).env;
  };
}
```

通过上面的 `flake.nix`，我可以通过 `nix develop .#kernel` 进入到内核的构建环境中，执行
`unpackPhase` 解压出内核源码。

但是不能执行 `make menuconfig` 进行内核的配置，因为该环境中缺少 `ncurses` 等包。

所以我第二步是退出再通过 `nix develop .#fhs` 进入到另一个添加了必需包的 FHS 环境中，再执行
`make menuconfig` 进行内核的配置，以及后续的构建调试。

## References

- [Linux kernel - NixOS Wiki](https://wiki.nixos.org/wiki/Linux_kernel)
- https://github.com/jordanisaacs/kernel-module-flake
