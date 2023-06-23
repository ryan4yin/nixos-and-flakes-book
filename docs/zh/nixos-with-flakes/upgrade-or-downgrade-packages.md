
## 升级与降级软件包 {#rollback-package-version}

在使用 Nix Flakes 后，目前大家用得比较多的都是 `nixos-unstable` 分支的 nixpkgs，有时候就会遇到一些 bug，比如我最近（2023/5/6）就遇到了 [chrome/vscode 闪退的问题](https://github.com/swaywm/sway/issues/7562)。

这时候就需要退回到之前的版本，在 Nix Flakes 中，所有的包版本与 hash 值与其 input 数据源的 git commit 是一一对应的关系，因此回退某个包的到历史版本，就需要锁定其 input 数据源的 git commit.

为了实现上述需求，首先修改 `/etc/nixos/flake.nix`，示例内容如下（主要是利用 `specialArgs` 参数）：

```nix
{
  description = "NixOS configuration of Ryan Yin"

  inputs = {
    # 默认使用 nixos-unstable 分支
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";

    # 最新 stable 分支的 nixpkgs，用于回退个别软件包的版本，当前最新版本为 22.11
    nixpkgs-stable.url = "github:nixos/nixpkgs/nixos-22.11";

    # 另外也可以使用 git commit hash 来锁定版本，这是最彻底的锁定方式
    nixpkgs-fd40cef8d.url = "github:nixos/nixpkgs/fd40cef8d797670e203a27a91e4b8e6decf0b90c";
  };

  outputs = inputs@{
    self,
    nixpkgs,
    nixpkgs-stable,
    nixpkgs-fd40cef8d,
    ...
  }: {
    nixosConfigurations = {
      nixos-test = nixpkgs.lib.nixosSystem rec {
        system = "x86_64-linux";

        # 核心参数是这个，将非默认的 nixpkgs 数据源传到其他 modules 中
        specialArgs = {
          # 注意每次 import 都会生成一个新的 nixpkgs 实例
          # 这里我们直接在 flake.nix 中创建实例， 再传递到其他子 modules 中使用
          # 这样能有效重用 nixpkgs 实例，避免 nixpkgs 实例泛滥。
          pkgs-stable = import nixpkgs-stable {
            system = system;  # 这里递归引用了外部的 system 属性
            # 为了拉取 chrome 等软件包，需要允许安装非自由软件
            config.allowUnfree = true;
          };

          pkgs-fd40cef8d = import nixpkgs-fd40cef8d {
            system = system;
            config.allowUnfree = true;
          };
        };
        modules = [
          ./hosts/nixos-test

          # 省略其他模块配置...
        ];
      };
    };
  };
}
```

然后在你对应的 module 中使用该数据源中的包，一个 Home Manager 的子模块示例：

```nix
{
  pkgs,
  config,
  # nix 会从 flake.nix 的 specialArgs 查找并注入此参数
  pkgs-stable,
  # pkgs-fd40cef8d,  # 也可以使用固定 hash 的 nixpkgs 数据源
  ...
}:

{
  # 这里从 pkg-stable 中引用包
  home.packages = with pkgs-stable; [
    firefox-wayland

    # chrome wayland support was broken on nixos-unstable branch, so fallback to stable branch for now
    # https://github.com/swaywm/sway/issues/7562
    google-chrome
  ];

  programs.vscode = {
    enable = true;
    package = pkgs-stable.vscode;  # 这里也一样，从 pkgs-stable 中引用包
  };
}
```

配置完成后，通过 `sudo nixos-rebuild switch` 部署即可将 firefox/chrome/vscode 三个软件包回退到 stable 分支的版本。

> 根据 @fbewivpjsbsby 补充的文章 [1000 instances of nixpkgs](https://discourse.nixos.org/t/1000-instances-of-nixpkgs/17347)，在子模块中用 `import` 来定制 `nixpkgs` 不是一个好的习惯，因为每次 `import` 都会重新求值并产生一个新的 nixpkgs 实例，在配置越来越多时会导致构建时间变长、内存占用变大。所以这里改为了在 `flake.nix` 中创建所有 nixpkgs 实例。
