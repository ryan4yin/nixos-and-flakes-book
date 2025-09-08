# Flake 的 outputs {#flake-outputs}

`flake.nix` 中的 `outputs` 是一个 attribute
set，是整个 Flake 的构建结果，每个 Flake 都可以有许多不同的 outputs。

一些特定名称的 outputs 有特殊用途，会被某些 Nix 命令识别处理，比如：

- Nix packages: 名称为 `apps.<system>.<name>`, `packages.<system>.<name>` 或
  `legacyPackages.<system>.<name>` 的 outputs，都是 Nix 包，通常都是一个个应用程序。
  - 可以通过 `nix build .#name` 来构建某个 nix 包
- Nix Helper Functions: 名称为 `lib`
  的 outputs 是 Flake 函数库，可以被其他 Flake 作为 inputs 导入使用。
- Nix development environments: 名称为 `devShells` 的 outputs 是 Nix 开发环境
  - 可以通过 `nix develop` 命令来使用该 Output 创建开发环境
- NixOS configurations: 名称为 `nixosConfigurations.<hostname>`
  的 outputs，是 NixOS 的系统配置。
  - `nixos-rebuild switch .#<hostname>` 可以使用该 Output 来部署 NixOS 系统
- Nix templates: 名称为 `templates` 的 outputs 是 flake 模板
  - 可以通过执行命令 `nix flake init --template <reference>` 使用模板初始化一个 Flake 包
- 其他用户自定义的 outputs，可能被其他 Nix 相关的工具使用

细节详见官方文档 [Flakes Check - Nix Manual].

NixOS Wiki 中给出的使用案例：

```nix
{
  inputs = {
    # ......
  };

  outputs = { self, ... }@inputs: {
    # Executed by `nix flake check`
    checks."<system>"."<name>" = derivation;
    # Executed by `nix build .#<name>`
    packages."<system>"."<name>" = derivation;
    # Executed by `nix build .`
    packages."<system>".default = derivation;
    # Executed by `nix run .#<name>`
    apps."<system>"."<name>" = {
      type = "app";
      program = "<store-path>";
    };
    # Executed by `nix run . -- <args?>`
    apps."<system>".default = { type = "app"; program = "..."; };

    # Formatter (alejandra, nixfmt or nixpkgs-fmt)
    formatter."<system>" = derivation;
    # Used for nixpkgs packages, also accessible via `nix build .#<name>`
    legacyPackages."<system>"."<name>" = derivation;
    # Overlay, consumed by other flakes
    overlays."<name>" = final: prev: { };
    # Default overlay
    overlays.default = {};
    # Nixos module, consumed by other flakes
    nixosModules."<name>" = { config }: { options = {}; config = {}; };
    # Default module
    nixosModules.default = {};
    # Used with `nixos-rebuild --flake .#<hostname>`
    # nixosConfigurations."<hostname>".config.system.build.toplevel must be a derivation
    nixosConfigurations."<hostname>" = {};
    # Used by `nix develop .#<name>`
    devShells."<system>"."<name>" = derivation;
    # Used by `nix develop`
    devShells."<system>".default = derivation;
    # Hydra build jobs
    hydraJobs."<attr>"."<system>" = derivation;
    # Used by `nix flake init -t <flake>#<name>`
    templates."<name>" = {
      path = "<store-path>";
      description = "template description goes here?";
    };
    # Used by `nix flake init -t <flake>`
    templates.default = { path = "<store-path>"; description = ""; };
  };
}
```
