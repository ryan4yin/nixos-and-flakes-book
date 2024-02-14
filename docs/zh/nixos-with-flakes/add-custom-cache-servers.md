# 添加自定义缓存服务器 {#add-custom-cache-servers}

## 什么是 Nix 缓存服务器 {#what-is-nix-cache-server}

Nix 提供了官方缓存服务器 <https://cache.nixos.org>，它缓存了 nixpkgs 中所有 packages 在常用 CPU 指令集下的构建结果，当你在本地执行 Nix 构建指令时，如果 Nix 在服务器中匹配到对应的缓存，就会直接下载该缓存文件，跳过耗时的本地编译构建从而大大提升构建速度。

## 为什么要添加自定义缓存服务器 {#why-add-custom-cache-servers}

> 注意：这里介绍的手段只能加速部分包的下载，许多 inputs 数据源仍然会从 Github 拉取。
> 另外如果找不到缓存，会执行本地构建，这通常仍然需要从国外下载源码与构建依赖，因此仍然会很慢。为了完全解决速度问题，仍然建议使用旁路由等局域网全局代理方案。

两个原因：

1. 添加镜像缓存服务器，用于加速下载。
   1. 官方缓存服务器在中国的访问速度非常慢，如果没有局域网全局代理的话，基本上是无法使用的。添加 国内的 ustc/sjtu/tuna 等 Nix 缓存镜像源可以缓解此问题。
2. 除了镜像源，还有一些第三方项目的缓存服务器，例如 nix-community 的缓存服务器 <https://nix-community.cachix.org>，可以大大提升这些第三方项目的构建速度。

## 如何添加自定义缓存服务器 {#how-to-add-custom-cache-servers}

Nix 中通过如下几个 options 来配置缓存服务器：

1. [substituters](https://nixos.org/manual/nix/stable/command-ref/conf-file#conf-substituters): 它是一个字符串数组，每个字符串都是一个缓存服务器的地址，Nix 会按照数组中的顺序依次尝试从这些服务器中查找缓存。
2. [trusted-public-keys](https://nixos.org/manual/nix/stable/command-ref/conf-file#conf-trusted-public-keys): 为了防范恶意攻击，Nix 默认启用 [require-sigs](https://nixos.org/manual/nix/stable/command-ref/conf-file#conf-require-sigs) 功能，只有附带了签名、且签名能被 `trusted-public-keys` 中的任意一个公钥验证通过的缓存，才会被 Nix 使用。因此我们需要将 `substituters` 对应的公钥添加到 `trusted-public-keys` 中。
   1. 国内的镜像源都是直接从官方缓存服务器中同步的，因此它们的公钥与官方缓存服务器的公钥是一致的，我们可以直接使用官方缓存服务器的公钥，无需额外配置。
   2. 这种完全依赖公钥机制的验证方式，实际是将安全责任转嫁给了用户。用户如果希望使用某个第三方库，但又希望使用它的第三方缓存服务器加快构建速度，那就必须自己承担对应的安全风险，自行决策是否将该缓存服务器的公钥添加进 `trusted-public-keys`。为了完全解决这个信任问题，Nix 推出了实验特性 [ca-derivations](https://nixos.wiki/wiki/Ca-derivations)，它不依赖 `trusted-public-keys` 进行签名校验，有兴趣的可以自行了解。

可通过如下几种方式来配置 `substituters` `trusted-public-keys` 两个参数：

1. 在 `/etc/nix/nix.conf` 中配置，这是全局配置，对所有用户生效。
   1. 可在任一 NixOS Module 中通过 `nix.settings.substituters` 与 `nix.settings.trusted-public-keys` 来声明式地生成 `/etc/nix/nix.conf`.
2. 在 flake 项目的 `flake.nix` 中通过 `nixConfig.substituters` 来配置，此配置仅对当前 flake 生效。
3. 可通过 `nix` 指令的 `--option substituters="http://xxx"` 参数来临时设定，此配置仅对当前指令生效。

上面三种方式中，除了第一种全局配置外，其他两种都是临时配置。如果同时使用了多种方式，那么后面的配置会直接覆盖前面的配置。

但临时设置 `substituters` 存在安全风险，前面我们也解释了基于 `trusted-public-keys` 的安全验证机制存在缺陷。
将一个不可信的缓存服务器添加到 substituters 中，可能会导致包含恶意内容的缓存被复制到 Nix Store 中。
因此 Nix 对 substituters 的临时设置做出了限制，要想通过第二三种方式设定 substituers，前提是满足如下任意一个条件：

1. [`/etc/nix/nix.conf` 中的 `trusted-users`](https://nixos.org/manual/nix/stable/command-ref/conf-file#conf-trusted-users) 参数列表中包含当前用户。
2. [`/etc/nix/nix.conf` 中的 `trusted-substituters`](https://nixos.org/manual/nix/stable/command-ref/conf-file#conf-trusted-substituters) 参数列表中包含我们临时指定的 substituters.

基于上述信息，如下是上述三种配置方式的示例。

首先是通过 `nix.settings` 声明式地配置系统层面的 substituters 与 trusted-public-keys, 将如下配置添加到 `/etc/nixos/configuration.nix` 或其他任一 NixOS Module 中即可：

```nix{7-27}
{
  lib,
  ...
}: {

  # ...
  nix.settings = {
    # given the users in this list the right to specify additional substituters via:
    #    1. `nixConfig.substituters` in `flake.nix`
    #    2. command line args `--options substituters http://xxx`
    trusted-users = ["ryan"];

    substituters = [
      # cache mirror located in China
      # status: https://mirror.sjtu.edu.cn/
      "https://mirror.sjtu.edu.cn/nix-channels/store"
      # status: https://mirrors.ustc.edu.cn/status/
      # "https://mirrors.ustc.edu.cn/nix-channels/store"

      "https://cache.nixos.org"
    ];

    trusted-public-keys = [
      # the default public key of cache.nixos.org, it's built-in, no need to add it here
      "cache.nixos.org-1:6NCHdD59X431o0gWypbMrAURkbJ16ZPMQFGspcDShjY="
    ];
  };

}
```

第二种方案是通过 `flake.nix` 配置 substituters 与 trusted-public-keys，将如下配置添加到 `flake.nix` 中即可：

> 如前所述，此配置中的 `nix.settings.trusted-users` 也是必须配置的，否则我们在这里设置的 `substituters` 将无法生效。

```nix{5-23,43-47}
{
  description = "NixOS configuration of Ryan Yin";

  # the nixConfig here only affects the flake itself, not the system configuration!
  nixConfig = {
    # override the default substituters
    substituters = [
      # cache mirror located in China
      # status: https://mirror.sjtu.edu.cn/
      "https://mirror.sjtu.edu.cn/nix-channels/store"
      # status: https://mirrors.ustc.edu.cn/status/
      # "https://mirrors.ustc.edu.cn/nix-channels/store"

      "https://cache.nixos.org"

      # nix community's cache server
      "https://nix-community.cachix.org"
    ];
    trusted-public-keys = [
      # nix community's cache server public key
      "nix-community.cachix.org-1:mB9FSh9qf2dCimDSUo8Zy7bkq5CX+/rkCWyvRCYg3Fs="
    ];
  };

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-23.11";

    # 省略若干配置...
  };

  outputs = inputs@{
      self,
      nixpkgs,
      ...
  }: {
    nixosConfigurations = {
      ai = nixpkgs.lib.nixosSystem {
        system = "x86_64-linux";
        modules = [
          ./hardware-configuration.nix
          ./configuration.nix

          {
            # given the users in this list the right to specify additional substituters via:
            #    1. `nixConfig.substituters` in `flake.nix`
            nix.settings.trusted-users = [ "ryan" ];
          }
          # 省略若干配置...
       ];
      };
    };
  };
}
```

以及第三种方案，使用如下命令在部署时临时指定 substituters 与 trusted-public-keys:

```bash
sudo nixos-rebuild switch --option substituters "https://nix-community.cachix.org" --option trusted-public-keys "nix-community.cachix.org-1:mB9FSh9qf2dCimDSUo8Zy7bkq5CX+/rkCWyvRCYg3Fs="
```

选择上述三种方案的任一一种进行配置并部署，部署成功之后，后续所有的包都会优先从国内镜像源查找缓存。

> 如果你的系统 Hostname 不是 `nixos-test`，你需要在 `flake.nix` 中修改 `nixosConfigurations` 的名称，或者使用 `--flake /etc/nixos#nixos-test` 来指定配置名称。

### Nix options 参数的 `extra-` 前缀

前面提到的三种方式配置的 `substituters` 会相互覆盖，但比较理想的情况应该是：

1. 在系统层面的 `/etc/nix/nix.conf` 中仅配置最通用的 substituters 与 trusted-public-keys，例如官方缓存服务器与国内镜像源。
2. 在每个 flake 项目的 `flake.nix` 中配置该项目特有的 substituters 与 trusted-public-keys，例如 nix-community 等非官方的缓存服务器。
3. 在构建 flake 项目时，应该将 `flake.nix` 与 `/etx/nix/nix.conf` 中配置的 substituters 与 trusted-public-keys **合并**使用。

Nix 提供了 [`extra-` 前缀](https://nixos.org/manual/nix/stable/command-ref/conf-file.html?highlight=extra#file-format) 实现了这个**合并**功能。

据官方文档介绍，如果 `xxx` 参数的值是一个列表，那么 `extra-xxx` 参数的值会被追加到 `xxx` 参数的值后面：

也就是说我们可以这么用：

```nix{7,13,37-58}
{
  description = "NixOS configuration of Ryan Yin";

  # the nixConfig here only affects the flake itself, not the system configuration!
  nixConfig = {
    # will be appended to the system-level substituters
    extra-substituters = [
      # nix community's cache server
      "https://nix-community.cachix.org"
    ];

    # will be appended to the system-level trusted-public-keys
    extra-trusted-public-keys = [
      # nix community's cache server public key
      "nix-community.cachix.org-1:mB9FSh9qf2dCimDSUo8Zy7bkq5CX+/rkCWyvRCYg3Fs="
    ];
  };

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-23.11";

    # 省略若干配置...
  };

  outputs = inputs@{
      self,
      nixpkgs,
      ...
  }: {
    nixosConfigurations = {
      ai = nixpkgs.lib.nixosSystem {
        system = "x86_64-linux";
        modules = [
          ./hardware-configuration.nix
          ./configuration.nix

          {
            # given the users in this list the right to specify additional substituters via:
            #    1. `nixConfig.substituters` in `flake.nix`
            nix.settings.trusted-users = [ "ryan" ];

            # the system-level substituters & trusted-public-keys
            nix.settings = {
              substituters = [
                # cache mirror located in China
                # status: https://mirror.sjtu.edu.cn/
                "https://mirror.sjtu.edu.cn/nix-channels/store"
                # status: https://mirrors.ustc.edu.cn/status/
                # "https://mirrors.ustc.edu.cn/nix-channels/store"
          
                "https://cache.nixos.org"
              ];
          
              trusted-public-keys = [
                # the default public key of cache.nixos.org, it's built-in, no need to add it here
                "cache.nixos.org-1:6NCHdD59X431o0gWypbMrAURkbJ16ZPMQFGspcDShjY="
              ];
            };

          }
          # 省略若干配置...
       ];
      };
    };
  };
}
```

## 通过本地 HTTP 代理加速包下载 {#use-local-http-proxy-to-speed-up-nix-package-download}

> 参考了 Issue: [roaming laptop: network proxy configuration - NixOS/nixpkgs](https://github.com/NixOS/nixpkgs/issues/27535#issuecomment-1178444327)

虽然前面提到了，旁路由可以完全解决 NixOS 的包下载速度问题，但是旁路由的配置比较麻烦，而且经常需要额外的软路由设备支持。

更多的用户会希望能直接通过本机运行的 HTTP 代理来加速包下载，这里介绍下怎么设置。

直接在 Terminal 中使用 `export HTTPS_PROXY=http://127.0.0.1:7890` 这类方式是无法生效的，因为 nix 实际干活的是一个叫 `nix-daemon` 的后台进程，而不是直接在 Terminal 中执行的命令。

要让 nix-daemon 使用代理，需要修改它的 systemd 配置，方法如下：

```bash
sudo mkdir /run/systemd/system/nix-daemon.service.d/
cat << EOF >/run/systemd/system/nix-daemon.service.d/override.conf
[Service]
Environment="http_proxy=socks5h://localhost:7891"
Environment="https_proxy=socks5h://localhost:7891"
Environment="all_proxy=socks5h://localhost:7891"
EOF
sudo systemctl daemon-reload
sudo systemctl restart nix-daemon
```

使用此方案，每次重启系统可能都需要重新执行一遍上述命令，因为 `/run` 目录是临时文件系统，重启后会被清空。

> 使用一些商用代理或公共代理时你可能会遇到 GitHub 下载时报 HTTP 403 错误（[nixos-and-flakes-book/issues/74](https://github.com/ryan4yin/nixos-and-flakes-book/issues/74)），
> 可尝试通过更换代理服务器或者设置 [access-tokens](https://github.com/NixOS/nix/issues/6536) 来解决。

