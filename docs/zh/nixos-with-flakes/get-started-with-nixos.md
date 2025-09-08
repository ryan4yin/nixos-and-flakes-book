# 开始使用 NixOS

了解了 Nix 语言的基本用法之后，我们就可以开始使用 Nix 语言来配置 NixOS 系统了。NixOS 的系统配置路径为
`/etc/nixos/configuration.nix`，它包含系统的所有声明式配置，如时区、语言、键盘布局、网络、用户、文件系统、启动项、桌面环境等等。

如果想要以可复现的方式修改系统的状态（这也是最推荐的方式），就需要手工修改
`/etc/nixos/configuration.nix` 文件，然后执行 `sudo nixos-rebuild switch`
命令来应用配置，此命令会根据配置文件生成一个新的系统环境，并将新的环境设为默认环境。同时上一个系统环境会被保留，而且会被加入到 grub 的启动项中，这确保了即使新的环境不能启动，也能随时回退到旧环境。

另一方面，`/etc/nixos/configuration.nix` 是传统的 Nix 配置方式，它依赖 `nix-channel`
配置的数据源，也没有任何版本锁定机制，实际无法确保系统的可复现性。 **更推荐使用的是 Nix
Flakes**，它可以确保系统的可复现性，同时也可以很方便地管理系统的配置。

我们下面首先介绍下通过 NixOS 默认的配置方式来管理系统，然后再过渡到更先进的 Nix Flakes.

## 使用 `/etc/nixos/configuration.nix` 配置系统 {#configuration-nix}

前面提过了这是传统的 Nix 配置方式，也是当前 NixOS 默认使用的配置方式，它依赖 `nix-channel`
配置的数据源，也没有任何版本锁定机制，实际无法确保系统的可复现性。

简单起见我们先使用这种方式来配置系统，后面会介绍 Flake 的使用。

比如要启用 ssh 并添加一个用户 ryan，只需要在 `/etc/nixos/configuration.nix`
中添加如下配置：

```nix{14-38}
# Edit this configuration file to define what should be installed on
# your system.  Help is available in the configuration.nix(5) man page
# and in the NixOS manual (accessible by running ‘nixos-help’).
{ config, pkgs, ... }:

{
  imports =
    [ # Include the results of the hardware scan.
      ./hardware-configuration.nix
    ];

  # 省略掉前面的配置......

  # 新增用户 ryan
  users.users.ryan = {
    isNormalUser = true;
    description = "ryan";
    extraGroups = [ "networkmanager" "wheel" ];
    openssh.authorizedKeys.keys = [
        # replace with your own public key
        "ssh-ed25519 <some-public-key> ryan@ryan-pc"
    ];
    packages = with pkgs; [
      firefox
    #  thunderbird
    ];
  };

  # 启用 OpenSSH 后台服务
  services.openssh = {
    enable = true;
    settings = {
      X11Forwarding = true;
      PermitRootLogin = "no"; # disable root login
      PasswordAuthentication = false; # disable password login
    };
    openFirewall = true;
  };

  # 省略其他配置......
}
```

这里我启用了 openssh 服务，为 ryan 用户添加了 ssh 公钥，并禁用了密码登录。

现在运行 `sudo nixos-rebuild switch`
部署修改后的配置，之后就可以通过 ssh 密钥远程登录到我的这台主机了。

> 如果你在部署配置时遇到了任何错误，都可以尝试在 `nixos-rebuild` 命令后面添加
> `--show-trace --print-build-logs --verbose` 参数来获取详细的错误信息。

这就是 NixOS 默认的声明式系统配置，要对系统做任何可复现的变更，都只需要修改
`/etc/nixos/configuration.nix` 文件，然后运行 `sudo nixos-rebuild switch` 部署变更即可。

`/etc/nixos/configuration.nix` 的所有配置项，可以在这几个地方查到：

- 直接 Google，比如 `Chrome NixOS` 就能找到 Chrome 相关的配置项，一般 NixOS
  Wiki 或 nixpkgs 仓库源码的排名会比较靠前。
- 在 [NixOS Options Search](https://search.nixos.org/options) 中搜索关键字
- 系统级别的配置，可以考虑在
  [Configuration - NixOS Manual](https://nixos.org/manual/nixos/unstable/index.html#ch-configuration)
  找找相关文档
- 直接在 [nixpkgs](https://github.com/NixOS/nixpkgs) 仓库中搜索关键字，读相关的源码。

## 参考

- [Overview of the NixOS Linux distribution](https://wiki.nixos.org/wiki/Overview_of_the_NixOS_Linux_distribution)
