# 自定义 NIX_PATH 与 Flake Registry 

## NIX_PATH 介绍 {#nix-path-introduction}

Nix 搜索路径由环境变量 `NIX_PATH` 控制，它的格式与 Linux 的 `PATH` 环境变量一致，由冒号分隔的多个路径组成。

Nix 表达式中形如 `<name>` 的路径会被解析为 `NIX_PATH` 中名为 `name` 的路径。

这种使用方式在 Flakes 特性下已经不推荐使用了，因为它会导致 Flake 的构建结果依赖一个可变的环境变量 `NIX_PATH`，可复现能力大打折扣。

但是在某些场景下，我们还是需要使用 `NIX_PATH`，比如我们前面多次使用了 `nix repl '<nixpkgs>'` 命令，它就是使用了从 `NIX_PATH` 搜索到的 Nixpkgs。

## Flakes Registry 介绍 {#flakes-registry-introduction}

Flake Registry 是一个 Flake 注册中心，它可以帮助我们在使用 `nix run`, `nix shell` 等命令时，使用一个简短的 id 来代替长长的 flake 仓库地址。

默认情况下，Nix 会从 <https://github.com/NixOS/flake-registry/blob/master/flake-registry.json> 中找到这个 id 对应的 github 仓库地址。

比如说我们执行 `nix run nixpkgs#ponysay hello`，nix 会自动从上述 json 文件中找到 `nixpkgs` 对应的 github 仓库地址，然后下载这个仓库，再通过其中的 `flake.nix` 查找对应的 `ponysay` 包并运行它。


## 自定义 NIX_PATH 与 Flake Registry {#custom-nix-path-and-flake-registry-2}

前面说明了 `NIX_PATH` 与 Flake Registry 的作用。
在日常使用中，我们一般都会希望能在执行 `nix repl '<nixpkgs>'`, `nix run nixpkgs#ponysay hello` 等命令时，使用的 nixpkgs 与系统一致，这就需要我们自定义 `NIX_PATH` 与 Flake Registry。

在你的 NixOS 配置中，添加如下 module 即可实现上述需求：

```nix
{lib, nixpkgs, ...}: {
  # make `nix run nixpkgs#nixpkgs` use the same nixpkgs as the one used by this flake.
  nix.registry.nixpkgs.flake = nixpkgs;
  nix.channel.enable = false; # remove nix-channel related tools & configs, we use flakes instead.

  # but NIX_PATH is still used by many useful tools, so we set it to the same value as the one used by this flake.
  # Make `nix repl '<nixpkgs>'` use the same nixpkgs as the one used by this flake.
  environment.etc."nix/inputs/nixpkgs".source = "${nixpkgs}";
  # https://github.com/NixOS/nix/issues/9574
  nix.settings.nix-path = lib.mkForce "nixpkgs=/etc/nix/inputs/nixpkgs";
}
```

## 参考

- [Chapter 15. Nix Search Paths - Nix Pills](https://nixos.org/guides/nix-pills/nix-search-paths.html)

